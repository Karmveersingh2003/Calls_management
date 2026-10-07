const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: users });
  } catch (err) { next(err); }
};

exports.createUser = async (req, res, next) => {
  try {
    const { name, username, email, password, role = 'user' } = req.body;
    const user = await User.create({
      name, username: username.toLowerCase().trim(), email: email.toLowerCase().trim(),
      password, role, isActive: true, createdBy: req.user._id
    });
    const safeUser = user.toObject();
    delete safeUser.password;
    res.status(201).json({ success: true, data: safeUser });
  } catch (err) { next(err); }
};

exports.publicSignup = async (req, res, next) => {
  try {
    const { name, username, email, password } = req.body;
    if (!name || !username || !email || !password)
      return res.status(400).json({ success: false, message: 'All fields are required' });
    const exists = await User.findOne({ $or: [{ username: username.toLowerCase().trim() }, { email: email.toLowerCase().trim() }] });
    if (exists) return res.status(409).json({ success: false, message: 'Username or email already exists' });
    const user = await User.create({
      name, username: username.toLowerCase().trim(), email: email.toLowerCase().trim(),
      password, role: 'user', isActive: true
    });
    const safeUser = user.toObject(); delete safeUser.password;
    res.status(201).json({ success: true, data: safeUser, message: 'Account created! Please sign in.' });
  } catch (err) { next(err); }
};

exports.toggleStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    user.isActive = !user.isActive;
    await user.save();
    res.status(200).json({ success: true, data: user });
  } catch (err) { next(err); }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    user.password = await bcrypt.hash(req.body.newPassword, 10);
    await user.save();
    res.status(200).json({ success: true, message: 'Password reset' });
  } catch (err) { next(err); }
};
