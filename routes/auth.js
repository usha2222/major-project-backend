import express from 'express';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Registration endpoint is disabled since PendingRegistration is removed
// router.post('/register', ... )

// Login: Only for approved users
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    // First, find user by email only
    const userByEmail = await User.findOne({ email });
    if (!userByEmail) return res.status(400).json({ error: 'User not found or not approved wait please for admin approval .' });
    // Now check if the role matches
    if (userByEmail.role !== role) return res.status(400).json({ error: 'Invalid credentials' });
    // Now check password
    const isMatch = await userByEmail.comparePassword(password);
    if (!isMatch) return res.status(400).json({ error: 'Password is incorrect' });
    const token = jwt.sign({ id: userByEmail._id, role: userByEmail.role }, process.env.JWT_SECRET);
    res.json({ 
      user: { 
        _id: userByEmail._id,
        name: userByEmail.name,
        email: userByEmail.email,
        role: userByEmail.role,
        phone: userByEmail.phone,
        address: userByEmail.address,
        dob: userByEmail.dob,
        department: userByEmail.department,
        designation: userByEmail.designation
      }, 
      token 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router; 