import express from 'express';
import Department from '../models/Department.js';
import updateDashboardStats from '../utils/updateDashboardStats.js';

const router = express.Router();

// Get all departments
router.get('/', async (req, res) => {
  try {
    const departments = await Department.find();
    res.json(departments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new department
router.post('/', async (req, res) => {
  try {
    const department = new Department(req.body);
    await department.save();
    await updateDashboardStats();
    res.status(201).json(department);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update a department
router.put('/:id', async (req, res) => {
  try {
    const department = await Department.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    if (!department) return res.status(404).json({ error: 'Department not found' });
    res.json(department);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a department
router.delete('/:id', async (req, res) => {
  try {
    const department = await Department.findOneAndDelete({ id: req.params.id });
    if (!department) return res.status(404).json({ error: 'Department not found' });
    await updateDashboardStats();
    res.json({ message: 'Department deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router; 