# Database Analysis & Schema Study Guide: Pharmacy Management System

This document provides a comprehensive technical analysis of the **Pharmacy Management System** database schema. It has been designed specifically to serve as a study resource and documentation reference for your project report submission.

---

## 1. System Data Flow Architecture

The data flow highlights how frontend actions, database constraints, automated triggers, and aggregate views work in unison:

```mermaid
graph TD
    A[Frontend: Execute Sale] -->|1. INSERT Sales & Sales_Items| B[(PostgreSQL Database)]
    B -->|2. Triggers Event| C{trg_reduce_stock}
    C -->|3. Executed Function| D[reduce_stock()]
    D -->|4. Updates| E[Stock Table]
    B -->|5. Query View| F[vw_sales_report / vw_medicine_stock_details]
    F -->|6. Render Real-time State| G[Frontend UI]
```

---

## 2. Entity-Relationship (ER) Diagram

Below is the conceptual entity-relationship mapping of the 8 tables, illustrating primary keys, foreign keys, attribute data types, and structural cardinalities.

```mermaid
erDiagram
    SUPPLIERS ||--o{ MEDICINES : "supplies"
    MEDICINES ||--|| STOCK : "has"
    MEDICINES ||--o{ SALES_ITEMS : "included_in"
    MEDICINES ||--o{ EXPIRY_ALERTS : "triggers"
    CUSTOMERS ||--o{ SALES : "places"
    EMPLOYEES ||--o{ SALES : "processes"
    SALES ||--|{ SALES_ITEMS : "contains"

    SUPPLIERS {
        int supplier_id PK
        varchar supplier_name NOT_NULL
        varchar phone
        varchar email
    }

    MEDICINES {
        int medicine_id PK
        varchar medicine_name NOT_NULL
        varchar category
        numeric price
        int supplier_id FK
    }

    STOCK {
        int stock_id PK
        int medicine_id FK_UK
        int quantity NOT_NULL
        date expiry_date NOT_NULL
    }

    CUSTOMERS {
        int customer_id PK
        varchar customer_name
        varchar phone UK
        varchar email
        text password_hash
    }

    EMPLOYEES {
        int employee_id PK
        varchar employee_name
        varchar role
        numeric salary
        varchar email UK
        varchar password_hash
    }

    SALES {
        int sale_id PK
        int customer_id FK
        int employee_id FK
        timestamp sale_date
    }

    SALES_ITEMS {
        int sale_item_id PK
        int sale_id FK
        int medicine_id FK
        int quantity
        numeric unit_price_at_sale
    }

    EXPIRY_ALERTS {
        int alert_id PK
        int medicine_id FK
        varchar medicine_name
        date expiry_date
        text alert_message
        timestamp created_at
    }
```

---

## 3. Data Dictionary

The physical schema contains 8 relational tables. Each table's structural configuration and column definitions are detailed below.

### 3.1. `Suppliers`
Manages the contact details and identity of external medical vendors.
* **Primary Key:** `supplier_id` (auto-incremented)

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `supplier_id` | `SERIAL` | `PRIMARY KEY` | Unique internal identifier for the supplier. |
| `supplier_name` | `VARCHAR(100)` | `NOT NULL` | The legal name of the pharmaceutical supplier. |
| `phone` | `VARCHAR(15)` | None | Contact phone number. |
| `email` | `VARCHAR(100)` | None | Business email address. |

### 3.2. `Medicines`
Catalog of all pharmaceutical products stocked by the pharmacy.
* **Primary Key:** `medicine_id` (auto-incremented)
* **Foreign Key:** `supplier_id` references `Suppliers(supplier_id)` with `ON DELETE CASCADE`.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `medicine_id` | `SERIAL` | `PRIMARY KEY` | Unique internal identifier for the medicine. |
| `medicine_name` | `VARCHAR(100)` | `NOT NULL` | Brand/generic name of the medicine. |
| `category` | `VARCHAR(50)` | None | Classification (e.g., Tablet, Syrup, Capsule). |
| `price` | `NUMERIC(10,2)` | None | Standard retail selling price per unit. |
| `supplier_id` | `INT` | `FOREIGN KEY` | Links the medicine to its corresponding supplier. |

