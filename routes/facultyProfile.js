import express from 'express';
import FacultyProfile from '../models/FacultyProfile.js';
import Faculty from '../models/Faculty.js';
import User from '../models/User.js';

const router = express.Router();

// Get faculty profile by user ID (for logged-in faculty)
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Fetching profile for user ID:', userId);
    
    // First check if user exists
    let user = await User.findById(userId);
    // If not found by ID, try to find by email from Faculty
    if (!user) {
      const faculty = await Faculty.findOne({ user: userId });
      if (faculty && faculty.email) {
        user = await User.findOne({ email: faculty.email, role: 'faculty' });
      }
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is faculty
    if (user.role !== 'faculty') {
      return res.status(403).json({ error: 'Access denied. Only faculty members can view this page.' });
    }

    // Find faculty record by user ID
    let faculty = await Faculty.findOne({ user: userId });
    if (!faculty) {
      // Try to find by email (in case a faculty record exists for this email)
      faculty = await Faculty.findOne({ email: user.email });
      if (!faculty) {
        // Automatically create the Faculty document from User info if missing
        const department = user.department || 'Unknown';
        const semester = user.semester || '1';
        faculty = new Faculty({
          user: user._id,
          name: user.name,
          email: user.email,
          department,
          semester,
          subjects: [],
          phone: user.phone || '',
          status: 'Active',
          address: user.address || '',
          designation: user.designation || '',
          dob: user.dob || new Date('2000-01-01')
        });
        await faculty.save();
        console.log('Created new Faculty for user:', user.email, 'with department:', department, 'and semester:', semester);
      }
    }

    // Get or create profile data
    let profile = await FacultyProfile.findOne({ facultyId: faculty._id });
    
    if (!profile) {
      if (!faculty || !faculty._id) {
        console.error('Faculty _id is null or missing for user:', user.email);
        return res.status(404).json({ error: 'Faculty record not found for this user.' });
      }
      // Clean up any existing bad data with facultyId: null or faculty: null before creating
      await FacultyProfile.deleteMany({ $or: [ { facultyId: null }, { faculty: null } ] });
      // Create default profile if none exists
      profile = new FacultyProfile({
        facultyId: faculty._id,
        userId: userId,
        qualification: '',
        experience: '',
        joiningDate: new Date(),
        profileSubjects: faculty.subjects || []
      });
      await profile.save();
      console.log('Created new faculty profile for:', faculty.name);
    }
    
    // Sync subjects from profile to faculty model to ensure consistency
    if (profile.profileSubjects && faculty.subjects.join(',') !== profile.profileSubjects.join(',')) {
      faculty.subjects = [...profile.profileSubjects];
      await faculty.save();
      console.log(`Synced subjects for ${faculty.name}`);
    }

    // Combine all data from User, Faculty, and FacultyProfile
    const combinedData = {
      // Basic info from User model
      userId: user._id,
      userRole: user.role,
      
      // Registration data from Faculty model
      facultyId: faculty._id,
      name: faculty.name,
      email: faculty.email,
      phone: faculty.phone,
      department: faculty.department,
      address: faculty.address,
      designation: faculty.designation,
      dob: faculty.dob,
      status: faculty.status,
      semester: faculty.semester,
      subjects: faculty.subjects,
      
      // Additional profile data
      qualification: profile.qualification,
      experience: profile.experience,
      joiningDate: profile.joiningDate,
      profileSubjects: profile.profileSubjects,
      
      // Timestamps
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt
    };

    console.log('Returning combined profile data for:', faculty.name);
    res.json(combinedData);
  } catch (err) {
    console.error('Error fetching faculty profile:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get faculty profile by faculty ID
router.get('/:facultyId', async (req, res) => {
  try {
    const { facultyId } = req.params;
    
    // Check if faculty exists
    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      return res.status(404).json({ error: 'Faculty not found' });
    }

    // Get user data
    const user = await User.findById(faculty.user);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get or create profile data
    let profile = await FacultyProfile.findOne({ facultyId: facultyId });
    
    if (!profile) {
      // Create default profile if none exists
      profile = new FacultyProfile({
        facultyId: facultyId,
        userId: faculty.user,
        qualification: '',
        experience: '',
        joiningDate: new Date(),
        profileSubjects: faculty.subjects || []
      });
      await profile.save();
    }

    // Combine all data
    const combinedData = {
      // Basic info from User model
      userId: user._id,
      userRole: user.role,
      
      // Registration data from Faculty model
      facultyId: faculty._id,
      name: faculty.name,
      email: faculty.email,
      phone: faculty.phone,
      department: faculty.department,
      address: faculty.address,
      designation: faculty.designation,
      dob: faculty.dob,
      status: faculty.status,
      semester: faculty.semester,
      subjects: faculty.subjects,
      
      // Additional profile data
      qualification: profile.qualification,
      experience: profile.experience,
      joiningDate: profile.joiningDate,
      profileSubjects: profile.profileSubjects,
      
      // Timestamps
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt
    };

    res.json(combinedData);
  } catch (err) {
    console.error('Error fetching faculty profile:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update faculty profile
router.put('/:facultyId', async (req, res) => {
  try {
    const { facultyId } = req.params;
    const updateData = req.body;

    // Check if faculty exists
    let faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      // Try to find a user with this facultyId as _id
      const user = await User.findOne({ role: 'faculty', _id: facultyId });
      if (!user) {
        return res.status(404).json({ error: 'Faculty not found' });
      }
      // Try to find by email (in case a faculty record exists for this email)
      faculty = await Faculty.findOne({ email: user.email });
      if (!faculty) {
        // Create the faculty record from user registration info
        faculty = new Faculty({
          user: user._id,
          name: user.name,
          email: user.email,
          department: user.department || '',
          semester: user.semester || '',
          subjects: [],
          phone: user.phone || '',
          status: 'Active',
          address: user.address || '',
          designation: user.designation || '',
          dob: user.dob || new Date('2000-01-01')
        });
        await faculty.save();
      }
    }

    // Update all basic faculty info
    await Faculty.findByIdAndUpdate(faculty._id, {
      name: updateData.name,
      email: updateData.email,
      department: updateData.department,
      phone: updateData.phone,
      address: updateData.address,
      designation: updateData.designation,
      dob: updateData.dob,
      semester: updateData.semester,
      subjects: updateData.subjects || [],
    });

    // Find and update profile data
    const profile = await FacultyProfile.findOneAndUpdate(
      { facultyId: faculty._id },
      { 
        name: updateData.name,
        email: updateData.email,
        department: updateData.department,
        phone: updateData.phone,
        address: updateData.address,
        designation: updateData.designation,
        dob: updateData.dob,
        semester: updateData.semester,
        qualification: updateData.qualification || '',
        experience: updateData.experience || '',
        joiningDate: updateData.joiningDate ? new Date(updateData.joiningDate) : new Date(),
        profileSubjects: updateData.profileSubjects || [],
        subjects: updateData.subjects || [],
        updatedAt: Date.now()
      },
      { new: true, upsert: true }
    );

    res.json({ 
      message: 'Profile updated successfully', 
      profile: profile 
    });
  } catch (err) {
    console.error('Error updating faculty profile:', err);
    res.status(400).json({ error: err.message });
  }
});

// Get all faculty profiles (for admin purposes)
router.get('/', async (req, res) => {
  try {
    const profiles = await FacultyProfile.find()
      .populate('facultyId')
      .populate('userId', 'name email role');
    res.json(profiles);
  } catch (err) {
    console.error('Error fetching all faculty profiles:', err);
    res.status(500).json({ error: err.message });
  }
});

// One-time cleanup endpoint to delete all FacultyProfile documents with facultyId: null
router.delete('/cleanup-null-faculty', async (req, res) => {
  try {
    const result = await FacultyProfile.deleteMany({ facultyId: null });
    res.json({ message: 'Deleted all FacultyProfile documents with facultyId: null', deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


export default router; 