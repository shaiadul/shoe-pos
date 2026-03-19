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
  await Promise.all([User.deleteMany(), Product.deleteMany(), Customer.deleteMany(), Supplier.deleteMany(), Settings.deleteMany(), Order.deleteMany()]);

  await Settings.create({
    storeName: 'SoleMate POS', storeAddress: 'Gulshan-1, Dhaka, Bangladesh',
    storePhone: '+880 1700-000000', storeEmail: 'info@solemate.com',
    currency: 'BDT', currencySymbol: '৳', taxRate: 5, taxName: 'VAT', lowStockThreshold: 5,
    receiptFooter: 'Thank you for shopping at SoleMate! | Return within 7 days with receipt.',
  });

  const users = await User.create([
    { name: 'Admin User', email: 'admin@solemate.com', password: 'admin123', role: 'admin', phone: '+880 1711-111111' },
    { name: 'Sales Staff', email: 'staff@solemate.com', password: 'staff123', role: 'staff', phone: '+880 1733-333333' },
  ]);
  console.log('✅ Users seeded');

  const suppliers = await Supplier.create([
    { name: 'Rahman Trading', company: 'Rahman Sports & Footwear Ltd.', email: 'rahman@trading.com', phone: '+880 1744-444444', city: 'Dhaka', brands: ['Nike', 'Adidas'] },
    { name: 'Karim Importers', company: 'Karim International', email: 'karim@importers.com', phone: '+880 1755-555555', city: 'Chittagong', brands: ['Puma', 'Reebok'] },
    { name: 'Ahmed Wholesale', company: 'Ahmed Shoe Palace', email: 'ahmed@wholesale.com', phone: '+880 1766-666666', city: 'Dhaka', brands: ['New Balance', 'Converse', 'Vans'] },
  ]);
  console.log('✅ Suppliers seeded');

  const products = await Product.create(shoeProducts.map((p, i) => ({
    ...p,
    discount: [0, 0, 10, 0, 5, 15, 0, 0, 0, 10, 0, 5][i],
    images: [`https://source.unsplash.com/400x400/?shoe,sneaker`],
    supplier: suppliers[i % 3]._id,
    lowStockThreshold: 5,
    featured: i < 4,
    variants: sizes.slice(0, 6).flatMap(size =>
      colors.slice(0, 2).map(color => ({
        size, color,
        stock: Math.floor(Math.random() * 20) + 2,
        sku: `${p.brand.slice(0, 3).toUpperCase()}-${p.name.replace(/\s/g, '-').toUpperCase().slice(0, 6)}-${size}-${color.slice(0, 3).toUpperCase()}`,
        barcode: `${Math.floor(Math.random() * 9000000000000) + 1000000000000}`,
      }))
    ),
  })));
  console.log('✅ Products seeded');

  // Customers with some due balances
  const customers = await Customer.create([
    { name: 'Rahim Ahmed', email: 'rahim@gmail.com', phone: '01700000001', city: 'Dhaka', loyaltyPoints: 250, totalPurchases: 5, totalSpent: 24500, dueBalance: 3500, totalDue: 3500 },
    { name: 'Fatima Khatun', email: 'fatima@gmail.com', phone: '01700000002', city: 'Chittagong', loyaltyPoints: 120, totalPurchases: 3, totalSpent: 12000, dueBalance: 0 },
    { name: 'Karim Islam', email: 'karim@gmail.com', phone: '01700000003', city: 'Sylhet', loyaltyPoints: 80, totalPurchases: 2, totalSpent: 8200, dueBalance: 6200, totalDue: 6200 },
    { name: 'Nasrin Begum', email: 'nasrin@gmail.com', phone: '01700000004', city: 'Dhaka', loyaltyPoints: 430, totalPurchases: 8, totalSpent: 43000, dueBalance: 0 },
    { name: 'Shafiq Uddin', phone: '01700000005', city: 'Rajshahi', loyaltyPoints: 60, totalPurchases: 2, totalSpent: 6000, dueBalance: 1800, totalDue: 1800 },
  ]);
  console.log('✅ Customers seeded');

  const orderData = [];
  const paymentMethods = ['cash', 'card', 'mobile_banking', 'due', 'partial'];
  for (let d = 0; d < 30; d++) {
    const date = new Date(); date.setDate(date.getDate() - d);
    const numOrders = Math.floor(Math.random() * 4) + 1;
    for (let o = 0; o < numOrders; o++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const variant = product.variants[Math.floor(Math.random() * product.variants.length)];
      const qty = Math.floor(Math.random() * 2) + 1;
      const itemTotal = product.price * qty * (1 - product.discount / 100);
      const tax = itemTotal * 0.05;
      const grandTotal = itemTotal + tax;
      const pmMethod = paymentMethods[Math.floor(Math.random() * 3)]; // only cash/card/mobile for seed
      orderData.push({
        items: [{ product: product._id, name: product.name, brand: product.brand, size: variant.size, color: variant.color, sku: variant.sku, price: product.price, discount: product.discount, quantity: qty, total: itemTotal }],
        customer: Math.random() > 0.4 ? customers[Math.floor(Math.random() * customers.length)]._id : undefined,
        customerName: Math.random() > 0.4 ? customers[0].name : 'Walk-in Customer',
        subtotal: product.price * qty, discountAmount: product.price * qty * product.discount / 100,
        taxAmount: tax, total: grandTotal, paidAmount: grandTotal, dueAmount: 0,
        paymentMethod: pmMethod,
        paymentDetails: { cashPaid: grandTotal + 500, change: 500 },
        status: 'completed', cashier: users[0]._id, cashierName: users[0].name,
        createdAt: date, updatedAt: date,
      });
    }
  }
  await Order.insertMany(orderData);
  console.log('✅ Orders seeded');

  console.log('\n🎉 Seed complete!\n');
  console.log('📋 Login credentials:');
  console.log('   Admin:  admin@solemate.com / admin123');
  console.log('   Staff:  staff@solemate.com / staff123\n');
  process.exit(0);
}

seedDB().catch(err => { console.error('❌ Seed failed:', err.message); process.exit(1); });
