import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  hod: { type: String, required: true },
  totalFaculty: { type: Number, required: true },
  totalStudents: { type: Number, required: true },
  established: { type: String },
  contact: { type: String }
});

const Department = mongoose.model('Department', departmentSchema);
export default Department; 