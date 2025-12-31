import express from 'express';
import Student from '../models/Student.js';
import Marksheet from '../models/Marksheet.js';
import authenticateToken from '../middleware/auth.js';
import Faculty from '../models/Faculty.js';
import Subject from '../models/Subject.js';

const router = express.Router();

// Helper to normalize department names for consistent comparison
function normalizeDepartment(dept) {
  if (!dept) return '';
  const map = {
    'cse': 'Computer Science',
    'computer science': 'Computer Science',
    'computer': 'Computer Science',
    'cs': 'Computer Science',
    'ds': 'Data Science',
    'data science': 'Data Science',
    'data': 'Data Science',
    'ce': 'Civil Engineering',
    'civil': 'Civil Engineering',
    'civil engineering': 'Civil Engineering',
    'me': 'Mechanical Engineering',
    'mechanical': 'Mechanical Engineering',
    'mechanical engineering': 'Mechanical Engineering',
    'ee': 'Electrical Engineering',
    'electrical': 'Electrical Engineering',
    'electrical engineering': 'Electrical Engineering',
    'electronics': 'Electrical Engineering',
    'mkt': 'Marketing', 'marketing': 'Marketing',
    'fin': 'Finance', 'finance': 'Finance',
    'hr': 'Human Resources', 'human resources': 'Human Resources', 'human resource': 'Human Resources',
    'ops': 'Operations', 'operations': 'Operations',
    'sd': 'Software Development', 'software development': 'Software Development', 'software': 'Software Development',
    'wd': 'Web Development', 'web development': 'Web Development', 'web': 'Web Development',
    'db': 'Database Management', 'database management': 'Database Management', 'database': 'Database Management',
    'cc': 'Cloud Computing', 'cloud computing': 'Cloud Computing', 'cloud': 'Cloud Computing',
  };
  return map[dept.trim().toLowerCase()] || dept.trim();
}

// Search student by rollNo, rollNumber, name, or email and return their marksheet
router.get('/search', async (req, res) => {
  let { query } = req.query;
  if (!query) return res.status(400).json({ error: 'Query parameter is required' });
  query = query.trim(); // Trim input for more robust search
  const searchPattern = { $regex: query, $options: 'i' };
  try {
    let student = await Student.findOne({
      $or: [
        { rollNo: searchPattern },
        { name: searchPattern },
        { email: searchPattern }
      ]
    });

    // Remove partial match fallback for name
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    const subjects = await Marksheet.find({ student: student._id }).populate('subject');
    res.json({ student, subjects });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to list all students for debugging
router.get('/allstudents', async (req, res) => {
  try {
    const allStudents = await Student.find({});
    res.json({ allStudents });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/marksheets - Add or update marks for a student and subject
router.post('/', authenticateToken, async (req, res) => {
  const { rollNo, subjectCode, mid1, mid2, assignment, attendance, external } = req.body;
  try {
    // 1. Validate required fields
    if (!rollNo) return res.status(400).json({ error: 'rollNo is required' });
    if (!subjectCode) return res.status(400).json({ error: 'subjectCode is required' });

    // 2. Fetch necessary data in parallel
    const [faculty, student, subject] = await Promise.all([
      Faculty.findOne({ user: req.user.id }).select('department subjects'),
      Student.findOne({
        $or: [
          { rollNo: { $regex: `^${rollNo}$`, $options: 'i' } },
          { rollNumber: { $regex: `^${rollNo}$`, $options: 'i' } }
        ]
      }),
      Subject.findOne({ code: subjectCode }),
    ]);

    // 3. Perform Authorization Checks
    if (!faculty || !faculty.department) {
      return res.status(403).json({ msg: 'Authorization error: Your profile is incomplete or not assigned to a department.' });
    }
    if (!student) {
      return res.status(404).json({ msg: 'Student not found.' });
    }
    if (!subject) {
      return res.status(404).json({ msg: 'Subject not found.' });
    }

    const facultyDept = normalizeDepartment(faculty.department);
    const studentDept = normalizeDepartment(student.department);
    const subjectDept = normalizeDepartment(subject.department);

    // Ensure faculty and student are in the same department
    if (facultyDept !== studentDept) {
      return res.status(403).json({ msg: 'Authorization error: You can only save marks for students in your own department.' });
    }

    // Ensure subject is assigned to this faculty
    if (!faculty.subjects.includes(subjectCode)) {
      return res.status(403).json({ msg: 'Authorization error: You are not assigned to teach this subject.' });
    }

    // Ensure subject belongs to the student's department
    if (subjectDept !== studentDept) {
      return res.status(400).json({ msg: 'Data integrity error: This subject does not belong to the student\'s department.' });
    }

    const bestOfTwo = Math.max(Number(mid1) || 0, Number(mid2) || 0);

    // 4. If all checks pass, find existing marksheet or create a new one
    let marksheet = await Marksheet.findOne({ student: student._id, subject: subject._id });

    if (marksheet) {
      // Update existing marksheet
      marksheet.mid1 = mid1;
      marksheet.mid2 = mid2;
      marksheet.assignment = assignment;
      marksheet.attendance = attendance;
      marksheet.external = external;

      // Populate details
      marksheet.studentName = student.name;
      marksheet.rollNo = student.rollNo;
      marksheet.subjectName = subject.name;
      marksheet.subjectCode = subject.code;
      marksheet.bestOfTwo = bestOfTwo;
      await marksheet.save(); // Save the updated marksheet
    } else {
      // Create new marksheet
      marksheet = new Marksheet({
        student: student._id,
        subject: subject._id,
        studentName: student.name,
        rollNo: student.rollNo,
        subjectName: subject.name,
        subjectCode: subject.code,
        mid1, mid2, assignment, attendance, external,
        bestOfTwo
      });
      await marksheet.save(); // Save the new marksheet
    }

    res.json({ message: 'Marks saved successfully', marksheet: marksheet });

  } catch (err) {
    console.error('Error in POST /api/marksheets:', err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// GET /api/marksheets/student/:rollNo - Get all marks for a student by roll number
router.get('/student/:rollNo', authenticateToken, async (req, res) => {
  try {
    const { rollNo } = req.params;
    const searchPattern = { $regex: `^${rollNo}$`, $options: 'i' };
    const student = await Student.findOne({ $or: [{ rollNo: searchPattern }, { rollNumber: searchPattern }] });
    if (!student) return res.status(404).json({ error: 'Student not found' });
    // Always return all marksheets for the student, regardless of faculty assignment
    const marksheets = await Marksheet.find({ student: student._id }).populate('subject');
    res.json(marksheets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Optional: Add a /ping route for health check
router.get('/ping', (req, res) => {
  res.json({ message: 'pong' });
});

export default router; 