import mongoose from 'mongoose';

const PendingRegistrationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'faculty'], required: true },
  department: { type: String },
  semester: { type: String },
  rollNo: { type: String },
  designation: { type: String },
  phoneNumber: { type: String },
  address: { type: String },
  dateOfBirth: { type: Date },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('PendingRegistration', PendingRegistrationSchema); 