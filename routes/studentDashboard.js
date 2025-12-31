import express from 'express';
import authenticateToken from '../middleware/auth.js';
import Student from '../models/Student.js';
import Marksheet from '../models/Marksheet.js';
import Subject from '../models/Subject.js';
import User from '../models/User.js';

const router = express.Router();

// GET /api/student-dashboard/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // Try to find the student profile linked to the logged-in user
    let student = await Student.findOne({ user: req.user.id }).populate('user');

    // If not found, try by email (from user object)
    if (!student) {
      const user = await User.findById(req.user.id);
      if (user && user.email) {
        student = await Student.findOne({ email: user.email }).populate('user');
      }
    }

    // If still not found, try by rollNo (if user.rollNo exists)
    if (!student) {
      const user = await User.findById(req.user.id);
      if (user && user.rollNo) {
        student = await Student.findOne({
          $or: [
            { rollNo: user.rollNo },
            { rollNumber: user.rollNo }
          ]
        }).populate('user');
      }
    }

    if (!student) return res.status(404).json({ error: 'Student not found' });

    // Get all marksheets for this student, and populate subject info
    const marksheets = await Marksheet.find({ student: student._id }).populate('subject');

    // Format subjects for frontend
    const subjects = marksheets.map(m => ({
      id: m._id,
      code: m.subject?.code || '',
      name: m.subject?.name || '',
      mid1: m.mid1,
      mid2: m.mid2,
      bestOfTwo: Math.max(m.mid1 || 0, m.mid2 || 0),
      assignment: m.assignment,
      external: m.external,
      attendance: m.attendance
    }));

    // Student info for dashboard
    // Fill name and email from user if missing in student
    let name = student.user?.name || student.name || '';
    let email = student.user?.email || student.email || '';
    if (!name || !email) {
      const user = await User.findById(req.user.id);
      if (!name) name = user?.name || '';
      if (!email) email = user?.email || '';
    }
    const studentInfo = {
      name,
      rollNo: student.rollNo,
      department: student.department,
      semester: student.semester,
      email,
      phone: student.phone
    };

    res.json({ studentInfo, subjects });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router; 