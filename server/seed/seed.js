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
  await mongoose.connect(uri, { family: 4 });
  console.log('✅ Connected to MongoDB');
};

const sizes = ['38', '39', '40', '41', '42', '43', '44', '45'];
const colors = ['Black', 'White', 'Red', 'Blue', 'Grey', 'Brown'];

const shoeProducts = [
  { name: 'Air Max 270', brand: 'Nike', category: 'Sneakers', price: 15500, costPrice: 9200, description: 'Premium air cushion sneakers with breathable mesh upper.', images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800'] },
  { name: 'Ultra Boost 22', brand: 'Adidas', category: 'Sports', price: 18200, costPrice: 11000, description: 'High performance running shoes with energy-returning boost foam.', images: ['https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?auto=format&fit=crop&q=80&w=800'] },
  { name: 'RS-X Toys', brand: 'Puma', category: 'Sneakers', price: 12800, costPrice: 7900, description: 'Retro style chunky sneakers with vibrant color accents.', images: ['https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&q=80&w=800'] },
  { name: 'Classic Leather', brand: 'Reebok', category: 'Casual', price: 8900, costPrice: 5200, description: 'Timeless leather casual shoes for everyday wear.', images: ['https://images.unsplash.com/photo-1512374382149-4332c6c021f1?auto=format&fit=crop&q=80&w=800'] },
  { name: '574 Core', brand: 'New Balance', category: 'Sneakers', price: 11500, costPrice: 6700, description: 'Classic 574 silhouette with suede and mesh upper.', images: ['https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?auto=format&fit=crop&q=80&w=800'] },
  { name: 'Chuck Taylor High', brand: 'Converse', category: 'Casual', price: 7200, costPrice: 4200, description: 'Iconic canvas high top that never goes out of style.', images: ['https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&q=80&w=800'] },
  { name: 'Old Skool Pro', brand: 'Vans', category: 'Casual', price: 7500, costPrice: 4500, description: 'Classic skate shoe with reinforced duracap underlays.', images: ['https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&q=80&w=800'] },
  { name: 'Stan Smith', brand: 'Adidas', category: 'Casual', price: 9100, costPrice: 5400, description: 'Minimalist tennis classic with clean white leather.', images: ['https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&q=80&w=800'] },
  { name: 'Air Force 1 Low', brand: 'Nike', category: 'Sneakers', price: 13200, costPrice: 8100, description: 'Basketball-inspired icon with premium leather finish.', images: ['https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=800'] },
  { name: 'Chelsea Boot', brand: 'Timberland', category: 'Boots', price: 16500, costPrice: 9800, description: 'Rugged yet elegant waterproof leather boots.', images: ['https://images.unsplash.com/photo-1638247025967-b4e38f787b76?auto=format&fit=crop&q=80&w=800'] },
];

const dummyCustomers = [
  { name: 'Saidul Islam', phone: '01711223344', email: 'saidul@example.com', address: 'Dhaka, Bangladesh' },
  { name: 'Jannat Akter', phone: '01822334455', email: 'jannat@example.com', address: 'Chittagong, Bangladesh' },
  { name: 'Arif Ahmed', phone: '01933445566', email: 'arif@example.com', address: 'Sylhet, Bangladesh' },
];

const dummySuppliers = [
  { name: 'Nike Distribution BD', contactPerson: 'Mr. Rahim', phone: '01700112233', email: 'dist@nike.com', address: 'Gazipur, Bangladesh' },
  { name: 'Apex Footwear Ltd', contactPerson: 'Ms. Salma', phone: '01711998877', email: 'info@apex.com', address: 'Dhaka, Bangladesh' },
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

  const [seededSuppliers, seededCustomers] = await Promise.all([
    Supplier.insertMany(dummySuppliers),
    Customer.insertMany(dummyCustomers)
  ]);

  const productsToSeed = shoeProducts.map(p => ({
    ...p,
    supplier: seededSuppliers[Math.floor(Math.random() * seededSuppliers.length)]._id,
    totalStock: 50,
    variants: sizes.map(size => ({
      size,
      color: colors[Math.floor(Math.random() * colors.length)],
      stock: 5 + Math.floor(Math.random() * 10),
      sku: `${p.brand.substring(0, 3)}-${p.name.substring(0, 3)}-${size}`.toUpperCase()
    }))
  }));

  await Product.insertMany(productsToSeed);

  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@solemate.com').toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const adminName = process.env.ADMIN_NAME || 'Admin User';
  const adminPhone = process.env.ADMIN_PHONE || '+880 1711-111111';

  const staffEmail = (process.env.STAFF_EMAIL || 'staff@solemate.com').toLowerCase().trim();
  const staffPassword = process.env.STAFF_PASSWORD || 'staff123';
  const staffName = process.env.STAFF_NAME || 'Sales Staff';
  const staffPhone = process.env.STAFF_PHONE || '+880 1733-333333';

  await User.create([
    { name: adminName, email: adminEmail, password: adminPassword, role: 'admin', phone: adminPhone },
    { name: staffName, email: staffEmail, password: staffPassword, role: 'staff', phone: staffPhone },
  ]);
  console.log('✅ Users, Products, Customers & Suppliers seeded');

  console.log('\n🎉 Seed complete!\n');
  console.log('📋 Login accounts ready:');
  console.log(`   Admin:  ${adminEmail}`);
  console.log(`   Staff:  ${staffEmail}\n`);
  process.exit(0);
}

seedDB().catch(err => { console.error('❌ Seed failed:', err.message); process.exit(1); });
