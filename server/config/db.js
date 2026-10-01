const mongoose = require('mongoose');
const logger = require('../utils/logger');
const User = require('../models/User');

const ensureDefaultCredentials = async () => {
  try {
    // 1. Ensure Default Admin
    let admin = await User.findOne({ email: 'admin@solemate.com' }).select('+password');
    if (!admin) {
      await User.create({
        name: 'System Admin',
        email: 'admin@solemate.com',
        password: 'admin123',
        role: 'admin',
        phone: '+880 1711-111111',
        isActive: true,
        store: 'Main Store',
      });
      logger.info('👤 Default admin account seeded: admin@solemate.com / admin123');
    } else {
      let needsSave = false;
      if (!admin.isActive) {
        admin.isActive = true;
        needsSave = true;
      }
      const match = await admin.matchPassword('admin123');
      if (!match) {
        admin.password = 'admin123';
        needsSave = true;
      }
      if (needsSave) {
        await admin.save();
        logger.info('👤 Default admin account verified & updated: admin@solemate.com / admin123');
      }
    }

    // 2. Ensure Default Staff
    let staff = await User.findOne({ email: 'staff@solemate.com' }).select('+password');
    if (!staff) {
      await User.create({
        name: 'Sales Staff',
        email: 'staff@solemate.com',
        password: 'staff123',
        role: 'staff',
        phone: '+880 1733-333333',
        isActive: true,
        store: 'Main Store',
      });
      logger.info('👤 Default staff account seeded: staff@solemate.com / staff123');
    } else {
      let needsSave = false;
      if (!staff.isActive) {
        staff.isActive = true;
        needsSave = true;
      }
      const match = await staff.matchPassword('staff123');
      if (!match) {
        staff.password = 'staff123';
        needsSave = true;
      }
      if (needsSave) {
        await staff.save();
        logger.info('👤 Default staff account verified & updated: staff@solemate.com / staff123');
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
