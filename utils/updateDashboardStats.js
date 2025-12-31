import DashboardStats from '../models/DashboardStats.js';
import Student from '../models/Student.js';
import Faculty from '../models/Faculty.js';
import Department from '../models/Department.js';
import Subject from '../models/Subject.js';

export default async function updateDashboardStats() {
  const totalStudents = await Student.countDocuments();
  const totalFaculty = await Faculty.countDocuments();
  const departments = await Department.countDocuments();
  const subjects = await Subject.countDocuments();

  let stats = await DashboardStats.findOne();
  if (!stats) {
    stats = new DashboardStats();
  }
  stats.totalStudents = totalStudents;
  stats.totalFaculty = totalFaculty;
  stats.departments = departments;
  stats.subjects = subjects;
  stats.updatedAt = Date.now();
  await stats.save();
} 