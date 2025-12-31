import { config as configDotenv } from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import authRouter from './routes/auth.js';
import semestersRouter from './routes/semesters.js';
import studentsRouter from './routes/students.js';
import subjectsRouter from './routes/subjects.js';
import facultyRouter from './routes/faculty.js';
import departmentsRouter from './routes/departments.js';
import usersRouter from './routes/users.js';
import pendingRegistrationsRouter from './routes/pendingRegistrations.js';
import marksheetsRouter from './routes/marksheets.js';
import dashboardRouter from './routes/dashboard.js';
import dashboardStatsRouter from './routes/dashboardStats.js';
import facultyProfileRouter from './routes/facultyProfile.js';
import studentDashboardRouter from './routes/studentDashboard.js';

configDotenv();

// Warn if critical environment variables are missing
if (!process.env.JWT_SECRET) {
  console.warn('Warning: JWT_SECRET is not set in .env file!');
}
if (!process.env.MONGO_URI_CLOUD) {
  console.warn('Warning: MONGO_URI is not set in .env file!');
}

console.log(`Running in ${process.env.NODE_ENV || 'development'} mode.`);

const app = express();
app.use(cors());
app.use(express.json());


mongoose.connect(process.env.MONGO_URI_CLOUD, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));


  app.get("/" ,(req,res)=>{
    res.send("heloo  to major project ")
  })
app.use('/api/auth', authRouter);
app.use('/api/semesters', semestersRouter);
app.use('/api/students', studentsRouter);
app.use('/api/subjects', subjectsRouter);
app.use('/api/faculty', facultyRouter);
app.use('/api/departments', departmentsRouter);
app.use('/api/users', usersRouter);
app.use('/api/pending-registrations', pendingRegistrationsRouter);
app.use('/api/marksheets', marksheetsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/dashboard-stats', dashboardStatsRouter);
app.use('/api/faculty-profile', facultyProfileRouter);
app.use('/api/student-dashboard', studentDashboardRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 