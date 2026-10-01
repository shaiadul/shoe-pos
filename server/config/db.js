const mongoose = require('mongoose');
const logger = require('../utils/logger');
const User = require('../models/User');

const ensureDefaultAdmin = async () => {
  try {
    const adminExists = await User.findOne({ email: 'admin@solemate.com' });
    if (!adminExists) {
      await User.create({
        name: 'System Admin',
        email: 'admin@solemate.com',
        password: 'admin123',
        role: 'admin',
        phone: '+880 1711-111111',
        isActive: true,
        store: 'Main Store',
      });
      logger.info('👤 Default admin account created: admin@solemate.com / admin123');
    } else if (!adminExists.isActive) {
      adminExists.isActive = true;
      await adminExists.save();
      logger.info('👤 Default admin account reactivated: admin@solemate.com');
    }
  } catch (err) {
    logger.warn(`⚠️ Could not auto-ensure default admin: ${err.message}`);
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
    await ensureDefaultAdmin();
  } catch (error) {
    logger.error(`❌ MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
