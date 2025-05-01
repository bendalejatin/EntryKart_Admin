const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const SecurityGuard = require('../models/SecurityGuard');

const JWT_SECRET = 'DEC';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Login route
router.post('/guard-login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const guard = await SecurityGuard.findOne({ email, role: 'security' })
      .populate('society', 'name'); // Populate society name
    if (!guard) return res.status(401).json({ message: 'Invalid email or role' });
    const isMatch = await guard.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid password' });
    const token = jwt.sign(
      { 
        id: guard._id, 
        email: guard.email, 
        role: guard.role,
        society: guard.society?._id 
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ 
      token, 
      email: guard.email,
      society: guard.society 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Registration route
router.post('/guard-register', async (req, res) => {
  const { email, password, society } = req.body;
  try {
    if (!mongoose.Types.ObjectId.isValid(society)) {
      return res.status(400).json({ message: 'Invalid society ID' });
    }

    const existingGuard = await SecurityGuard.findOne({ email });
    if (existingGuard) return res.status(400).json({ message: 'Email already exists' });

    const guard = new SecurityGuard({ 
      email, 
      password,
      society,
      role: 'security' 
    });
    await guard.save();
    res.status(201).json({ message: 'Security guard registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Profile route
router.get('/guard-profile', authenticateToken, async (req, res) => {
  try {
    const guard = await SecurityGuard.findById(req.user.id)
      .select('-password')
      .populate('society', 'name flats');
    if (!guard) return res.status(404).json({ message: 'Guard not found' });
    res.json({ 
      email: guard.email, 
      role: guard.role,
      society: guard.society 
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', (req, res) => {
  res.send('Security Guard Backend is running');
});

module.exports = router;