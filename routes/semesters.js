import express from 'express';
import Semester from '../models/Semester.js';

const router = express.Router();

// Get all semesters
router.get('/', async (req, res) => {
  try {
    const semesters = await Semester.find();
    res.json(semesters);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new semester
router.post('/', async (req, res) => {
  try {
    const semester = new Semester(req.body);
    await semester.save();
    res.status(201).json(semester);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update a semester
router.put('/:id', async (req, res) => {
  try {
    const semester = await Semester.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!semester) return res.status(404).json({ error: 'Semester not found' });
    res.json(semester);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a semester
router.delete('/:id', async (req, res) => {
  try {
    const semester = await Semester.findByIdAndDelete(req.params.id);
    if (!semester) return res.status(404).json({ error: 'Semester not found' });
    res.json({ message: 'Semester deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router; 