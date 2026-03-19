# SoleMate POS — API Documentation

Base URL: `http://localhost:5000/api`

All protected routes require: `Authorization: Bearer <token>`

---

## 🔐 Authentication

### POST /auth/login
```json
{ "email": "admin@solemate.com", "password": "admin123" }
```
**Response:** `{ success, token, user: { id, name, email, role, avatar, store } }`

### GET /auth/me *(Protected)*
Returns the authenticated user.

### PUT /auth/profile *(Protected)*
```json
{ "name": "New Name", "phone": "01700...", "avatar": "https://..." }
```

### PUT /auth/change-password *(Protected)*
```json
{ "currentPassword": "...", "newPassword": "..." }
```

### GET /auth/users *(Admin, Manager)*
Returns all users.

### POST /auth/register *(Admin only)*
```json
{ "name": "...", "email": "...", "password": "...", "role": "staff|manager|admin", "phone": "...", "store": "..." }
```

### PUT /auth/users/:id *(Admin)*
Update any user by ID.

### DELETE /auth/users/:id *(Admin)*

---

## 👟 Products

### GET /products
Query params: `search`, `category`, `brand`, `minPrice`, `maxPrice`, `lowStock`, `page`, `limit`, `sort`

### GET /products/:id

### POST /products *(Admin, Manager)*
```json
{
  "name": "Air Max 270",
  "brand": "Nike",
  "category": "Sneakers",
  "price": 5500,
  "costPrice": 3200,
  "discount": 10,
  "description": "...",
  "images": ["https://..."],
  "supplier": "<supplierId>",
  "lowStockThreshold": 5,
  "variants": [
    { "size": "42", "color": "Black", "stock": 10, "sku": "NIK-AM270-42-BLK", "barcode": "..." }
  ]
}
```

### PUT /products/:id *(Admin, Manager)*
Same schema as POST.

### DELETE /products/:id *(Admin)*
Soft delete (sets isActive: false).

### PUT /products/:id/stock *(Admin, Manager)*
```json
{
  "variantUpdates": [
    { "size": "42", "color": "Black", "quantity": 5, "operation": "add" }
  ]
}
```
Operations: `add`, `subtract`, or `set`.

### GET /products/low-stock
Returns products at or below their low stock threshold.

### GET /products/categories
Returns list of distinct categories.

### GET /products/brands
Returns list of distinct brands.

---

## 🛒 Orders

### GET /orders
Query params: `status`, `paymentMethod`, `startDate`, `endDate`, `page`, `limit`, `search`

### GET /orders/:id

### POST /orders *(Protected)*
```json
{
  "items": [
    {
      "product": "<productId>",
      "name": "Air Max 270",
      "brand": "Nike",
      "size": "42",
      "color": "Black",
      "sku": "NIK-AM270-42-BLK",
      "price": 5500,
      "discount": 10,
      "quantity": 1,
      "total": 4950
    }
  ],
  "customer": "<customerId>",
  "customerName": "Walk-in Customer",
  "subtotal": 5500,
  "discountAmount": 550,
  "taxAmount": 247.5,
  "total": 5197.5,
  "paymentMethod": "cash",
  "paymentDetails": { "cashPaid": 6000, "change": 802.5 },
  "notes": "..."
}
```

### PUT /orders/:id/status *(Admin, Manager)*
```json
{ "status": "completed|pending|refunded|cancelled" }
```

### GET /orders/today-stats
Returns today's sales count and total revenue.

---

## 👥 Customers

### GET /customers
Query params: `search`, `page`, `limit`

### GET /customers/:id
Returns customer + recent 10 orders.

### GET /customers/search?q=...
Quick search by name, phone, or email.

### POST /customers
```json
{ "name": "Rahim Ahmed", "phone": "01700...", "email": "...", "city": "Dhaka", "discount": 5 }
```

### PUT /customers/:id

### DELETE /customers/:id *(Admin, Manager)*

---

## 🏭 Suppliers

### GET /suppliers
Query params: `search`, `page`, `limit`

### GET /suppliers/:id
Returns supplier + products linked to them.

### POST /suppliers *(Admin, Manager)*
```json
{
  "name": "Rahman Trading",
  "company": "Rahman Sports Ltd.",
  "email": "...",
  "phone": "...",
  "city": "Dhaka",
  "brands": ["Nike", "Adidas"]
}
```

### PUT /suppliers/:id *(Admin, Manager)*

### DELETE /suppliers/:id *(Admin)*

### POST /suppliers/:id/purchase *(Admin, Manager)*
```json
{
  "items": [{ "product": "<id>", "productName": "...", "size": "42", "quantity": 20, "costPrice": 3200, "total": 64000 }],
  "totalAmount": 64000,
  "status": "received",
  "invoiceNumber": "INV-001",
  "notes": "..."
}
```

---

## 📊 Dashboard

### GET /dashboard
Returns stats, charts (last7Days, last12Months, topProducts, paymentBreakdown).

### GET /dashboard/sales-report
Query params: `period` (daily | monthly), `startDate`, `endDate`

---

## ⚙️ Settings

### GET /settings

### PUT /settings *(Admin)*
```json
{
  "storeName": "SoleMate POS",
  "storeAddress": "Gulshan-1, Dhaka",
  "storePhone": "+880 17...",
  "storeEmail": "info@...",
  "currency": "BDT",
  "currencySymbol": "৳",
  "taxRate": 5,
  "taxName": "VAT",
  "lowStockThreshold": 5,
  "loyaltyPointsPerAmount": 100,
  "loyaltyDiscountPerPoint": 1,
  "receiptFooter": "Thank you!",
  "allowNegativeStock": false,
  "requireCustomer": false
}
```

---

## 🔔 Socket.io Events (Real-time)

| Event | Payload | Description |
|---|---|---|
| `newOrder` | Order object | New sale completed |
| `orderUpdated` | Order object | Order status changed |
| `productCreated` | Product object | New product added |
| `productUpdated` | Product object | Product modified |
| `stockUpdated` | `{ productId, totalStock }` | Stock changed |

---

## Error Responses

```json
{ "success": false, "message": "Error description" }
```

HTTP Status codes: `400` Bad Request, `401` Unauthorized, `403` Forbidden, `404` Not Found, `500` Server Error
