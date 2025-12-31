import express from 'express';
import PendingRegistration from '../models/PendingRegistration.js';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Faculty from '../models/Faculty.js';
// import bcrypt from 'bcryptjs';

const router = express.Router();

// Create a new pending registration
router.post('/', async (req, res) => {
  try {
    const { name, email, password, role, department, semester, rollNo, designation, phoneNumber, address, dateOfBirth } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }
    if (role === 'student' && (!department || !semester || !rollNo)) {
      return res.status(400).json({ error: 'Missing student fields.' });
    }
    if (role === 'faculty' && (!department || !designation)) {
      return res.status(400).json({ error: 'Missing faculty fields.' });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'User already exists.' });
    const pendingExists = await PendingRegistration.findOne({ email, status: 'pending' });
    if (pendingExists) return res.status(400).json({ error: 'Registration already pending.' });
    const pending = new PendingRegistration({ name, email, password, role, department, semester, rollNo, designation, phoneNumber, address, dateOfBirth });
    await pending.save();
    res.status(201).json({ message: 'Registration request submitted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all pending registrations (admin)
router.get('/', async (req, res) => {
  try {
    const pending = await PendingRegistration.find({ status: 'pending' });
    res.json(pending);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve a registration (admin)
router.post('/:id/approve', async (req, res) => {
  try {
    const pending = await PendingRegistration.findById(req.params.id);
    if (!pending || pending.status !== 'pending') return res.status(404).json({ error: 'Registration not found.' });
    // Move to User
    const user = new User({
      name: pending.name,
      email: pending.email,
      password: pending.password,
      role: pending.role,
      phone: pending.phoneNumber,
      dob: pending.dateOfBirth,
      address: pending.address,
      department: pending.department,
      semester: pending.semester,
      rollNo: pending.rollNo,
      designation: pending.designation
    });
    await user.save();
    if (pending.role === 'student') {
      // Validate required fields for Student
      const missingFields = [];
      if (!pending.rollNo) missingFields.push('rollNo');
      if (!pending.name) missingFields.push('name');
      if (!pending.department) missingFields.push('department');
      if (!pending.semester) missingFields.push('semester');
      if (!pending.email) missingFields.push('email');
      if (!pending.phoneNumber) missingFields.push('phone');
      if (!pending.address) missingFields.push('address');
      if (!pending.dateOfBirth) missingFields.push('dob');
      if (missingFields.length > 0) {
        console.error('Student approval failed. Pending registration data:', pending);
        console.error('Missing required student fields:', missingFields);
        return res.status(400).json({ error: `Missing required student fields: ${missingFields.join(', ')}` });
      }
      const student = new Student({
        user: user._id,
        name: pending.name,
        email: pending.email,
        department: pending.department,
        semester: Number(pending.semester),
        rollNo: pending.rollNo,
        phone: pending.phoneNumber,
        address: pending.address,
        dob: pending.dateOfBirth
      });
      await student.save();
    }
    if (pending.role === 'faculty') {
      // Validate required fields for Faculty
      const missingFields = [];
      if (!pending.name) missingFields.push('name');
      if (!pending.email) missingFields.push('email');
      if (!pending.department) missingFields.push('department');
      if (!pending.semester) missingFields.push('semester');
      if (!pending.address) missingFields.push('address');
      if (!pending.designation) missingFields.push('designation');
      if (!pending.dateOfBirth) missingFields.push('dob');
      if (missingFields.length > 0) {
        return res.status(400).json({ error: `Missing required faculty fields: ${missingFields.join(', ')}` });
      }
      const faculty = new Faculty({
        user: user._id,
        name: pending.name,
        email: pending.email,
        department: pending.department,
        semester: pending.semester,
        address: pending.address,
        designation: pending.designation,
        dob: pending.dateOfBirth
      });
      await faculty.save();
    }
    pending.status = 'approved';
    await pending.save();
    res.json({ message: 'Registration approved.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reject a registration (admin)
router.post('/:id/reject', async (req, res) => {
  try {
    const pending = await PendingRegistration.findById(req.params.id);
    if (!pending || pending.status !== 'pending') return res.status(404).json({ error: 'Registration not found.' });
    pending.status = 'rejected';
    await pending.save();
    res.json({ message: 'Registration rejected.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router; 