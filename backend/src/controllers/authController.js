const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'supersecretkey123', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

exports.login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Identifier and password required' });
    }

    const cleanIdentifier = String(identifier).toLowerCase().trim();
    console.log(`\n--- Login Attempt ---`);
    console.log(`Input Identifier: "${cleanIdentifier}"`);
    console.log(`Password length: ${password.length} characters`);

    const user = await User.findOne({
      $or: [{ username: cleanIdentifier }, { email: cleanIdentifier }]
    }).select('+password');

    if (!user) {
      console.log(`Result: User "${cleanIdentifier}" not found in database`);
      return res.status(401).json({ success: false, message: 'Invalid credentials: user not found' });
    }

    const isMatch = await bcrypt.compare(String(password), user.password);
    console.log(`Password match result: ${isMatch}`);

    if (!isMatch) {
      console.log(`Result: Password did not match for user "${user.username}"`);
      return res.status(401).json({ success: false, message: 'Invalid credentials: incorrect password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is disabled' });
    }

    const token = signToken(user);

    try {
      if (typeof logAudit === 'function') {
        await logAudit({ req, action: 'LOGIN', entityType: 'User', entityId: user._id });
      }
    } catch (auditErr) {
      console.warn('Audit warning:', auditErr.message);
    }

    const safeUser = user.toObject();
    delete safeUser.password;

    console.log(`Result: Login SUCCESS for "${user.username}" (${user.role})\n`);
    res.status(200).json({ success: true, token, user: safeUser });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, user: req.user });
  } catch (err) {
    next(err);
  }
};

/* Save company branding (name + logo) used in Excel exports — any user can set their own */
exports.updateBranding = async (req, res, next) => {
  try {
    const { companyName, logo } = req.body || {};
    if (companyName === undefined && logo === undefined) {
      return res.status(400).json({ success: false, message: 'Nothing to update' });
    }
    if (logo !== undefined && logo !== null && logo !== '') {
      if (typeof logo !== 'string' || !/^data:image\/(png|jpe?g|gif);base64,/.test(logo)) {
        return res.status(400).json({ success: false, message: 'Logo must be an image data URL (png/jpg/gif)' });
      }
      if (logo.length > 4 * 1024 * 1024) {
        return res.status(400).json({ success: false, message: 'Logo too large (max ~3 MB)' });
      }
    }
    const updates = {};
    if (companyName !== undefined) updates.companyName = String(companyName).slice(0, 120);
    if (logo !== undefined) updates.logo = logo === null ? '' : String(logo);
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select('-password');
    res.status(200).json({ success: true, user, message: 'Branding saved successfully' });
  } catch (err) { next(err); }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password required' });
    }
    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await bcrypt.compare(String(currentPassword), user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
};

exports.switchUser = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admins only' });
    }
    const { userId } = req.body;
    const target = await User.findById(userId);
    if (!target || !target.isActive) {
      return res.status(404).json({ success: false, message: 'Target user not found or inactive' });
    }
    const token = jwt.sign(
      { id: target._id, role: target.role, impersonatorId: req.user._id },
      process.env.JWT_SECRET || 'supersecretkey123',
      { expiresIn: '2h' }
    );
    res.status(200).json({ success: true, token, user: target.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

exports.exitSwitchUser = async (req, res, next) => {
  try {
    if (!req.impersonator) {
      return res.status(400).json({ success: false, message: 'Not in a switched session' });
    }
    const token = signToken(req.impersonator);
    res.status(200).json({ success: true, token, user: req.impersonator });
  } catch (err) {
    next(err);
  }
};