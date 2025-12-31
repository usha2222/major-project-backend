import express from 'express';
import Subject from '../models/Subject.js'
import updateDashboardStats from '../utils/updateDashboardStats.js';
import Faculty from '../models/Faculty.js';
import FacultyProfile from '../models/FacultyProfile.js';

const router = express.Router();

// Helper to update faculty profile subjects
async function updateFacultyProfileSubjects(facultyIdentifier, subjectCode, prevFacultyIdentifier = null) {
  console.log('Updating faculty profile:', { facultyIdentifier, subjectCode, prevFacultyIdentifier });
  if (facultyIdentifier) {
    // Match by email or name
    let faculty = await Faculty.findOne({ $or: [ { email: facultyIdentifier }, { name: facultyIdentifier } ] });
    console.log('Found faculty:', faculty);
    if (faculty) {
      // Auto-fix: If faculty.user is missing, try to set it from User
      if (!faculty.user) {
        const User = (await import('../models/User.js')).default;
        const userDoc = await User.findOne({ email: faculty.email, role: 'faculty' });
        if (userDoc) {
          faculty.user = userDoc._id;
          await faculty.save();
          console.log(`Auto-fixed faculty.user for ${faculty.email}`);
        } else {
          console.warn(`No matching user found for faculty ${faculty.email}. Skipping FacultyProfile creation.`);
        }
      }
      let profile = await FacultyProfile.findOne({ facultyId: faculty._id });
      console.log('Found profile:', profile);
      // Only create profile if faculty.user exists
      if (!profile && faculty.user) {
        profile = new FacultyProfile({ facultyId: faculty._id, userId: faculty.user, profileSubjects: [] });
      } else if (!profile && !faculty.user) {
        console.warn(`Faculty with identifier ${facultyIdentifier} is missing a user reference. Skipping FacultyProfile creation.`);
      }
      if (profile && !profile.profileSubjects.includes(subjectCode)) {
        profile.profileSubjects.push(subjectCode);
        await profile.save();
        console.log('Updated profileSubjects:', profile.profileSubjects);
      }
      // --- Update Faculty.subjects array ---
      if (!faculty.subjects) faculty.subjects = [];
      if (!faculty.subjects.includes(subjectCode)) {
        faculty.subjects.push(subjectCode);
        await faculty.save();
        console.log('Updated Faculty.subjects:', faculty.subjects);
      }
    }
  }
  // Remove from previous faculty if reassigned
  if (prevFacultyIdentifier && prevFacultyIdentifier !== facultyIdentifier) {
    const prevFaculty = await Faculty.findOne({ $or: [ { email: prevFacultyIdentifier }, { name: prevFacultyIdentifier } ] });
    if (prevFaculty) {
      const prevProfile = await FacultyProfile.findOne({ facultyId: prevFaculty._id });
      if (prevProfile && prevProfile.profileSubjects.includes(subjectCode)) {
        prevProfile.profileSubjects = prevProfile.profileSubjects.filter(code => code !== subjectCode);
        await prevProfile.save();
        console.log('Removed subject from previous profile:', prevProfile.profileSubjects);
      }
      // --- Remove from previous Faculty.subjects array ---
      if (prevFaculty.subjects && prevFaculty.subjects.includes(subjectCode)) {
        prevFaculty.subjects = prevFaculty.subjects.filter(code => code !== subjectCode);
        await prevFaculty.save();
        console.log('Removed subject from previous Faculty.subjects:', prevFaculty.subjects);
      }
    }
  }
}

// Get all subjects
router.get('/', async (req, res) => {
  try {
    const subjects = await Subject.find();
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new subject
router.post('/', async (req, res) => {
  try {
    // Check that faculty exists by name or email
    const facultyDoc = await Faculty.findOne({ $or: [ { email: req.body.faculty }, { name: req.body.faculty } ] });
    if (!facultyDoc) {
      return res.status(400).json({ error: 'Faculty not found. Please enter a valid faculty name or email.' });
    }
    const subject = new Subject(req.body);
    await subject.save();
    await updateDashboardStats();
    // Update faculty profile
    await updateFacultyProfileSubjects(subject.faculty, subject.code);
    res.status(201).json(subject);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update a subject
router.put('/:id', async (req, res) => {
  try {
    const oldSubject = await Subject.findById(req.params.id);
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    await updateDashboardStats();
    // Update faculty profile (handle reassignment)
    await updateFacultyProfileSubjects(subject.faculty, subject.code, oldSubject ? oldSubject.faculty : null);
    res.json(subject);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a subject
router.delete('/:id', async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    await updateDashboardStats();
    res.json({ message: 'Subject deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
