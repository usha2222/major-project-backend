import mongoose from 'mongoose';

const facultySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  semester: { type: String, required: true },
  phone: { type: String },
  status: { type: String, enum: ['Active', 'Inactive', 'On Leave'], default: 'Active' },
  address: { type: String, required: true },
  designation: { type: String, required: true },
  dob: { type: Date, required: true },
  subjects: { type: [String], default: [] }
});

const Faculty = mongoose.model('Faculty', facultySchema);
export default Faculty;   