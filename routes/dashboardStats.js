import express from 'express';
import DashboardStats from '../models/DashboardStats.js';

const router = express.Router();

// Get dashboard stats (assume only one document)
router.get('/', async (req, res) => {
  try {
    let stats = await DashboardStats.findOne();
    if (!stats) {
      stats = new DashboardStats();
      await stats.save();
    }
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update dashboard stats
router.put('/', async (req, res) => {
  try {
    const { totalStudents, totalFaculty, departments, subjects } = req.body;
    let stats = await DashboardStats.findOne();
    if (!stats) {
      stats = new DashboardStats({ totalStudents, totalFaculty, departments, subjects });
    } else {
      stats.totalStudents = totalStudents;
      stats.totalFaculty = totalFaculty;
      stats.departments = departments;
      stats.subjects = subjects;
      stats.updatedAt = Date.now();
    }
    await stats.save();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router; 