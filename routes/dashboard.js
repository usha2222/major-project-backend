import express from 'express';
import Student from '../models/Student.js';
import Faculty from '../models/Faculty.js';
import Department from '../models/Department.js';
import Subject from '../models/Subject.js';

const router = express.Router();

// GET /api/dashboard/stats - Admin dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const totalFaculty = await Faculty.countDocuments();
    const departments = await Department.countDocuments();
    const subjects = await Subject.countDocuments();
    res.json({
      totalStudents,
      totalFaculty,
      departments,
      subjects
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router; 