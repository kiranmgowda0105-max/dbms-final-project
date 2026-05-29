CREATE DATABASE pharmacy_management_db;
-- ==========================================
-- PHARMACY SALES MANAGEMENT SYSTEM
-- COMPLETE POSTGRESQL DATABASE
-- DATABASE NAME:
-- pharmacy_management_db
-- ==========================================

-- ==========================================
-- DROP TABLES IF THEY ALREADY EXIST
-- ==========================================

DROP TABLE IF EXISTS Sales_Items CASCADE;
DROP TABLE IF EXISTS Sales CASCADE;
DROP TABLE IF EXISTS Stock CASCADE;
DROP TABLE IF EXISTS Medicines CASCADE;
DROP TABLE IF EXISTS Suppliers CASCADE;
DROP TABLE IF EXISTS Customers CASCADE;
DROP TABLE IF EXISTS Employees CASCADE;
DROP TABLE IF EXISTS Expiry_Alerts CASCADE;

-- ==========================================
-- SUPPLIERS TABLE
-- ==========================================

CREATE TABLE Suppliers (
    supplier_id SERIAL PRIMARY KEY,
    supplier_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15),
    email VARCHAR(100)
);

-- ==========================================
-- MEDICINES TABLE
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
-- STOCK TABLE
-- ==========================================

CREATE TABLE Stock (
    stock_id SERIAL PRIMARY KEY,
    medicine_id INT UNIQUE,
    quantity INT NOT NULL,
    expiry_date DATE NOT NULL,

    CONSTRAINT fk_medicine
    FOREIGN KEY (medicine_id)
    REFERENCES Medicines(medicine_id)
    ON DELETE CASCADE
);

-- ==========================================
-- CUSTOMERS TABLE
-- ==========================================

CREATE TABLE Customers (
    customer_id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100),
    phone VARCHAR(15)
);

-- ==========================================
-- EMPLOYEES TABLE
-- ==========================================

CREATE TABLE Employees (
    employee_id SERIAL PRIMARY KEY,
    employee_name VARCHAR(100),
    role VARCHAR(50),
    salary NUMERIC(10,2)
);

-- ==========================================
-- SALES TABLE
-- ==========================================

CREATE TABLE Sales (
    sale_id SERIAL PRIMARY KEY,
    customer_id INT,
    employee_id INT,
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount NUMERIC(10,2),

    CONSTRAINT fk_customer
    FOREIGN KEY (customer_id)
    REFERENCES Customers(customer_id)
    ON DELETE CASCADE,

    CONSTRAINT fk_employee
    FOREIGN KEY (employee_id)
    REFERENCES Employees(employee_id)
    ON DELETE CASCADE
);

-- ==========================================
-- SALES ITEMS TABLE
-- ==========================================

CREATE TABLE Sales_Items (
    sale_item_id SERIAL PRIMARY KEY,
    sale_id INT,
    medicine_id INT,
    quantity INT,
    subtotal NUMERIC(10,2),

    CONSTRAINT fk_sale
    FOREIGN KEY (sale_id)
    REFERENCES Sales(sale_id)
    ON DELETE CASCADE,

    CONSTRAINT fk_sale_medicine
    FOREIGN KEY (medicine_id)
    REFERENCES Medicines(medicine_id)
    ON DELETE CASCADE
);

-- ==========================================
-- EXPIRY ALERTS TABLE
-- ==========================================

