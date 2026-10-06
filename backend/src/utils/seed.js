require('dotenv').config();
const User = require('../models/User');
const Master = require('../models/Master');
const connectDB = require('../config/database');

const seed = async () => {
  try {
    await connectDB();
    console.log('Resetting users and master data...');

    await User.deleteMany({});
    await Master.deleteMany({});

    const admin = await User.create({
      name: 'System Admin',
      username: 'admin',
      email: 'admin@company.com',
      password: 'Admin@123',
      role: 'admin',
      isActive: true
    });

    const aman = await User.create({
      name: 'Aman Sharma',
      username: 'aman',
      email: 'aman@company.com',
      password: 'User@123',
      role: 'user',
      isActive: true,
      createdBy: admin._id
    });

    const suresh = await User.create({
      name: 'Suresh Kumar',
      username: 'suresh',
      email: 'suresh@company.com',
      password: 'User@123',
      role: 'user',
      isActive: true,
      createdBy: admin._id
    });

    await Master.insertMany([
      { type: 'location', name: 'Delhi Office', scope: 'global', createdBy: admin._id },
      { type: 'location', name: 'Mumbai Office', scope: 'global', createdBy: admin._id },
      { type: 'location', name: 'Server Room', scope: 'global', createdBy: admin._id },
      { type: 'byWho', name: 'Reception', scope: 'global', createdBy: admin._id },
      { type: 'byWho', name: 'IT Support', scope: 'global', createdBy: admin._id }
    ]);

    console.log(' Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seed();