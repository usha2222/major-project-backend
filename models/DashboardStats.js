import mongoose from 'mongoose';

const dashboardStatsSchema = new mongoose.Schema({
  totalStudents: { type: Number, default: 0 },
  totalFaculty: { type: Number, default: 0 },
  departments: { type: Number, default: 0 },
  subjects: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});

const DashboardStats = mongoose.model('DashboardStats', dashboardStatsSchema);
export default DashboardStats; 