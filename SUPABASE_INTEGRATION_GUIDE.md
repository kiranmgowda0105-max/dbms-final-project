# Supabase Integration Guide

This document explains the new architecture of your Pharmacy Sales Management System and how to verify that the frontend is successfully communicating with your backend database.

## How the Integration Works

We have transitioned the application to a **Serverless Architecture** (also known as Backend-as-a-Service or BaaS). 

Previously, your React frontend would send HTTP requests to your Node.js (`server.js`) backend, and the Node.js backend would execute SQL queries against your local PostgreSQL database. 

Now, your application operates differently:
1. **Direct Database Connection**: The React frontend uses the `@supabase/supabase-js` library (`src/supabaseClient.js`) to securely communicate *directly* with your Supabase PostgreSQL database.
2. **Bypassing the Middleman**: We no longer need the `server.js` Node application. The frontend directly performs `select` and `insert` operations over the internet via Supabase's secure PostgREST API.
3. **Database Triggers Maintained**: Because you migrated your local database directly to Supabase, all of your SQL logic—including the `trg_reduce_stock` trigger—was preserved. When the frontend inserts a new row into `sales_items`, the Supabase Postgres database automatically reduces the stock without needing any server-side JavaScript to orchestrate it.

## How to See Frontend Edits in the Backend (Supabase Dashboard)

Since the "backend" is now hosted entirely on Supabase, you can verify that your frontend actions are working by checking the Supabase Studio Dashboard.

Here is the step-by-step process to see your edits:

### 1. Make a Sale on the Frontend
1. Open your React application in the browser (`http://localhost:5173` or similar).
2. Look at the **Current Inventory** table and note the stock of a specific medicine.
3. Use the **Record Sale** form on the right to sell some quantity of that medicine.
4. Click **Execute Sale** and wait for the success message. 

### 2. Verify the Data in the Supabase Backend
1. Log into your Supabase account and navigate to your project dashboard:  
   **Project URL**: [https://supabase.com/dashboard/project/hhopbbgknpfasfqunefv](https://supabase.com/dashboard/project/hhopbbgknpfasfqunefv)
2. In the left-hand sidebar, click on the **Table Editor** (the icon that looks like a database/spreadsheet).
3. **Check the Sales Table**:
   - Click on the `sales` table.
   - You should see a brand new row at the bottom with your newly recorded total amount.
4. **Check the Sales_Items Table**:
   - Click on the `sales_items` table.
   - You should see a new row linking the sale ID, the medicine ID, and the quantity you just sold.
5. **Check the Stock Table**:
   - Click on the `stock` (or `Stock`) table.
   - Look at the row for the medicine you just sold. You will see that the `quantity` has automatically decreased, proving that the database trigger fired successfully on the Supabase server!

## (Optional) Syncing the Old Node.js Backend

If you still want to run your old Node.js `server.js` file (for example, if you want to use it for an external API in the future), you can connect it to the same Supabase database so both the frontend and the Node app are looking at the exact same data.

To do this, update your `backend/.env` file with these values:

```env
DB_USER=postgres
DB_PASSWORD=St#67ron@sql
DB_HOST=db.hhopbbgknpfasfqunefv.supabase.co
DB_NAME=postgres
DB_PORT=5432
```

Then, in your `backend/server.js`, you'll need to enable SSL in your pool connection:
```javascript
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false } // Required for Supabase
});
```
If you do this, running `http://localhost:5001/api/medicines` will show the exact same live data as your Supabase Dashboard!
