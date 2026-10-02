require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function seedCredentials() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
    console.log('Connected! Checking default credentials...');

    // 1. Admin from env
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@solemate.com').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminName = process.env.ADMIN_NAME || 'System Admin';
    const adminPhone = process.env.ADMIN_PHONE || '+880 1711-111111';

    let admin = await User.findOne({ email: adminEmail }).select('+password');
    if (!admin) {
      admin = await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        phone: adminPhone,
        isActive: true,
        store: 'Main Store',
      });
      console.log(`✅ Created admin account: ${adminEmail}`);
    } else {
      admin.password = adminPassword;
      admin.role = 'admin';
      admin.isActive = true;
      await admin.save();
      console.log(`✅ Reset & verified admin account: ${adminEmail}`);
    }

    // 2. Staff from env
    const staffEmail = (process.env.STAFF_EMAIL || 'staff@solemate.com').toLowerCase().trim();
    const staffPassword = process.env.STAFF_PASSWORD || 'staff123';
    const staffName = process.env.STAFF_NAME || 'Sales Staff';
    const staffPhone = process.env.STAFF_PHONE || '+880 1733-333333';

    let staff = await User.findOne({ email: staffEmail }).select('+password');
    if (!staff) {
      staff = await User.create({
        name: staffName,
        email: staffEmail,
        password: staffPassword,
        role: 'staff',
        phone: staffPhone,
        isActive: true,
        store: 'Main Store',
      });
      console.log(`✅ Created staff account: ${staffEmail}`);
    } else {
      staff.password = staffPassword;
      staff.isActive = true;
      await staff.save();
      console.log(`✅ Reset & verified staff account: ${staffEmail}`);
    }

    console.log('\nDefault credentials ready:');
    console.log(`  👑 Admin: ${adminEmail}`);
    console.log(`  💼 Staff: ${staffEmail}\n`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to seed default credentials:', err.message);
    process.exit(1);
  }
}

seedCredentials();
