# Pharmacy Management System
**A Comprehensive Database Management System (DBMS) Mini-Project**

---

## Executive Project Summary
The Pharmacy Management System is a full-stack web application designed to digitize and automate the core operations of a modern pharmacy. Built with a React.js frontend and a PostgreSQL backend (hosted on Supabase), the project successfully implements a strictly normalized, 3NF-compliant relational database featuring 8 interconnected tables. 

By leveraging advanced DBMS capabilities—including automated Triggers for real-time inventory management, Views for secure data abstraction, Stored Procedures for transaction integrity, and strict UNIQUE constraints to eliminate duplicate data—the system guarantees complete data consistency. Furthermore, it incorporates Role-Based Access Control (RBAC) to ensure secure authentication and authorization between administrative Managers and standard Employees.

---

## 1. System Architecture & Data Flow

The project follows a modern decoupled architecture:
*   **Frontend**: React.js (built with Vite) for a highly responsive, Single-Page Application (SPA).
*   **Backend / Database**: Supabase (PostgreSQL) providing Database-as-a-Service (DBaaS). Supabase automatically generates RESTful APIs based on our SQL schema.
*   **Communication**: The frontend uses the `@supabase/supabase-js` client to make asynchronous calls to the PostgreSQL database.

### Example Data Flow: Recording a Sale
1. **Frontend Action**: An employee selects a medicine, enters a quantity, and clicks "Execute Sale" in the React UI.
2. **API Call**: React uses the Supabase client to `INSERT` a row into the `Sales` table and the `Sales_Items` table.
3. **Database Trigger**: The moment the `INSERT` hits the `Sales_Items` table in PostgreSQL, the `trg_reduce_stock` Trigger fires automatically.
4. **Stored Procedure**: The trigger executes a stored function that recalculates the `Stock` table, subtracting the purchased quantity.
5. **Frontend Update**: React fetches the updated `vw_medicine_stock_details` View and instantly updates the UI to reflect the new lower stock level.

---

## 2. Frontend Implementation (React.js)

The frontend is designed for speed, usability, and professional aesthetics without relying on heavy UI frameworks.

### Key Technologies
*   **React Hooks**: Heavy use of `useState` for local state management (handling forms, modal windows, and active tabs) and `useEffect` for fetching data from Supabase upon component load.
*   **Lucide React**: Vector icons used throughout the UI to enhance visual clarity and provide a premium feel.
*   **CSS3 Variables**: A custom, pure CSS design system ("Neo-Minimalist") utilizing CSS root variables (`:root`) for a clean, white and blue-grey theme.

### Core Modules & Workflows
1. **Custom Authentication System**: A secure login portal that queries the `Employees` table. It verifies the encoded `password_hash` and mounts the application based on the employee's `role`.
2. **Role-Based Access Control (RBAC)**: 
    *   *Managers* see all tabs (Employees, Add Medicine, Clean Database).
    *   *Employees* only see operation tabs (POS Sales, Dashboard, Restock).
3. **Dynamic Dashboard**: Displays real-time statistical cards (Total Medicines, Low Stock alerts) by aggressively filtering the data returned from database views.
4. **Point of Sale (POS)**: A form that auto-detects existing customers by phone/email to prevent duplicates, processes the sale, and generates a printable receipt modal.
5. **Conceptual Clarity Badges**: The UI features glowing "Concept Badges" (e.g., `💡 Triggers: auto_create_stock()`) next to buttons. These explicitly explain to the user which backend database concept is powering the frontend action.

---

## 3. Database Architecture (Strict 3NF Compliance)

The relational database is built on PostgreSQL and consists of an 8-table schema. The schema is rigorously normalized to **Third Normal Form (3NF)** to eliminate data redundancy and anomalies.

### Table Descriptions
1. **`Suppliers`**: Manages vendor details. (`supplier_id` PK)
2. **`Medicines`**: Core inventory catalog. (`medicine_id` PK, `supplier_id` FK).
3. **`Stock`**: Tracks real-time quantity and expiry. (`stock_id` PK, `medicine_id` UNIQUE FK).
4. **`Customers`**: Stores client info. (`customer_id` PK, `phone` UNIQUE).
5. **`Employees`**: Staff auth & RBAC. (`employee_id` PK, `email` UNIQUE).
6. **`Sales`**: Master transaction record. (`sale_id` PK).
7. **`Sales_Items`**: Junction table resolving the Many-to-Many relationship between Sales and Medicines. Stores `unit_price_at_sale`.
8. **`Expiry_Alerts`**: Audit table for expiring medications.

### Normalization Highlights
*   **1NF & 2NF**: All attributes are atomic. No partial dependencies exist because all primary keys are single columns.
*   **3NF (No Transitive Dependencies)**: During development, derived columns (`total_amount` and `subtotal`) were intentionally dropped from the `Sales` tables. Storing calculated totals violates 3NF. Instead, the total is calculated dynamically using a `VIEW`. However, `unit_price_at_sale` was added to `Sales_Items` to permanently preserve the historical price of the medicine at the exact moment of sale (ensuring financial history is never corrupted if medicine prices rise in the future).

---

## 4. Advanced DBMS Concepts Implemented

This project leverages the database engine to handle complex business logic, reducing the burden on the frontend.

### A. Triggers (Automated Event Handling)
1. **`trg_auto_create_stock`**: Fires `AFTER INSERT` on `Medicines`. Automatically generates an initial empty stock row in the `Stock` table whenever a new medicine is added to the catalog.
2. **`trg_reduce_stock`**: Fires `AFTER INSERT` on `Sales_Items`. Automatically subtracts the purchased quantity from the `Stock` table.
3. **`trg_expiry_alert`**: Fires `AFTER INSERT OR UPDATE` on `Stock`. Checks the `expiry_date` and automatically inserts a warning into the `Expiry_Alerts` table if the medicine expires within 30 days.

### B. Views (Data Abstraction)
1. **`vw_medicine_stock_details`**: Abstract virtual table that `JOIN`s Medicines, Suppliers, and Stock. It allows the React frontend to fetch a complete inventory overview using a single API call without writing complex JOINs in JavaScript.
2. **`vw_sales_report`**: A complex aggregate View that dynamically calculates the total sale amount using `SUM(quantity * unit_price_at_sale)` on the fly, satisfying strict 3NF requirements while providing pre-calculated totals to the frontend.

### C. Stored Procedures & Constraints
*   **`create_sale(p_customer_id, p_employee_id)`**: Encapsulates the logic of inserting a new transaction record.
*   **Cascading Deletes**: `ON DELETE CASCADE` ensures that deleting a Supplier removes their Medicines, which in turn automatically removes related Stock and Sales_Items, preventing orphaned records.
*   **Unique Constraints**: Applied to `phone`, `email`, and `medicine_name` to absolutely prevent duplicate data entry at the database level.

---

## 5. Setup & Installation Instructions
To run this project locally on your machine for demonstration:

1. **Prerequisites**: Ensure you have Node.js installed.
2. **Clone/Download**: Extract the project folder to your local machine.
3. **Install Dependencies**: Open a terminal in the `frontend` folder and run:
   ```bash
   npm install
   ```
4. **Start the Development Server**: Run the following command:
   ```bash
   npm run dev
   ```
5. **Access the App**: Open your browser and navigate to the `localhost` URL provided in the terminal (usually `http://localhost:5173`).
6. **Database Connection**: Ensure the `.env` file in the frontend directory contains the correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to connect to the live PostgreSQL instance.

---
*Developed for University Database Management Systems (DBMS) Course Evaluation.*