### 3.3. `Stock`
Tracks real-time inventory quantity and expiration dates for each medicine.
* **Primary Key:** `stock_id` (auto-incremented)
* **Foreign Key & Unique Constraint:** `medicine_id` references `Medicines(medicine_id)` with `ON DELETE CASCADE`. (1-to-1 relationship enforced via `UNIQUE`).

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `stock_id` | `SERIAL` | `PRIMARY KEY` | Unique identifier for the stock record. |
| `medicine_id` | `INT` | `FOREIGN KEY`, `UNIQUE` | 1-to-1 link ensuring only one inventory row exists per medicine. |
| `quantity` | `INT` | `NOT NULL` | The physical number of units currently in stock. |
| `expiry_date` | `DATE` | `NOT NULL` | The expiration date of the batch. |

### 3.4. `Customers`
Stores profiles of customers to track purchases.
* **Primary Key:** `customer_id` (auto-incremented)
* **Unique Constraint:** `phone` ensures no duplicate accounts are registered under the same phone number.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `customer_id` | `SERIAL` | `PRIMARY KEY` | Unique identifier for the customer. |
| `customer_name` | `VARCHAR(100)` | None | Name of the customer. |
| `phone` | `VARCHAR(15)` | `UNIQUE` | Customer contact number. |
| `email` | `VARCHAR(100)` | None | Customer email address. |
| `password_hash` | `TEXT` | None | Hashed password (reserved for optional patient portals). |

### 3.5. `Employees`
Stores staff details, salaries, roles, and credentials for Role-Based Access Control (RBAC).
* **Primary Key:** `employee_id` (auto-incremented)
* **Unique Constraint:** `email` ensures a single email is bound to a single staff profile.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `employee_id` | `SERIAL` | `PRIMARY KEY` | Unique identifier for the staff member. |
| `employee_name` | `VARCHAR(100)` | None | Name of the employee. |
| `role` | `VARCHAR(50)` | None | Work assignment (e.g., 'Cashier', 'Manager'). |
| `salary` | `NUMERIC(10,2)` | None | Monthly base salary. |
| `email` | `VARCHAR(100)` | `UNIQUE` | Login username/email. |
| `password_hash` | `VARCHAR(255)` | None | Base64-encoded login password. |

### 3.6. `Sales`
Tracks the header information of sales transactions (who bought it, who sold it, and when).
* **Primary Key:** `sale_id` (auto-incremented)
* **Foreign Keys:**
  * `customer_id` references `Customers(customer_id)` with `ON DELETE CASCADE`.
  * `employee_id` references `Employees(employee_id)` with `ON DELETE CASCADE`.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `sale_id` | `SERIAL` | `PRIMARY KEY` | Unique identifier for the invoice. |
| `customer_id` | `INT` | `FOREIGN KEY` | Identifies the purchasing customer. |
| `employee_id` | `INT` | `FOREIGN KEY` | Identifies the cashier/employee who recorded the sale. |
| `sale_date` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Date and time the transaction was recorded. |

### 3.7. `Sales_Items`
The junction table resolving the many-to-many relationship between `Sales` and `Medicines`. It lists the items within each transaction.
* **Primary Key:** `sale_item_id` (auto-incremented)
* **Foreign Keys:**
  * `sale_id` references `Sales(sale_id)` with `ON DELETE CASCADE`.
  * `medicine_id` references `Medicines(medicine_id)` with `ON DELETE CASCADE`.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `sale_item_id` | `SERIAL` | `PRIMARY KEY` | Unique identifier for the individual line item. |
| `sale_id` | `INT` | `FOREIGN KEY` | Links item to the master sale header. |
| `medicine_id` | `INT` | `FOREIGN KEY` | Links item to the purchased medicine catalog. |
| `quantity` | `INT` | None | Quantity purchased. |
| `unit_price_at_sale` | `NUMERIC(10,2)` | None | The price per unit *at the exact time of the purchase*. |

