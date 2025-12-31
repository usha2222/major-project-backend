import express from 'express';
import Student from '../models/Student.js'
import Subject from '../models/Subject.js';
import updateDashboardStats from '../utils/updateDashboardStats.js';

const router = express.Router();

// Helper to normalize department names
function normalizeDepartment(dept) {
  if (!dept) return '';
  const map = {
    'cse': 'Computer Science',
    'computer science': 'Computer Science',
    'cs': 'Computer Science',
    'ds': 'Data Science',
    'data science': 'Data Science',
    'ce': 'Civil Engineering',
    'civil': 'Civil Engineering',
    'civil engineering': 'Civil Engineering',
    'me': 'Mechanical Engineering',
    'mechanical': 'Mechanical Engineering',
    'mechanical engineering': 'Mechanical Engineering',
    'ee': 'Electrical Engineering',
    'electrical': 'Electrical Engineering',
    'electrical engineering': 'Electrical Engineering',
    'mkt': 'Marketing',
    'marketing': 'Marketing',
    'fin': 'Finance',
    'finance': 'Finance',
    'hr': 'Human Resources',
    'human resources': 'Human Resources',
    'ops': 'Operations',
    'operations': 'Operations',
    'sd': 'Software Development',
    'software development': 'Software Development',
    'wd': 'Web Development',
    'web development': 'Web Development',
    'db': 'Database Management',
    'database management': 'Database Management',
    'cc': 'Cloud Computing',
    'cloud computing': 'Cloud Computing',
    // Add more mappings as needed
  };
  const key = dept.trim().toLowerCase();
  return map[key] || dept.trim();
}

// Get all students
router.get('/', async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new student
router.post('/', async (req, res) => {
  try {
    const normalizedDepartment = normalizeDepartment(req.body.department);
    const student = new Student({ ...req.body, department: normalizedDepartment, semester: Number(req.body.semester) });
    await student.save();
    await updateDashboardStats();
    // Return the full updated list of students
    const students = await Student.find();
    res.status(201).json(students);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update a student
router.put('/:id', async (req, res) => {
  try {
    const normalizedDepartment = normalizeDepartment(req.body.department);
    const updatedData = { ...req.body, department: normalizedDepartment, semester: Number(req.body.semester) };
    const student = await Student.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    if (!student) return res.status(404).json({ error: 'Student not found' });
    await updateDashboardStats();
    // Return the full updated list of students
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a student
router.delete('/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    await updateDashboardStats();
    // Return the full updated list of students
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search student by rollNo or name and return marksheet
router.get('/search', async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'Query parameter is required' });
  try {
    const student = await Student.findOne({
      $or: [
        { rollNo: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } }
      ]
    });
    if (!student) return res.status(404).json({ error: 'Student not found' });
    const marks = await StudentMark.find({ student: student._id }).populate('subject');
    // Always return student, even if marks is empty
    res.json({ student, marks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router; 