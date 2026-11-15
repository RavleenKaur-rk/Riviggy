# 🍔 Riviggy – Group Food Ordering System

A Node.js and Express-based backend for a group food ordering system designed to simplify collaborative food orders, item management, and bill splitting.

## 🚀 Features

- **Group Management:** Create and join group orders using a unique group code.
- **Order Management:** Add, remove, and manage food items in group orders.
- **Bill Splitting:** Supports equal and item-based bill splitting.
- **Payment Management:** Mock payment processing and payment status tracking.
- **Automatic Order Locking:** Automatically locks orders after 30 minutes.
- **Restaurant & Menu APIs:** Retrieve restaurant details and available menus.
- **File Handling:** Manage application data using JSON files and Node.js file operations.
- **File Streaming:** Maintain order activity logs using streams.
- **Authentication:** User signup, login, and session-based authentication.

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Backend Framework:** Express.js
- **Libraries:** UUID, CORS
- **Data Storage:** JSON files
- **API Testing:** Postman

## 📁 Project Structure

```text
riviggy/
├── controllers/
├── routes/
├── middleware/
├── utils/
├── data/
│   └── seed/
├── public/
├── logs/
├── server.js
├── package.json
└── README.md
```

## ⚙️ Installation & Setup

1. Clone the repository:

```bash
git clone https://github.com/RavleenKaur-rk/Riviggy.git
```

2. Navigate to the project directory:

```bash
cd Riviggy
```

3. Install dependencies:

```bash
npm install
```

4. Start the server:

```bash
npm start
```

For development:

```bash
npm run dev
```

The server runs at `http://localhost:3000`.

## 🔌 API Modules

| Module | Functionality |
|---|---|
| Restaurants | Restaurant and menu retrieval |
| Groups | Create, join, lock and delete groups |
| Orders | Add, remove and view order items |
| Payments | Mock payments and bill summaries |
| Users | Signup, login and logout |

## 🔄 Order Lifecycle

`OPEN → LOCKED → PAID → PLACED`

Orders are automatically locked after 30 minutes.

## 🧪 API Testing

The repository includes `Riviggy.postman_collection.json` for testing the backend API endpoints using Postman.

## 👥 Team Project

Riviggy was developed collaboratively as a team project.

**My Contribution:** [Add the modules or features you personally worked on.]

**Team Members:** [Add your teammates' names and GitHub profiles.]

## 👩‍💻 Author

**Ravleen Kaur**

[GitHub Profile](https://github.com/RavleenKaur-rk)

---

*Built as a collaborative backend development project.*