### 3.8. `Expiry_Alerts`
An automated audit log that registers warnings when stock expiration dates draw near.
* **Primary Key:** `alert_id` (auto-incremented)
* **Foreign Key:** `medicine_id` references `Medicines(medicine_id)` with `ON DELETE CASCADE`.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `alert_id` | `SERIAL` | `PRIMARY KEY` | Unique alert logging ID. |
| `medicine_id` | `INT` | `FOREIGN KEY` | Reference link to the expiring medicine. |
| `medicine_name` | `VARCHAR(100)` | None | Caches medicine name for decoupled UI rendering. |
| `expiry_date` | `DATE` | None | The expiration date of the batch. |
| `alert_message` | `TEXT` | None | Description of the warning. |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Timestamp when the alert was generated. |

---

## 4. Normalization Analysis (1NF to 3NF)

Normalization is the process of organizing data in a database to reduce redundancy and eliminate update anomalies. This schema satisfies **Third Normal Form (3NF)**.

### 4.1. First Normal Form (1NF)
> **Requirement:** A table is in 1NF if it contains only atomic (indivisible) values, and there are no repeating groups of attributes.
* **Proof:**
  * Every attribute in all 8 tables contains a single value (e.g., `phone` stores a single contact string; lists of items are separated into their own rows in `Sales_Items` instead of being concatenated).
  * No composite values or multi-valued columns are present.

### 4.2. Second Normal Form (2NF)
> **Requirement:** The table must be in 1NF, and all non-key attributes must be fully functionally dependent on the entire primary key (no partial dependencies).
* **Proof:**
  * Every table in this schema uses a single-column primary key (`supplier_id`, `medicine_id`, `stock_id`, etc.) as its primary identifier.
  * Because there are no composite primary keys (keys consisting of multiple columns), it is mathematically impossible to have a partial key dependency. All non-key fields depend on the whole primary key.

### 4.3. Third Normal Form (3NF)
> **Requirement:** The table must be in 2NF, and there must be no transitive dependencies (non-key columns must not depend on other non-key columns; they must depend *only* on the primary key).
* **Proof & Key Design Choices:**
  * **Derived Attributes Removed:** In earlier iterations, tables might store `total_amount` directly inside the `Sales` table. In 3NF, this is a violation because `total_amount` is a transitive dependency:
    $$\text{Sales\_Items.quantity, unit\_price\_at\_sale} \rightarrow \text{Sales.total\_amount}$$
    $$\text{Sales.total\_amount} \rightarrow \text{Sales.sale\_id}$$
    To solve this, `total_amount` was dropped from `Sales`. Instead, it is computed dynamically using SQL joins and aggregation in `vw_sales_report`.
  * **Preserving Historical Transaction Integrity:** A common question is: *Why does `Sales_Items` contain a `unit_price_at_sale` field when `Medicines` already contains `price`? Does this violate 3NF?*
    * **Answer:** **No, it does not.** If `Sales_Items` omitted the unit price and joined with `Medicines.price` to determine revenue, any future price changes in the `Medicines` catalog (e.g., Paracetamol price rising from 50 to 60) would retroactively alter the financial records of sales completed years prior. 
    * Therefore, `unit_price_at_sale` is functionally dependent on the composite key of the transaction line item, capturing a point-in-time value, while `Medicines.price` represents the *current* catalog listing. This is necessary to avoid update anomalies and protect audit integrity.

---

## 5. Stored Database Logic

A key feature of a physical database implementation is pushing core business logic into the DBMS layer rather than executing it in frontend JavaScript. This is accomplished using **Triggers**, **Views**, and **Stored Functions**.

### 5.1. Database Triggers (Automated Event Handlers)

#### Trigger 1: `trg_auto_create_stock`
* **Timing:** `AFTER INSERT` on table `Medicines`
* **Functionality:** Ensures that whenever a new medicine is cataloged, an accompanying stock record is initialized with `0` quantity and a default expiry of 1 year. This guarantees referential integrity between catalog items and stock levels.
```sql
CREATE OR REPLACE FUNCTION auto_create_stock()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO Stock(medicine_id, quantity, expiry_date)
    VALUES(NEW.medicine_id, 0, CURRENT_DATE + INTERVAL '1 year');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_create_stock
AFTER INSERT ON Medicines
FOR EACH ROW
EXECUTE FUNCTION auto_create_stock();
```

