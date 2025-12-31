import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  department: { type: String, required: true },
  semester: { type: Number, required: true },
  faculty: { type: String, required: true }
});

const Subject = mongoose.model('Subject', subjectSchema);
export default Subject;
 