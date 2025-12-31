import express from 'express';
import User from '../models/User.js';
import Faculty from '../models/Faculty.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Get users by role (student or faculty)
router.get('/', async (req, res) => {
  try {
    const { role } = req.query;
    if (!role || !['student', 'faculty'].includes(role)) {
      return res.status(400).json({ error: 'Role must be student or faculty' });
    }
    const users = await User.find({ role });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all admin users - This must come before /:id routes
router.get('/admins', async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }, 'name email');
    res.json(admins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a specific user by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a user (faculty or admin)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    console.log('PUT /users/:id called with ID:', req.params.id);
    console.log('Request body:', req.body);
    console.log('Authenticated user:', req.user);

    // Check if user exists and get current data
    const existingUser = await User.findById(req.params.id);
    if (!existingUser) {
      console.log('User not found with ID:', req.params.id);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Existing user found:', existingUser);

    // Allow admin to update their own profile or faculty profiles
    // For now, allow all updates (you can add role-based restrictions later)
    
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    console.log('User updated successfully:', updatedUser);
    
    // Also update in faculty collection if exists (using email as unique identifier)
    if (existingUser.role === 'faculty') {
      await Faculty.findOneAndUpdate({ email: updatedUser.email }, req.body);
      console.log('Faculty collection updated');
    }

    res.json(updatedUser);
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(400).json({ error: err.message });
  }
});

// Delete a user (faculty)
router.delete('/:id', async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ error: 'User not found' });

    // Also delete from faculty collection if exists (using email as unique identifier)
    await Faculty.findOneAndDelete({ email: deletedUser.email });

    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router; 