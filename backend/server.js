require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'pharmacy_management_db',
  password: process.env.DB_PASSWORD || 'admin123',
  port: process.env.DB_PORT || 5432,
});

// Test Connection
pool.connect()
  .then(() => console.log('Connected to PostgreSQL Database'))
  .catch(err => console.error('Database connection error', err.stack));

// =============================================
// API ENDPOINTS
// =============================================

// GET /api/medicines - Fetch medicines and their current stock
app.get('/api/medicines', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.medicine_id, m.medicine_name, m.category, m.price, s.quantity as stock_quantity, s.expiry_date
      FROM Medicines m
      LEFT JOIN Stock s ON m.medicine_id = s.medicine_id
      ORDER BY m.medicine_id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching medicines:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/sales - Record a sale and automatically trigger stock reduction
app.post('/api/sales', async (req, res) => {
  const { customer_id, employee_id, items } = req.body;
  // items should be an array: [{ medicine_id, quantity, price }]

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Sale items are required' });
  }

  // Calculate total amount from items
  const total_amount = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

  const client = await pool.connect();

  try {
    // Start transaction
    await client.query('BEGIN');

    // 1. Create Sale record
    const saleResult = await client.query(
      'INSERT INTO Sales (customer_id, employee_id, total_amount) VALUES ($1, $2, $3) RETURNING sale_id',
      [customer_id || 1, employee_id || 1, total_amount] // defaulting to ID 1 for simplicity if not provided
    );
    const sale_id = saleResult.rows[0].sale_id;

    // 2. Insert Sale Items (This fires the trg_reduce_stock trigger automatically!)
    for (let item of items) {
      await client.query(
        'INSERT INTO Sales_Items (sale_id, medicine_id, quantity, subtotal) VALUES ($1, $2, $3, $4)',
        [sale_id, item.medicine_id, item.quantity, item.quantity * item.price]
      );
    }

    // Commit transaction
    await client.query('COMMIT');

    res.status(201).json({ message: 'Sale recorded successfully and stock reduced via database trigger!', sale_id });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error recording sale:', err);
    res.status(500).json({ error: 'Failed to record sale: ' + err.message });
  } finally {
    client.release();
  }
});

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});
