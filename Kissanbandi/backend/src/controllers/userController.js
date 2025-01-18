const User = require('../models/User');
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { sendEmail, emailTemplates } = require('../utils/email');
const crypto = require('crypto');
const { promisify } = require('util');

// Register new user
exports.register = async (req, res) => {
  try {
    const { email, name } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const user = new User(req.body);
    
    // Generate verification token
    console.log('Generating verification token for:', email);
    const verificationToken = user.generateVerificationToken();
    
    try {
      await user.save();
      console.log('User saved successfully:', user._id);
    } catch (saveError) {
      console.error('Error saving user:', saveError);
      return res.status(400).json({ error: saveError.message });
    }

    // Send verification email
    const verificationURL = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    console.log('Verification URL:', verificationURL);
    
    const emailTemplate = emailTemplates.verification(name, verificationURL);
    try {
      await sendEmail({
        email: user.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html
      });
      console.log('Verification email sent successfully');
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      // Don't return error here, still send back success response
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: user.toPublicProfile(),
      message: 'Please check your email to verify your account'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const waitMinutes = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
      return res.status(401).json({
        error: `Account is locked. Please try again in ${waitMinutes} minutes`
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.handleFailedLogin();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(401).json({
        error: 'Please verify your email first',
        isEmailVerified: false
      });
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: user.toPublicProfile()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin login
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('\n=== Admin Login Attempt ===');
    console.log('Login attempt for email:', email);

    // Find user
    const user = await User.findOne({ email });
    console.log('User found in database:', !!user);
    
    if (!user) {
      console.log('Authentication failed: User not found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Log user details (excluding sensitive data)
    console.log('User details:', {
      id: user._id,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      loginAttempts: user.loginAttempts,
      lockUntil: user.lockUntil
    });

    // Check if user is admin
    if (user.role !== 'admin') {
      console.log('Authentication failed: User is not an admin');
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const waitMinutes = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
      console.log('Authentication failed: Account is locked');
      console.log('Lock expires in:', waitMinutes, 'minutes');
      return res.status(401).json({
        error: `Account is locked. Please try again in ${waitMinutes} minutes`
      });
    }

    // Check password
    console.log('Attempting password comparison');
    console.log('Stored password hash:', user.password);
    const isMatch = await user.comparePassword(password);
    console.log('Password match result:', isMatch);

    if (!isMatch) {
      console.log('Authentication failed: Invalid password');
      await user.handleFailedLogin();
      console.log('Updated login attempts:', user.loginAttempts);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Reset login attempts on successful login
    console.log('Authentication successful, resetting login attempts');
    await user.resetLoginAttempts();

    // Generate token with admin role
    const token = jwt.sign(
      { userId: user._id, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    console.log('JWT token generated successfully');

    console.log('=== Login Process Complete ===\n');

    res.json({
      token,
      user: user.toPublicProfile()
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Verify email
exports.verifyEmail = async (req, res) => {
  try {
    if (!req.params.token) {
      return res.status(400).json({
        error: 'Verification token is required'
      });
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    console.log('Verifying email with token:', hashedToken);

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      console.log('No user found with token:', hashedToken);
      return res.status(400).json({
        error: 'Invalid or expired verification token'
      });
    }

    console.log('User found:', user._id);

    // Update verification status and get the updated user document
    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id },
      {
        $set: {
          isEmailVerified: true,
          emailVerificationToken: undefined,
          emailVerificationExpires: undefined
        }
      },
      { new: true, runValidators: false }
    );

    if (!updatedUser) {
      return res.status(400).json({
        error: 'Error updating user verification status'
      });
    }

    console.log('User verification status updated successfully');
      
    // Generate a new JWT token using the updated user
    const token = jwt.sign(
      { userId: updatedUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return success response with token and updated user data
    res.json({
      message: 'Email verified successfully',
      token,
      user: updatedUser.toPublicProfile()
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ 
      error: 'An error occurred during email verification',
      details: error.message 
    });
  }
};

// Request password reset
exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ error: 'No user found with this email' });
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save();

    const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const emailTemplate = emailTemplates.passwordReset(user.name, resetURL);
    
    await sendEmail({
      email: user.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html
    });

    res.json({
      message: 'Password reset link sent to email'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        error: 'Invalid or expired reset token'
      });
    }

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({
      message: 'Password reset successful'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Refresh token
exports.refreshToken = async (req, res) => {
  try {
    const { userId } = req.user;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user.toPublicProfile());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    // Prevent updating sensitive fields
    delete updates.password;
    delete updates.role;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user.toPublicProfile());
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Manage wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $addToSet: { wishlist: req.params.productId } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user.toPublicProfile());
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.removeFromWishlist = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $pull: { wishlist: req.params.productId } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user.toPublicProfile());
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Admin: Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin: Update user role
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get customer order history
exports.getCustomerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.userId })
      .populate('items.product', 'name price image')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get customer analytics
exports.getCustomerAnalytics = async (req, res) => {
  try {
    const userId = req.params.userId;
    const [orders, user] = await Promise.all([
      Order.find({ user: userId }),
      User.findById(userId)
    ]);

    // Calculate frequently bought products
    const productFrequency = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const productId = item.product.toString();
        productFrequency[productId] = (productFrequency[productId] || 0) + item.quantity;
      });
    });

    // Get top 5 products
    const topProductIds = Object.entries(productFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id]) => id);

    const topProducts = await Product.find({ _id: { $in: topProductIds } })
      .select('name price image');

    // Calculate order statistics
    const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const averageOrderValue = orders.length ? totalSpent / orders.length : 0;

    // Calculate monthly spending
    const monthlySpending = orders.reduce((acc, order) => {
      const month = new Date(order.createdAt).toLocaleString('default', { month: 'long', year: 'numeric' });
      acc[month] = (acc[month] || 0) + order.totalAmount;
      return acc;
    }, {});

    const analytics = {
      totalOrders: orders.length,
      totalSpent,
      averageOrderValue,
      lastOrderDate: orders.length ? orders[0].createdAt : null,
      topProducts: topProducts.map(product => ({
        ...product.toObject(),
        purchaseCount: productFrequency[product._id.toString()]
      })),
      monthlySpending,
      orderStatusBreakdown: orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {}),
      accountCreated: user.createdAt,
      wishlistCount: user.wishlist?.length || 0
    };

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Check session validity
exports.checkSession = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(401).json({ valid: false });
    }
    res.json({ valid: true });
  } catch (error) {
    res.status(500).json({ valid: false });
  }
};

// Admin: Create admin user
exports.createAdmin = async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create admin user
    const adminUser = new User({
      email,
      password,
      name,
      phone,
      role: 'admin',
      isEmailVerified: true // Admin users are pre-verified
    });

    await adminUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: adminUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Admin user created successfully',
      token,
      user: adminUser.toPublicProfile()
    });
  } catch (error) {
    console.error('Admin creation error:', error);
    res.status(400).json({ error: error.message });
  }
};

// Admin: Check if first admin exists
exports.checkFirstAdmin = async (req, res) => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    res.json({ exists: !!adminExists });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 