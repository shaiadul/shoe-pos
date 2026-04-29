# 👟 SoleMate POS — Full-Stack MERN Shoe Point of Sale System

A production-ready, full-stack MERN Shoe POS with a modern, Shopify-inspired UI.

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+ not alpin
- MongoDB (local or Atlas)

### 1. Clone & Install
```bash
git clone <repo-url>
cd shoe-pos
npm run install:all
```

### 2. Configure Environment
```bash
cp server/.env.example server/.env
# Edit server/.env with your MongoDB URI and JWT secret
```

### 3. Seed the Database
```bash
npm run seed
```

### 4. Start Development
```bash
npm run dev
# Server: http://localhost:5000
# Client: http://localhost:5173
```

---

## 🔑 Demo Credentials

| Role    | Email                    | Password    |
|---------|--------------------------|-------------|
| Admin   | admin@solemate.com       | admin123    |
| Staff   | staff@solemate.com       | staff123    |

---

## 📁 Project Structure

```
shoe-pos/
├── server/                    # Express.js Backend
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── orderController.js
│   │   ├── customerController.js
│   │   ├── supplierController.js
│   │   ├── dashboardController.js
│   │   └── settingsController.js
│   ├── middleware/
│   │   ├── auth.js            # JWT + Role-based auth
│   │   └── errorHandler.js    # Global error handler
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   ├── Customer.js
│   │   ├── Supplier.js
│   │   └── Settings.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── orders.js
│   │   ├── customers.js
│   │   ├── suppliers.js
│   │   ├── dashboard.js
│   │   └── settings.js
│   ├── seed/
│   │   └── seed.js            # Sample data seeder
│   ├── .env.example
│   ├── package.json
│   └── server.js              # App entry point
│
└── client/                    # React.js Frontend
    ├── src/
    │   ├── api/
    │   │   └── index.js       # Axios API client
    │   ├── components/
    │   │   ├── Layout/
    │   │   │   ├── Layout.jsx
    │   │   │   ├── Sidebar.jsx
    │   │   │   ├── Topbar.jsx
    │   │   │   └── ProtectedRoute.jsx
    │   │   └── UI/
    │   │       └── index.jsx  # Reusable UI components
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   ├── ThemeContext.jsx
    │   │   └── SettingsContext.jsx
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── DashboardPage.jsx
    │   │   ├── POSPage.jsx
    │   │   ├── ProductsPage.jsx
    │   │   ├── OrdersPage.jsx
    │   │   ├── CustomersPage.jsx
    │   │   ├── SuppliersPage.jsx
    │   │   ├── ReportsPage.jsx
    │   │   ├── SettingsPage.jsx
    │   │   └── UsersPage.jsx
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css          # Tailwind + design tokens
    ├── tailwind.config.js
    ├── vite.config.js
    └── package.json
```

---

## 🌐 Deployment

### Option A: Render (Backend) + Vercel (Frontend)

#### Backend on Render
1. Create new **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repo
3. Set **Root Directory**: `server`
4. **Build Command**: `npm install`
5. **Start Command**: `npm start`
6. Add environment variables:
   - `MONGODB_URI` = your MongoDB Atlas URI
   - `JWT_SECRET` = a long random string
   - `CLIENT_URL` = your Vercel frontend URL
   - `NODE_ENV` = production

#### Frontend on Vercel
1. Import repo on [vercel.com](https://vercel.com)
2. Set **Root Directory**: `client`
3. **Framework**: Vite
4. Add env variable:
   - `VITE_API_URL` = your Render backend URL
5. Update `vite.config.js` proxy to use `VITE_API_URL`

---

### Option B: VPS (DigitalOcean/Hetzner)

```bash
# On your server
git clone <repo> /var/www/shoe-pos
cd /var/www/shoe-pos

# Install PM2
npm install -g pm2

# Install dependencies
cd server && npm install
cd ../client && npm install && npm run build

# Start backend
cd /var/www/shoe-pos/server
pm2 start server.js --name shoe-pos-api

# Nginx config
sudo nano /etc/nginx/sites-available/shoe-pos
```

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend (built static files)
    location / {
        root /var/www/shoe-pos/client/dist;
        try_files $uri /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    # Socket.io
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/shoe-pos /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# SSL with Let's Encrypt
sudo certbot --nginx -d yourdomain.com
```

---

## ✨ Features

- **JWT Authentication** with role-based access (Admin, Manager, Staff)
- **POS Screen** — Fast checkout, cart, size/color selection, discount
- **Product Management** — Variants (size + color), SKU, barcode, supplier link
- **Real-time Stock** — Auto-deduct on sale, low stock alerts
- **Order System** — PDF receipts, payment methods, refunds
- **Customer CRM** — Profiles, purchase history, loyalty points
- **Supplier Management** — Brands, purchase history, stock-in tracking
- **Dashboard** — Revenue charts, top products, payment breakdown
- **Reports** — Daily/monthly sales, CSV export
- **Settings** — Tax, currency, store info, loyalty config
- **Dark/Light Mode** — System-aware, persistent preference
- **Responsive** — Desktop & tablet optimized POS layout
- **Socket.io** — Real-time order and stock updates