#### Trigger 2: `trg_reduce_stock`
* **Timing:** `AFTER INSERT` on table `Sales_Items`
* **Functionality:** Real-time stock decrementing. When a cashier registers a purchase, the system automatically subtracts the purchased amount from the available stock quantity, preventing manual bookkeeping errors.
```sql
CREATE OR REPLACE FUNCTION reduce_stock()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE Stock
    SET quantity = quantity - NEW.quantity
    WHERE medicine_id = NEW.medicine_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reduce_stock
AFTER INSERT ON Sales_Items
FOR EACH ROW
EXECUTE FUNCTION reduce_stock();
```

#### Trigger 3: `trg_expiry_alert`
* **Timing:** `AFTER INSERT OR UPDATE` on table `Stock`
* **Functionality:** Automated compliance monitoring. When stock records are created or updated (e.g., during restocking), the trigger evaluates the expiry date. If the product expires in 7 days or less, it logs a warning inside the `Expiry_Alerts` table.
```sql
CREATE OR REPLACE FUNCTION check_expiry_alert()
RETURNS TRIGGER AS $$
DECLARE
    med_name VARCHAR(100);
BEGIN
    IF NEW.expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN
        SELECT medicine_name INTO med_name FROM Medicines WHERE medicine_id = NEW.medicine_id;
        
        -- Avoid duplicate alerts
        DELETE FROM Expiry_Alerts WHERE medicine_id = NEW.medicine_id;

        INSERT INTO Expiry_Alerts(medicine_id, medicine_name, expiry_date, alert_message)
        VALUES(NEW.medicine_id, med_name, NEW.expiry_date, 'Medicine expiring within 7 days');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_expiry_alert
AFTER INSERT OR UPDATE ON Stock
FOR EACH ROW
EXECUTE FUNCTION check_expiry_alert();
```

---

### 5.2. Database Views (Secure Data Abstraction)

Views act as virtual tables. They allow developers to pre-compile complex multi-table joins, improve security by hiding underlying table details, and simplify frontend access patterns.

#### View 1: `vw_medicine_stock_details`
* **Purpose:** Combines three physical tables (`Medicines`, `Suppliers`, and `Stock`) into a single view. The frontend can query this view directly without running client-side joins.
```sql
CREATE VIEW vw_medicine_stock_details AS
SELECT
    m.medicine_id,
    m.medicine_name,
    m.category,
    m.price,
    s.supplier_name,
    st.quantity AS stock_quantity,
    st.expiry_date
FROM Medicines m
LEFT JOIN Suppliers s ON m.supplier_id = s.supplier_id
LEFT JOIN Stock st ON m.medicine_id = st.medicine_id;
```

#### View 2: `vw_sales_report`
* **Purpose:** Solves the 3NF constraint by dynamically aggregating prices from `Sales_Items` to compile invoice totals and count the unique line items contained in each transaction.
```sql
CREATE VIEW vw_sales_report AS
SELECT
    sa.sale_id,
    sa.sale_date,
    c.customer_name,
    e.employee_name,
    SUM(si.quantity * si.unit_price_at_sale) AS total_amount,
    COUNT(si.sale_item_id) AS items_count
FROM Sales sa
JOIN Customers c ON sa.customer_id = c.customer_id
JOIN Employees e ON sa.employee_id = e.employee_id
LEFT JOIN Sales_Items si ON sa.sale_id = si.sale_id
GROUP BY sa.sale_id, sa.sale_date, c.customer_name, e.employee_name;
```

---

### 5.3. Stored Functions (Procedures)

#### Stored Function: `create_sale`
* **Purpose:** Encapsulates the transactional action of recording a transaction header. Takes arguments for customer and cashier IDs, automating record insertion.
```sql
CREATE OR REPLACE FUNCTION create_sale(
    p_customer_id INT,
    p_employee_id INT
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO Sales(customer_id, employee_id)
    VALUES(p_customer_id, p_employee_id);
END;
$$ LANGUAGE plpgsql;
```

---

## 6. Transactions & ACID Compliance

A database transaction is a sequence of SQL statements executed as a single unit of work. To maintain integrity, transactions must satisfy the **ACID** properties:

1. **A**tomicity: All statements in the transaction succeed, or all are rolled back.
2. **C**onsistency: The database moves from one valid state to another, maintaining constraints.
3. **I**solation: Concurrent execution of transactions yields the same state as sequential execution.
4. **D**urability: Once committed, changes survive system crashes.

### 6.1. Transaction Commit Example
When booking a sale, we insert the master sale record and the individual line items in a unified block. Using `COMMIT` guarantees that we never insert a sales receipt without its items.
```sql
BEGIN;

-- Insert sales header
INSERT INTO Sales(customer_id, employee_id)
VALUES(1, 1);

-- Insert multiple line items linked to sale_id 1
INSERT INTO Sales_Items(sale_id, medicine_id, quantity, unit_price_at_sale)
VALUES
(1, 1, 2, 50),
(1, 2, 1, 120);

COMMIT; -- All items are written permanently to disk together
```

### 6.2. Transaction Rollback Example
If a query encounters an error or is cancelled due to input mistakes, the entire transaction is discarded using `ROLLBACK`, returning the tables to their pre-transaction state.
```sql
BEGIN;

-- Attempting an insert with an invalid customer / employee ID to trigger constraint failure
INSERT INTO Sales(customer_id, employee_id)
VALUES(9999, 9999);

-- Error encountered: discard the active block to maintain integrity
ROLLBACK;
```

---

## 7. Important SQL Queries Catalog

Here are key SQL query patterns used within the application, demonstrating data retrieval, join filtering, aggregate reporting, and subqueries.

### 7.1. Filtering and Low Stock Detection
Lists medicines that are running short in the pharmacy (below 20 units) to alert managers.
```sql
SELECT *
FROM Stock
WHERE quantity < 20;
```

### 7.2. Two-Table Inner Join
Links the catalog to supplier records to display the supplier name alongside each medicine.
```sql
SELECT m.medicine_name, s.supplier_name
FROM Medicines m
JOIN Suppliers s ON m.supplier_id = s.supplier_id;
```

### 7.3. Aggregate Function (SUM) - Revenue
Sums up the value of all transactions to calculate the total gross revenue.
```sql
SELECT SUM(quantity * unit_price_at_sale) AS total_revenue
FROM Sales_Items;
```

### 7.4. Group By with COUNT - Sales Analytics
Calculates the number of transactions processed per customer, sorted in descending order.
```sql
SELECT
    c.customer_name,
    COUNT(sa.sale_id) AS total_purchases
FROM Customers c
LEFT JOIN Sales sa ON c.customer_id = sa.customer_id
GROUP BY c.customer_name
ORDER BY total_purchases DESC;
```

### 7.5. Subqueries (Unsold Stock Identifier)
Identifies stagnant inventory by returning medicines that have never appeared in any transaction item line.
```sql
SELECT medicine_name
FROM Medicines
WHERE medicine_id NOT IN (
    SELECT DISTINCT medicine_id
    FROM Sales_Items
);
```

### 7.6. Advanced Expiry Audit Join
Returns the names of all medicines expiring within the next 7 days.
```sql
SELECT m.medicine_name, st.expiry_date
FROM Medicines m
JOIN Stock st ON m.medicine_id = st.medicine_id
WHERE st.expiry_date <= CURRENT_DATE + INTERVAL '7 days';
```

---

> [!TIP]
> **Suggested Report Presentation Advice:**
> When submitting this project, highlight the **3NF compliance choice** regarding `total_amount` vs. `vw_sales_report` and the **historical preservation** of `unit_price_at_sale` in the `Sales_Items` table. These demonstrate a strong understanding of database design principles.
