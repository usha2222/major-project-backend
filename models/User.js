import mongoose from 'mongoose';
import bcrypt from 'bcryptjs'

// Only 'faculty' and 'student' can register via the frontend.
// 'admin' users should be pre-seeded in the database manually.
const userSchema = new mongoose.Schema({
  role: { type: String, enum: ['admin', 'faculty', 'student'], required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  address: { type: String, required: true },
  dob: { type: Date, required: true },
  department: { type: String },
  // Student-specific fields
  semester: { type: String },
  rollNo: { type: String },
  // Faculty-specific fields
  designation: { type: String }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User; 