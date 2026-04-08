# ExpenseTracker — Personal Finance Management App

## Problem Statement

Managing day to day expenses is something most people struggle to do consistently. Existing solutions are either too complex or require paid subscriptions. This project is a lightweight, single page web application that lets users log, categorise, and monitor their personal spending in one place without unnecessary steps or page reloads.

---

## Tech Stack

| Layer | Technology |

| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB (via Mongoose ODM) |
| Environment | dotenv |
| Dev Tools | Nodemon, VS Code, Live Server |

---

## Features

- **Add expenses** with a title, amount, category, date, and optional description
- **Edit existing expenses** via a pre-filled modal form
- **Delete expenses** with a confirmation prompt to prevent accidental removal
- **Real-time summary cards** showing total spent, this month's total, entry count and top category
- **Donut chart** showing spending distribution across categories with custom legend
- **Bar chart** showing monthly spending comparison across last 6 months
- **Clickable monthly trends**  click any month to see a detailed category donut chart and comparison bar chart
- **Monthly budget tracker** set spending limits per category with colour-coded progress bars (green/amber/red)
- **Search and filter** expenses by keyword, category, and month
- **Sidebar navigation** with Dashboard, All Expenses, Budgets and Trends sections
- **Toast notifications** for all actions (add, edit, delete, save budgets)
- **Loading spinner** while data is being fetched from the database
- **Single-Page Application**  no page reloads, all updates happen dynamically
- **Responsive design**  works on both desktop and mobile screens
- **Form validation** prevents submission of incomplete or invalid data
- **Error handling** displays user friendly messages if the server is unavailable

---

## Folder Structure


expense-tracker/
├── Backend/
│   ├── models/
│   │   └── Expense.js        # Mongoose schema for expense documents
│   ├── .env                  # Environment variables (MongoDB URI, port)
│   ├── package.json
│   └── server.js             # Express server with all CRUD API routes
├── Frontend/
│   ├── index.html            # Single HTML file — the entire UI lives here
│   ├── style.css             # All styling, layout, and responsive rules
│   └── script.js             # All frontend logic — fetch, render, filter, CRUD
├── database/
│   └── expenses_export.json  # Exported MongoDB data for submission
└── README.md


---

## How to Run the Project Locally

### Prerequisites
- Node.js installed
- MongoDB Atlas account with a cluster set up

### Steps

1. Clone or extract the project folder
2. Open a terminal and navigate to the Backend folder:

cd Backend
npm install
npm run dev

3. Open a second terminal, navigate to the Frontend folder, and open `index.html` using Live Server in VS Code
4. The app should be running at `http://127.0.0.1:5500/index.html` with the backend on `http://localhost:5000`

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | /expenses | Fetch all expenses |
| POST | /expenses | Create a new expense |
| PUT | /expenses/:id | Update an existing expense |
| DELETE | /expenses/:id | Delete an expense |

---

## Challenges Overcome

Building this project came with a few real hurdles. The first was understanding how a single page Application works in practice, rather than loading new HTML pages, all UI changes had to be handled dynamically through JavaScript DOM manipulation, which required a shift in thinking. The second challenge was connecting the frontend to the backend correctly, particularly handling CORS errors that blocked API requests between the two local servers. This was resolved by adding the `cors` middleware in express. The third issue was managing the edit and delete flow cleanly specifically, ensuring the modal form correctly pre filled with existing data and that the delete confirmation modal tracked the right expense ID without page state being lost. Finally formatting dates consistently across the frontend (converting MongoDB ISO date strings to readable Australian date format) took some trial and error but was solved using JavaScript's `toLocaleDateString` method.

---

## Database Export

A sample export of the MongoDB collection is included in the `/database` folder as `expenses_export.json`. This was generated using MongoDB Compass's export feature and contains sample expense documents used during development and testing.