CREATE TABLE Expiry_Alerts (
    alert_id SERIAL PRIMARY KEY,
    medicine_id INT,
    medicine_name VARCHAR(100),
    expiry_date DATE,
    alert_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- TRIGGER 1
-- AUTO CREATE STOCK ENTRY
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
-- TRIGGER 2
-- AUTO REDUCE STOCK AFTER SALE
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
-- TRIGGER 3
-- EXPIRY ALERT
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
-- STORED FUNCTION
-- CREATE SALE
-- ==========================================

CREATE OR REPLACE FUNCTION create_sale(
    p_customer_id INT,
    p_employee_id INT,
    p_total NUMERIC
)
RETURNS VOID AS $$
BEGIN

    INSERT INTO Sales(
        customer_id,
        employee_id,
        total_amount
    )
    VALUES(
        p_customer_id,
        p_employee_id,
        p_total
    );

END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- SAMPLE DATA
-- ==========================================

INSERT INTO Suppliers(
    supplier_name,
    phone,
    email
)
VALUES
('ABC Pharma', '9876543210', 'abc@gmail.com'),
('MediCare Ltd', '9123456780', 'medicare@gmail.com');

INSERT INTO Medicines(
    medicine_name,
    category,
    price,
    supplier_id
)
VALUES
('Paracetamol', 'Tablet', 50, 1),
('Cough Syrup', 'Syrup', 120, 2);

INSERT INTO Customers(
    customer_name,
    phone
)
VALUES
('Rahul', '9999999999'),
('Sneha', '8888888888');

INSERT INTO Employees(
    employee_name,
    role,
    salary
)
VALUES
('Amit', 'Cashier', 25000),
('Priya', 'Manager', 40000);

-- ==========================================
-- UPDATE STOCK QUANTITY
-- ==========================================

UPDATE Stock
SET quantity = 100
WHERE medicine_id = 1;

UPDATE Stock
SET quantity = 50
WHERE medicine_id = 2;

-- ==========================================
-- TRANSACTION EXAMPLE
-- ==========================================

BEGIN;

INSERT INTO Sales(
    customer_id,
    employee_id,
    total_amount
)
VALUES(
    1,
    1,
    220
);

INSERT INTO Sales_Items(
    sale_id,
    medicine_id,
    quantity,
    subtotal
)
VALUES
(1,1,2,100),
(1,2,1,120);

COMMIT;

-- ==========================================
-- ROLLBACK EXAMPLE
-- ==========================================

BEGIN;

INSERT INTO Sales(
    customer_id,
    employee_id,
    total_amount
)
VALUES(
    2,
    2,
    500
);

ROLLBACK;

-- ==========================================
-- IMPORTANT QUERIES
-- ==========================================

-- View Medicines
SELECT * FROM Medicines;

-- View Stock
SELECT * FROM Stock;

-- View Expiry Alerts
SELECT * FROM Expiry_Alerts;

-- Low Stock Medicines
SELECT *
FROM Stock
WHERE quantity < 20;

-- Medicines with Suppliers
SELECT
    m.medicine_name,
    s.supplier_name
FROM Medicines m
JOIN Suppliers s
ON m.supplier_id = s.supplier_id;

-- Sales Details
SELECT
    sa.sale_id,
    c.customer_name,
    e.employee_name,
    sa.total_amount
FROM Sales sa
JOIN Customers c
ON sa.customer_id = c.customer_id
JOIN Employees e
ON sa.employee_id = e.employee_id;

-- Total Sales
SELECT SUM(total_amount)
AS total_sales
FROM Sales;

-- Medicines Expiring Soon
SELECT
    m.medicine_name,
    st.expiry_date
FROM Medicines m
JOIN Stock st
ON m.medicine_id = st.medicine_id
WHERE st.expiry_date <= CURRENT_DATE + INTERVAL '7 days';

-- ==========================================
-- END OF DATABASE
-- ==========================================

SELECT * FROM Medicines
SELECT * FROM Suppliers
SELECT * FROM Employees
SELECT * FROM Sales
SELECT * FROM Sales_items
SELECT * FROM Customers
SELECT * FROM Stock


ALTER TABLE Customers
ADD COLUMN email VARCHAR(100);

UPDATE Customers
SET email = 'rahul@gmail.com'
WHERE customer_id = 1;

UPDATE Customers
SET email = 'sneha@gmail.com'
WHERE customer_id = 2;
