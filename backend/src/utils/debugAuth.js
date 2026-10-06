require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const user = await User.findOne({ username: 'admin' }).select('+password');
  if (!user) return console.log('User not found'), process.exit(1);

  console.log('Stored hash:', user.password);
  console.log('Hash length:', user.password.length);
  console.log('Starts with $2:', user.password.startsWith('$2'));

  const result = await bcrypt.compare('Admin@123', user.password);
  console.log('bcrypt.compare result:', result);

  process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });
