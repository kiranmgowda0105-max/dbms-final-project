CREATE DATABASE pharmacy_management_db;
-- ==========================================
-- PHARMACY SALES MANAGEMENT SYSTEM
-- COMPLETE POSTGRESQL DATABASE
-- DATABASE NAME: pharmacy_management_db
-- ==========================================
--
-- DBMS CONCEPTS COVERED:
-- 1.  Tables with appropriate data types
-- 2.  Primary Keys (SERIAL / AUTO INCREMENT)
-- 3.  Foreign Keys with ON DELETE CASCADE
-- 4.  NOT NULL constraints
-- 5.  UNIQUE constraints
-- 6.  Triggers (3 triggers)
-- 7.  Stored Functions / Procedures
-- 8.  Transactions (COMMIT & ROLLBACK)
-- 9.  JOINs (INNER JOIN queries)
-- 10. Aggregate Functions (SUM, COUNT)
-- 11. Views
-- 12. ALTER TABLE (schema evolution)
-- 13. Subqueries
-- ==========================================


-- ==========================================
-- DROP EXISTING OBJECTS (clean slate)
-- ==========================================

DROP VIEW IF EXISTS vw_medicine_stock_details CASCADE;
DROP VIEW IF EXISTS vw_sales_report CASCADE;
DROP TABLE IF EXISTS Sales_Items CASCADE;
DROP TABLE IF EXISTS Sales CASCADE;
DROP TABLE IF EXISTS Expiry_Alerts CASCADE;
DROP TABLE IF EXISTS Stock CASCADE;
DROP TABLE IF EXISTS Medicines CASCADE;
DROP TABLE IF EXISTS Suppliers CASCADE;
DROP TABLE IF EXISTS Customers CASCADE;
DROP TABLE IF EXISTS Employees CASCADE;


-- ==========================================
-- TABLE 1: SUPPLIERS
-- Concepts: PRIMARY KEY, NOT NULL
-- ==========================================

CREATE TABLE Suppliers (
    supplier_id SERIAL PRIMARY KEY,
    supplier_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15),
    email VARCHAR(100)
);


-- ==========================================
-- TABLE 2: MEDICINES
-- Concepts: PRIMARY KEY, FOREIGN KEY,
--           ON DELETE CASCADE
-- ==========================================

CREATE TABLE Medicines (
    medicine_id SERIAL PRIMARY KEY,
    medicine_name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    price NUMERIC(10,2),
    supplier_id INT,

    CONSTRAINT fk_supplier
    FOREIGN KEY (supplier_id)
    REFERENCES Suppliers(supplier_id)
    ON DELETE CASCADE
);


-- ==========================================
-- TABLE 3: STOCK
-- Concepts: PRIMARY KEY, FOREIGN KEY,
--           UNIQUE constraint, NOT NULL
-- ==========================================

CREATE TABLE Stock (
    stock_id SERIAL PRIMARY KEY,
    medicine_id INT UNIQUE,
    quantity INT NOT NULL,
    expiry_date DATE NOT NULL,

    CONSTRAINT fk_stock_medicine
    FOREIGN KEY (medicine_id)
    REFERENCES Medicines(medicine_id)
    ON DELETE CASCADE
);


-- ==========================================
-- TABLE 4: CUSTOMERS
-- Concepts: PRIMARY KEY, VARCHAR types
-- Note: password_hash exists from a previous
--       auth flow (currently unused)
-- ==========================================

CREATE TABLE Customers (
    customer_id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100),
    phone VARCHAR(15) UNIQUE,
    email VARCHAR(100),
    password_hash TEXT
);


-- ==========================================
-- TABLE 5: EMPLOYEES
-- Concepts: PRIMARY KEY, UNIQUE constraint,
--           multiple data types
-- email + password_hash used for
-- employee sign-in authentication
-- ==========================================

CREATE TABLE Employees (
    employee_id SERIAL PRIMARY KEY,
    employee_name VARCHAR(100),
    role VARCHAR(50),
    salary NUMERIC(10,2),
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255)
);


-- ==========================================
-- TABLE 6: SALES
-- Concepts: FOREIGN KEY (2 references),
--           DEFAULT value, TIMESTAMP
-- ==========================================

CREATE TABLE Sales (
    sale_id SERIAL PRIMARY KEY,
    customer_id INT,
    employee_id INT,
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sale_customer
    FOREIGN KEY (customer_id)
    REFERENCES Customers(customer_id)
    ON DELETE CASCADE,

    CONSTRAINT fk_sale_employee
    FOREIGN KEY (employee_id)
    REFERENCES Employees(employee_id)
    ON DELETE CASCADE
);


-- ==========================================
-- TABLE 7: SALES_ITEMS
-- Concepts: FOREIGN KEY (2 references),
--           junction/bridge table pattern
-- ==========================================

CREATE TABLE Sales_Items (
    sale_item_id SERIAL PRIMARY KEY,
    sale_id INT,
    medicine_id INT,
    quantity INT,
    unit_price_at_sale NUMERIC(10,2),

    CONSTRAINT fk_saleitem_sale
    FOREIGN KEY (sale_id)
    REFERENCES Sales(sale_id)
    ON DELETE CASCADE,

    CONSTRAINT fk_saleitem_medicine
    FOREIGN KEY (medicine_id)
    REFERENCES Medicines(medicine_id)
    ON DELETE CASCADE
);


-- ==========================================
-- TABLE 8: EXPIRY_ALERTS
-- Concepts: FOREIGN KEY with ON DELETE CASCADE
--           (ensures alerts are auto-deleted
--            when a medicine is removed)
-- ==========================================

CREATE TABLE Expiry_Alerts (
    alert_id SERIAL PRIMARY KEY,
    medicine_id INT,
    medicine_name VARCHAR(100),
    expiry_date DATE,
    alert_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_alert_medicine
    FOREIGN KEY (medicine_id)
    REFERENCES Medicines(medicine_id)
    ON DELETE CASCADE
);


-- ==========================================
-- TRIGGER 1: AUTO CREATE STOCK ENTRY
-- Concept: AFTER INSERT trigger
-- When a new medicine is added, a stock row
-- is automatically created with quantity = 0
-- and default expiry of 1 year from today.
-- ==========================================

CREATE OR REPLACE FUNCTION auto_create_stock()
RETURNS TRIGGER AS $$
BEGIN

    INSERT INTO Stock(
        medicine_id,
        quantity,
        expiry_date
    )
    VALUES(
        NEW.medicine_id,
        0,
        CURRENT_DATE + INTERVAL '1 year'
    );

    RETURN NEW;

END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_create_stock
AFTER INSERT ON Medicines
FOR EACH ROW
EXECUTE FUNCTION auto_create_stock();


-- ==========================================
-- TRIGGER 2: AUTO REDUCE STOCK AFTER SALE
-- Concept: AFTER INSERT trigger
-- When a sales_item is inserted, the stock
-- quantity is automatically reduced.
-- ==========================================

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


-- ==========================================
-- TRIGGER 3: EXPIRY ALERT GENERATOR
-- Concept: AFTER INSERT OR UPDATE trigger
-- When stock expiry_date is updated, checks
-- if it falls within 7 days and creates an
-- alert in the Expiry_Alerts table.
-- ==========================================

CREATE OR REPLACE FUNCTION check_expiry_alert()
RETURNS TRIGGER AS $$
DECLARE
    med_name VARCHAR(100);

BEGIN

    IF NEW.expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN

        SELECT medicine_name
        INTO med_name
        FROM Medicines
        WHERE medicine_id = NEW.medicine_id;

        -- Delete any existing alerts for this medicine first to avoid duplicates
        DELETE FROM Expiry_Alerts
        WHERE medicine_id = NEW.medicine_id;

        INSERT INTO Expiry_Alerts(
            medicine_id,
            medicine_name,
            expiry_date,
            alert_message
        )
        VALUES(
            NEW.medicine_id,
            med_name,
            NEW.expiry_date,
            'Medicine expiring within 7 days'
        );

    END IF;

    RETURN NEW;

END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_expiry_alert
AFTER INSERT OR UPDATE ON Stock
FOR EACH ROW
EXECUTE FUNCTION check_expiry_alert();


-- ==========================================
-- STORED FUNCTION: CREATE SALE
-- Concept: User-defined function with
--          parameters (stored procedure)
-- ==========================================

CREATE OR REPLACE FUNCTION create_sale(
    p_customer_id INT,
    p_employee_id INT
)
RETURNS VOID AS $$
BEGIN

    INSERT INTO Sales(
        customer_id,
        employee_id
    )
    VALUES(
        p_customer_id,
        p_employee_id
    );

END;
$$ LANGUAGE plpgsql;


-- ==========================================
-- VIEW 1: MEDICINE STOCK DETAILS
-- Concept: VIEW (virtual table combining
--          data from multiple tables)
-- ==========================================

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


-- ==========================================
-- VIEW 2: SALES REPORT
-- Concept: VIEW with JOINs & aggregation
-- ==========================================

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


-- ==========================================
-- SAMPLE DATA INSERTION
-- ==========================================

-- Suppliers
INSERT INTO Suppliers(supplier_name, phone, email)
VALUES
('ABC Pharma', '9876543210', 'abc@gmail.com'),
('MediCare Ltd', '9123456780', 'medicare@gmail.com');

-- Medicines (triggers auto_create_stock)
INSERT INTO Medicines(medicine_name, category, price, supplier_id)
VALUES
('Paracetamol', 'Tablet', 50, 1),
('Cough Syrup', 'Syrup', 120, 2);

-- Customers
INSERT INTO Customers(customer_name, phone, email)
VALUES
('Rahul', '9999999999', 'rahul@gmail.com'),
('Sneha', '8888888888', 'sneha@gmail.com');

-- Employees
INSERT INTO Employees(employee_name, role, salary, email, password_hash)
VALUES
('Amit', 'Cashier', 25000, 'amit@gmail.com', 'amicash#1'),
('Priya', 'Manager', 40000, 'priya@gmail.com', 'primanag#2');

-- Update Stock quantities
UPDATE Stock SET quantity = 100 WHERE medicine_id = 1;
UPDATE Stock SET quantity = 50  WHERE medicine_id = 2;


-- ==========================================
-- TRANSACTION: COMMIT EXAMPLE
-- Concept: ACID properties, atomicity
-- Both inserts succeed or neither does.
-- ==========================================

BEGIN;

INSERT INTO Sales(customer_id, employee_id)
VALUES(1, 1);

INSERT INTO Sales_Items(sale_id, medicine_id, quantity, unit_price_at_sale)
VALUES
(1, 1, 2, 50),
(1, 2, 1, 120);

COMMIT;


-- ==========================================
-- TRANSACTION: ROLLBACK EXAMPLE
-- Concept: Rolling back a failed/unwanted
--          transaction to maintain consistency
-- ==========================================

BEGIN;

INSERT INTO Sales(customer_id, employee_id, total_amount)
VALUES(2, 2, 500);

-- Oops, wrong data! Roll back the transaction.
ROLLBACK;


-- ==========================================
-- IMPORTANT QUERIES
-- ==========================================

-- QUERY 1: Basic SELECT
-- View all medicines
SELECT * FROM Medicines;

-- QUERY 2: Basic SELECT
-- View all stock
SELECT * FROM Stock;

-- QUERY 3: Basic SELECT
-- View all expiry alerts
SELECT * FROM Expiry_Alerts;


-- QUERY 4: WHERE clause (filtering)
-- Low stock medicines (below 20 units)
SELECT *
FROM Stock
WHERE quantity < 20;


-- QUERY 5: INNER JOIN (two tables)
-- Medicines with their supplier names
SELECT
    m.medicine_name,
    s.supplier_name
FROM Medicines m
JOIN Suppliers s
ON m.supplier_id = s.supplier_id;


-- QUERY 6: INNER JOIN (three tables)
-- Full sale details with customer & employee names
SELECT
    sa.sale_id,
    c.customer_name,
    e.employee_name,
    sa.total_amount,
    sa.sale_date
FROM Sales sa
JOIN Customers c ON sa.customer_id = c.customer_id
JOIN Employees e ON sa.employee_id = e.employee_id;


-- QUERY 7: AGGREGATE FUNCTION (SUM)
-- Total revenue from all sales
SELECT SUM(total_amount) AS total_revenue
FROM Sales;


-- QUERY 8: AGGREGATE FUNCTION (COUNT)
-- Number of sales per customer
SELECT
    c.customer_name,
    COUNT(sa.sale_id) AS total_purchases
FROM Customers c
LEFT JOIN Sales sa ON c.customer_id = sa.customer_id
GROUP BY c.customer_name
ORDER BY total_purchases DESC;


-- QUERY 9: SUBQUERY
-- Medicines that have never been sold
SELECT medicine_name
FROM Medicines
WHERE medicine_id NOT IN (
    SELECT DISTINCT medicine_id
    FROM Sales_Items
);


-- QUERY 10: JOIN with date filter
-- Medicines expiring within 7 days
SELECT
    m.medicine_name,
    st.expiry_date
FROM Medicines m
JOIN Stock st ON m.medicine_id = st.medicine_id
WHERE st.expiry_date <= CURRENT_DATE + INTERVAL '7 days';


-- QUERY 11: Using the VIEW
-- View complete medicine stock details
SELECT * FROM vw_medicine_stock_details;

-- View sales report
SELECT * FROM vw_sales_report;


-- ==========================================
-- END OF DATABASE
-- ==========================================
