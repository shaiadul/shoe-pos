require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function seedCredentials() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
    console.log('Connected! Checking default credentials...');

    // 1. Admin
    let admin = await User.findOne({ email: 'admin@solemate.com' }).select('+password');
    if (!admin) {
      admin = await User.create({
        name: 'System Admin',
        email: 'admin@solemate.com',
        password: 'admin123',
        role: 'admin',
        phone: '+880 1711-111111',
        isActive: true,
        store: 'Main Store',
      });
      console.log('✅ Created default admin: admin@solemate.com / admin123');
    } else {
      admin.password = 'admin123';
      admin.isActive = true;
      await admin.save();
      console.log('✅ Reset & verified default admin: admin@solemate.com / admin123');
    }

    // 2. Staff
    let staff = await User.findOne({ email: 'staff@solemate.com' }).select('+password');
    if (!staff) {
      staff = await User.create({
        name: 'Sales Staff',
        email: 'staff@solemate.com',
        password: 'staff123',
        role: 'staff',
        phone: '+880 1733-333333',
        isActive: true,
        store: 'Main Store',
      });
      console.log('✅ Created default staff: staff@solemate.com / staff123');
    } else {
      staff.password = 'staff123';
      staff.isActive = true;
      await staff.save();
      console.log('✅ Reset & verified default staff: staff@solemate.com / staff123');
    }

    console.log('\nDefault credentials ready:');
    console.log('  👑 Admin: admin@solemate.com / admin123');
    console.log('  💼 Staff: staff@solemate.com / staff123\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to seed default credentials:', err.message);
    process.exit(1);
  }
}

seedCredentials();
