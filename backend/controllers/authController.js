const User = require('../models/User');
const Driver = require('../models/Driver');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { timingSafeEqual } = require('crypto');

const roleSignupCodes = {
  driver: 'DRIVER_SIGNUP_CODE',
  admin: 'ADMIN_SIGNUP_CODE'
};

const matchesSignupCode = (providedCode, expectedCode) => {
  if (typeof providedCode !== 'string' || typeof expectedCode !== 'string') return false;
  const providedBuffer = Buffer.from(providedCode);
  const expectedBuffer = Buffer.from(expectedCode);
  return providedBuffer.length === expectedBuffer.length && timingSafeEqual(providedBuffer, expectedBuffer);
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role = 'user', invitationCode, vehicle, plate } = req.body;
    if (!['user', 'driver', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid account type.' });
    }
    if (!name || !email || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ message: 'Name, email, and a password of at least 6 characters are required.' });
    }
    if (role !== 'user') {
      const codeName = roleSignupCodes[role];
      if (!matchesSignupCode(invitationCode, process.env[codeName])) {
        return res.status(403).json({ message: `A valid ${role} signup code is required.` });
      }
    }
    if (role === 'driver' && (!vehicle?.trim() || !plate?.trim())) {
      return res.status(400).json({ message: 'Vehicle and plate are required for driver accounts.' });
    }

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name,
      email,
      password: hashedPassword,
      role
    });

    await user.save();

    if (role === 'driver') {
      try {
        await Driver.create({ user: user._id, name, vehicle: vehicle.trim(), plate: plate.trim() });
      } catch (error) {
        await User.deleteOne({ _id: user._id });
        throw error;
      }
    }

    const payload = { user: { id: user.id, role: user.role } };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret123', { expiresIn: '1h' });

    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, expectedRole } = req.body;
    let user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }
    if (expectedRole && expectedRole !== user.role) {
      return res.status(403).json({ message: `This account is registered as ${user.role}. Choose that account type to log in.` });
    }

    const payload = { user: { id: user.id, role: user.role } };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret123', { expiresIn: '1h' });

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
