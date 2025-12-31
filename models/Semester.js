import mongoose from 'mongoose';

const semesterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  academicYear: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['Upcoming', 'Active', 'Completed'], default: 'Upcoming' },
  totalSubjects: { type: Number, required: true },
  totalStudents: { type: Number, required: true },
  description: { type: String }
});

const Semester = mongoose.model('Semester', semesterSchema);
export default Semester; 