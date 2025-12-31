import express from 'express';
import Faculty from '../models/Faculty.js';
import updateDashboardStats from '../utils/updateDashboardStats.js';

const router = express.Router();

// Get all faculty
router.get('/', async (req, res) => {
  try {
    const faculty = await Faculty.find();
    res.json(faculty);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new faculty member
router.post('/', async (req, res) => {
  try {
    // Remove subjects from req.body if present
    const { subjects, ...rest } = req.body;
    const faculty = new Faculty(rest);
    await faculty.save();
    await updateDashboardStats();
    res.status(201).json(faculty);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update a faculty member
router.put('/:id', async (req, res) => {
  try {
    // Remove subjects from req.body if present
    const { subjects, ...rest } = req.body;
    const faculty = await Faculty.findByIdAndUpdate(req.params.id, rest, { new: true });
    if (!faculty) return res.status(404).json({ error: 'Faculty not found' });
    res.json(faculty);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a faculty member
router.delete('/:id', async (req, res) => {
  try {
    const faculty = await Faculty.findByIdAndDelete(req.params.id);
    if (!faculty) return res.status(404).json({ error: 'Faculty not found' });
    await updateDashboardStats();
    res.json({ message: 'Faculty deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router; 