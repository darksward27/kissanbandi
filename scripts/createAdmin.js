import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';
import User from '../Kissanbandi/models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '../Kissanbandi/.env') });

const createAdminUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@skillonx.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const adminUser = new User({
      name: 'Admin',
      email: 'admin@skillonx.com',
      password: 'admin123', // Will be hashed by the pre-save middleware
      role: 'admin',
      phone: '0000000000', // Placeholder phone number
      isEmailVerified: true,
      isPhoneVerified: true
    });

    await adminUser.save();
    console.log('Admin user created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdminUser(); 