import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  rollNo: { type: String, required: false, unique: false }, // not required for old docs
  rollNumber: { type: String, required: false, unique: false }, // for backward compatibility
  name: { type: String, required: true },
  department: { type: String, required: true },
  semester: { type: Number, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  status: { type: String, enum: ['Active', 'Inactive', 'Graduated'], default: 'Active' },
  address: { type: String, required: true },
  dob: { type: Date, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true }
});

const Student = mongoose.model('Student', studentSchema);
export default Student;
 