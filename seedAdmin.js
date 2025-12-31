import mongoose from 'mongoose';
import User from './models/User.js';
import { config as configDotenv } from 'dotenv';

configDotenv();

const MONGO_URI = process.env.MONGO_URI_CLOUD;

async function seedAdmins() {
  await mongoose.connect(MONGO_URI);

  const admins = [
    {
      role: 'admin',
      name: 'Admin One',
      email: 'admin1@example.com',
      phone: '9999999999',
      password: 'adminpassword1',
      address: 'Admin Address 1',
      dob: new Date('1990-01-01')
    },
    {
      role: 'admin',
      name: 'Admin Two',
      email: 'admin2@example.com',
      phone: '8888888888',
      password: 'adminpassword2',
      address: 'Admin Address 2',
      dob: new Date('1992-02-02')
    }
  ];

  for (const admin of admins) {
    const exists = await User.findOne({ email: admin.email });
    if (!exists) {
      await User.create(admin);
      console.log(`Admin ${admin.email} created.`);
    } else {
      console.log(`Admin ${admin.email} already exists.`);
    }
  }

  mongoose.disconnect();
}

seedAdmins(); 