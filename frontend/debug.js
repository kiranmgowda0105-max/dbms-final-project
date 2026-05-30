const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hhopbbgknpfasfqunefv.supabase.co';
const supabaseKey = '--eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhob3BiYmdrbnBmYXNmcXVuZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyOTI4MzEsImV4cCI6MjA5Mzg2ODgzMX0._Frjv3Rd8bvAk5kdikqFVgJWynhpllp_-SS8QAhLj3I';
// Wait, the anon key provided by the user has '--' at the beginning. I'll strip it just in case.
const key = supabaseKey.startsWith('--') ? supabaseKey.slice(2) : supabaseKey;

const supabase = createClient(supabaseUrl, key);

async function check() {
  const { data: sales, error } = await supabase.from('sales').select('*');
  console.log('Sales Error:', error);
  console.log('Sales Data:', sales?.slice(0, 5));
  
  const { data: salesRel, error: relErr } = await supabase.from('sales').select(`
    sale_id,
    customers (customer_name),
    sales_items (quantity)
  `).limit(2);
  console.log('Relations Error:', relErr);
  console.log('Relations Data:', JSON.stringify(salesRel, null, 2));
}

check();
