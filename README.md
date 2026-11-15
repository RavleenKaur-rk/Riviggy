# Riviggy — Group Food Ordering System
## Node.js + Express Backend

---

## 🚀 Quick Start

```bash
npm install
npm start          # production
npm run dev        # development (nodemon)
```

Server runs at: **http://localhost:3000**

---

## 📁 Project Structure

```
riviggy/
├── server.js                   # Entry point
├── routes/
│   ├── groupRoutes.js           # POST/GET/PATCH/DELETE /group
│   ├── orderRoutes.js           # POST/GET/DELETE /order
│   ├── paymentRoutes.js         # POST/GET /payment
│   └── restaurantRoutes.js     # GET /restaurants, /menu
├── controllers/
│   ├── groupController.js       # Group logic
│   ├── orderController.js       # Item management
│   ├── paymentController.js     # Mock payments
│   └── restaurantController.js # Restaurant & menu data
├── utils/
│   ├── fileHandler.js           # 1️⃣ fs CRUD  +  2️⃣ Streams
│   ├── lockWatcher.js           # Auto-lock expired orders
│   └── billSplitter.js         # 🧮 Item-based & equal split
├── data/
│   ├── seed/
│   │   ├── restaurants.json     # Seed data
│   │   └── menus.json
│   ├── restaurants.json         # Live data (auto-created)
│   ├── menus.json
│   ├── orders.json
│   └── payments.json
├── public/                      # 4️⃣ Static files
│   ├── index.html               # API documentation page
│   └── images/
│       ├── restaurants/
│       └── menu/
├── logs/
│   └── order_history.log        # 2️⃣ Streamed log file
└── Riviggy.postman_collection.json
```

---

## 🔌 API Reference

### Restaurants
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/restaurants` | List all restaurants |
| GET | `/restaurants/menu/:id` | Get menu for a restaurant |
| GET | `/restaurants/logs` | View order history (streamed) |

### Group Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/group/create` | Create a new group order |
| POST | `/group/join` | Join using group code |
| GET | `/group/:code` | Get group details |
| PATCH | `/group/lock` | Manually lock order |
| DELETE | `/group/:code` | Delete group |

### Order Items
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/order/add-item` | Add item to group order |
| DELETE | `/order/remove-item` | Remove an item |
| GET | `/order/:code/items` | View all items by user |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payment/pay` | Pay your share (mock) |
| GET | `/payment/status/:code` | View payment summary |
| GET | `/payment/bill/:code/:userId` | View your bill |

---

## 📊 Order Lifecycle

```
OPEN → LOCKED → PAID (all paid) → PLACED
         ↑
    Auto-lock after 30 min
```

---

## 🎓 Syllabus Features Covered

| # | Feature | Implementation |
|---|---------|----------------|
| 1️⃣ | File Module (fs) | `utils/fileHandler.js` — CRUD on JSON files |
| 2️⃣ | File Streaming | `readOrderLogs()` & `logOrderEvent()` use streams |
| 3️⃣ | HTTP / Express | All REST routes in `/routes` |
| 4️⃣ | Static Files | `app.use(express.static("public"))` |
| 5️⃣ | HTTP Methods | GET, POST, PATCH, DELETE all used correctly |
