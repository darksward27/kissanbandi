const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded.userId });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

exports.adminAuth = async (req, res, next) => {
  try {
    await exports.auth(req, res, () => {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin only.' });
      }
      next();
    });
  } catch (error) {
    res.status(403).json({ message: 'Access denied' });
  }
}; 