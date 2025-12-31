import mongoose from 'mongoose';

const facultyProfileSchema = new mongoose.Schema({
  facultyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Faculty', 
    required: true,
    unique: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  name: { type: String, default: '' },
  email: { type: String, default: '' },
  department: { type: String, default: '' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  designation: { type: String, default: '' },
  dob: { type: Date },
  semester: { type: String, default: '' },
  // Additional profile fields that extend registration data
  qualification: { 
    type: String, 
    default: '' 
  },
  experience: { 
    type: String, 
    default: '' 
  },
  joiningDate: { 
    type: Date, 
    default: Date.now 
  },
  // Profile-specific subjects (can be different from registration subjects)
  profileSubjects: {
    type: [String],
    default: []
  },
  // Timestamps for tracking changes
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
facultyProfileSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Prevent saving a FacultyProfile with facultyId (or faculty) as null
facultyProfileSchema.pre('save', function(next) {
  if (this.facultyId == null) {
    return next(new Error('Cannot save FacultyProfile: facultyId is null'));
  }
  next();
});

const FacultyProfile = mongoose.model('FacultyProfile', facultyProfileSchema);
export default FacultyProfile; 