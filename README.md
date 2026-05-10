# Nexus Pharmacy Sales Management System

A modern, serverless Full-Stack Pharmacy Management System built for high-performance inventory tracking and point-of-sale operations. 

This project evolved from a standard local PostgreSQL database into a fully-fledged cloud application featuring a stunning **Antigravity Glassmorphism UI** and real-time database integrations.

## 🚀 Technologies Used
- **Frontend Framework**: React (Vite)
- **Database & Backend**: Supabase (Cloud PostgreSQL)
- **Styling**: Vanilla CSS with modern Glassmorphism / Antigravity design
- **Database Logic**: Advanced PostgreSQL Triggers & Stored Functions

---

## ✨ Features
### 1. Antigravity Multi-Tab Dashboard
A fast, state-based Single Page Application (SPA) that allows instant, zero-reload navigation between modules:
- **Dashboard**: Record sales with dynamic customer/employee selection and view low-stock / expiry alerts.
- **Customers**: Manage the customer database and instantly add new clients.
- **Employees**: Manage staff rosters and roles.
- **Medicines**: Add, delete, and view the entire inventory, properly linked to Suppliers.

### 2. Serverless Database Architecture
The system completely bypasses traditional Express.js middleware by utilizing the `@supabase/supabase-js` SDK to communicate directly with a cloud-hosted PostgreSQL instance. 

### 3. Advanced Database Triggers
The application relies heavily on PostgreSQL for business logic:
- `trg_reduce_stock`: Automatically deducts inventory when a `Sales_Items` row is inserted.
- `trg_expiry_alert`: Automatically generates alerts for medicines expiring within 7 days.
- `trg_auto_create_stock`: Instantly creates a 0-quantity stock row whenever a new Medicine is added.

---

## 🗄️ Database Schema
### Main Tables
- **Medicines**: Core inventory data.
- **Suppliers**: Vendors providing medicines.
- **Customers**: Purchaser information.
- **Employees**: Staff and management.
- **Sales & Sales_Items**: Transactional data linked to customers and employees.
- **Stock**: Real-time quantity tracking.
- **Expiry_Alerts**: Automated notification logs.

### ER Diagram
![ER Diagram](diagrams/er_diagram.png)

---

## 💻 Running the Project Locally

### Prerequisites
- Node.js installed

### Setup Instructions
1. Clone the repository:
   ```bash
   git clone https://github.com/kiranmgowda0105-max/dbms-final-project.git
   cd dbms-final-project/frontend
   ```

2. Install Dependencies:
   ```bash
   npm install
   ```

3. Start the Development Server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173` to experience the UI!

*(Note: The database connection is managed via the `supabaseClient.js` file.)*