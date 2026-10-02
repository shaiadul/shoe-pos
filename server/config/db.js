const mongoose = require('mongoose');
const logger = require('../utils/logger');
const User = require('../models/User');

const ensureDefaultCredentials = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME || 'System Admin';
    const adminPhone = process.env.ADMIN_PHONE || '+880 1711-111111';

    // 1. Ensure Default Admin from env
    if (adminEmail && adminPassword) {
      const normalizedAdminEmail = adminEmail.toLowerCase().trim();
      let admin = await User.findOne({ email: normalizedAdminEmail }).select('+password');
      if (!admin) {
        await User.create({
          name: adminName,
          email: normalizedAdminEmail,
          password: adminPassword,
          role: 'admin',
          phone: adminPhone,
          isActive: true,
          store: 'Main Store',
        });
        logger.info(`👤 Admin account seeded: ${normalizedAdminEmail}`);
      } else {
        let needsSave = false;
        if (!admin.isActive) {
          admin.isActive = true;
          needsSave = true;
        }
        if (admin.role !== 'admin') {
          admin.role = 'admin';
          needsSave = true;
        }
        const match = await admin.matchPassword(adminPassword);
        if (!match) {
          admin.password = adminPassword;
          needsSave = true;
        }
        if (needsSave) {
          await admin.save();
          logger.info(`👤 Admin account synchronized & verified: ${normalizedAdminEmail}`);
        }
      }
    }

    // 2. Ensure Default Staff from env
    const staffEmail = process.env.STAFF_EMAIL;
    const staffPassword = process.env.STAFF_PASSWORD;
    const staffName = process.env.STAFF_NAME || 'Sales Staff';
    const staffPhone = process.env.STAFF_PHONE || '+880 1733-333333';

    if (staffEmail && staffPassword) {
      const normalizedStaffEmail = staffEmail.toLowerCase().trim();
      let staff = await User.findOne({ email: normalizedStaffEmail }).select('+password');
      if (!staff) {
        await User.create({
          name: staffName,
          email: normalizedStaffEmail,
          password: staffPassword,
          role: 'staff',
          phone: staffPhone,
          isActive: true,
          store: 'Main Store',
        });
        logger.info(`👤 Staff account seeded: ${normalizedStaffEmail}`);
      } else {
        let needsSave = false;
        if (!staff.isActive) {
          staff.isActive = true;
          needsSave = true;
        }
        const match = await staff.matchPassword(staffPassword);
        if (!match) {
          staff.password = staffPassword;
          needsSave = true;
        }
        if (needsSave) {
          await staff.save();
          logger.info(`👤 Staff account synchronized & verified: ${normalizedStaffEmail}`);
        }
      }
    }
  } catch (err) {
    logger.warn(`⚠️ Could not auto-ensure default credentials: ${err.message}`);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      family: 4,
    });
    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
    await ensureDefaultCredentials();
  } catch (error) {
    logger.error(`❌ MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
