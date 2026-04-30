require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Settings = require('../models/Settings');
const Order = require('../models/Order');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/shoe_pos';
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');
};

const sizes = ['38', '39', '40', '41', '42', '43', '44', '45'];
const colors = ['Black', 'White', 'Red', 'Blue', 'Grey', 'Brown'];

const shoeProducts = [
  { name: 'Air Max 270', brand: 'Nike', category: 'Sneakers', price: 5500, costPrice: 3200, description: 'Premium air cushion sneakers' },
  { name: 'Ultra Boost 22', brand: 'Adidas', category: 'Sports', price: 6200, costPrice: 3800, description: 'High performance running shoes' },
  { name: 'RS-X Toys', brand: 'Puma', category: 'Sneakers', price: 4800, costPrice: 2900, description: 'Retro style chunky sneakers' },
  { name: 'Classic Leather', brand: 'Reebok', category: 'Casual', price: 3900, costPrice: 2200, description: 'Timeless leather casual shoes' },
  { name: '574 Core', brand: 'New Balance', category: 'Sneakers', price: 4500, costPrice: 2700, description: 'Classic 574 silhouette' },
  { name: 'Chuck Taylor High', brand: 'Converse', category: 'Casual', price: 3200, costPrice: 1800, description: 'Iconic canvas high top' },
  { name: 'Old Skool Pro', brand: 'Vans', category: 'Casual', price: 3500, costPrice: 2000, description: 'Classic skate shoe' },
  { name: "D'Lites 3.0", brand: 'Skechers', category: 'Casual', price: 4200, costPrice: 2500, description: 'Chunky lifestyle sneaker' },
  { name: 'Air Force 1 Low', brand: 'Nike', category: 'Sneakers', price: 5200, costPrice: 3100, description: 'Basketball-inspired icon' },
  { name: 'Stan Smith', brand: 'Adidas', category: 'Casual', price: 4100, costPrice: 2400, description: 'Minimalist tennis classic' },
  { name: 'Oxford Brogue', brand: 'Reebok', category: 'Formal', price: 5800, costPrice: 3400, description: 'Premium leather formal shoe' },
  { name: 'Suede Classic', brand: 'Puma', category: 'Casual', price: 3700, costPrice: 2100, description: 'Suede upper casual icon' },
];

async function seedDB() {
  await connectDB();
  console.log('🧹 Clearing existing data...');
  await Promise.all([
    User.deleteMany(),
    Product.deleteMany(),
    Customer.deleteMany(),
    Supplier.deleteMany(),
    Settings.deleteMany(),
    Order.deleteMany()
  ]);

  await Settings.create({
    storeName: 'SoleMate POS',
    storeAddress: 'Gulshan-1, Dhaka, Bangladesh',
    storePhone: '+880 1700-000000',
    storeEmail: 'info@solemate.com',
    currency: 'BDT',
    currencySymbol: '৳',
    taxRate: 5,
    taxName: 'VAT',
    lowStockThreshold: 5,
    receiptFooter: 'Thank you for shopping at SoleMate! | Return within 7 days with receipt.',
  });

  await User.create([
    { name: 'Admin User', email: 'admin@solemate.com', password: 'admin123', role: 'admin', phone: '+880 1711-111111' },
    { name: 'Sales Staff', email: 'staff@solemate.com', password: 'staff123', role: 'staff', phone: '+880 1733-333333' },
  ]);
  console.log('✅ Users & Settings seeded');

  console.log('\n🎉 Seed complete!\n');
  console.log('📋 Login credentials:');
  console.log('   Admin:  admin@solemate.com / admin123');
  console.log('   Staff:  staff@solemate.com / staff123\n');
  process.exit(0);
}

seedDB().catch(err => { console.error('❌ Seed failed:', err.message); process.exit(1); });
