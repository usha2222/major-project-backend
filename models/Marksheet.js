import mongoose from 'mongoose';

const marksheetSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  studentName: { type: String },
  rollNo: { type: String },
  subjectName: { type: String },
  subjectCode: { type: String },
  mid1: { type: Number, required: true },
  mid2: { type: Number, required: true },
  assignment: { type: Number, required: true },
  attendance: { type: Number, required: true },
  external: { type: Number, required: true },
  bestOfTwo: { type: Number }
});

const Marksheet = mongoose.model('Marksheet', marksheetSchema);
export default Marksheet; 