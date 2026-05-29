import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hhopbbgknpfasfqunefv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhob3BiYmdrbnBmYXNmcXVuZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyOTI4MzEsImV4cCI6MjA5Mzg2ODgzMX0._Frjv3Rd8bvAk5kdikqFVgJWynhpllp_-SS8QAhLj3I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
  console.log('=== Starting Database Cleanup ===\n');

  // 1. Delete duplicate medicines (keep IDs 1 and 2)
  const dupMedIds = [3, 4, 5, 6];
  console.log(`Deleting duplicate medicines: IDs ${dupMedIds.join(', ')}...`);
  // Stock has ON DELETE CASCADE from medicines, but let's delete stock first just in case
  for (const id of dupMedIds) {
    await supabase.from('stock').delete().eq('medicine_id', id);
    const { error } = await supabase.from('medicines').delete().eq('medicine_id', id);
    if (error) console.error(`  Error deleting medicine ${id}:`, error.message);
    else console.log(`  Deleted medicine ID ${id}`);
  }

  // 2. Delete duplicate employees (keep IDs 1, 2, and 7-chandan)
  const dupEmpIds = [3, 4, 5, 6];
  console.log(`\nDeleting duplicate employees: IDs ${dupEmpIds.join(', ')}...`);
  for (const id of dupEmpIds) {
    const { error } = await supabase.from('employees').delete().eq('employee_id', id);
    if (error) console.error(`  Error deleting employee ${id}:`, error.message);
    else console.log(`  Deleted employee ID ${id}`);
  }

  // 3. Delete duplicate suppliers (keep IDs 1, 2, and unique ones 7,8,9)
  const dupSuppIds = [3, 4, 5, 6];
  console.log(`\nDeleting duplicate suppliers: IDs ${dupSuppIds.join(', ')}...`);
  for (const id of dupSuppIds) {
    const { error } = await supabase.from('suppliers').delete().eq('supplier_id', id);
    if (error) console.error(`  Error deleting supplier ${id}:`, error.message);
    else console.log(`  Deleted supplier ID ${id}`);
  }

  // 4. Delete duplicate customers (keep ID 1-Rahul with email, ID 2-Sneha with email, and all unique ones)
  const dupCustIds = [3, 4, 5, 6];
  console.log(`\nDeleting duplicate customers: IDs ${dupCustIds.join(', ')}...`);
  for (const id of dupCustIds) {
    // First check if this customer has any sales records
    const { data: sales } = await supabase.from('sales').select('sale_id').eq('customer_id', id);
    if (sales && sales.length > 0) {
      console.log(`  Skipping customer ID ${id} - has ${sales.length} sales records`);
    } else {
      const { error } = await supabase.from('customers').delete().eq('customer_id', id);
      if (error) console.error(`  Error deleting customer ${id}:`, error.message);
      else console.log(`  Deleted customer ID ${id}`);
    }
  }

  // 5. Verify final state
  console.log('\n=== Verification ===\n');
  
  const { data: meds } = await supabase.from('medicines').select('medicine_id, medicine_name').order('medicine_id');
  console.log('Medicines:', meds?.map(m => `${m.medicine_id}: ${m.medicine_name}`).join(', '));

  const { data: emps } = await supabase.from('employees').select('employee_id, employee_name').order('employee_id');
  console.log('Employees:', emps?.map(e => `${e.employee_id}: ${e.employee_name}`).join(', '));

  const { data: supps } = await supabase.from('suppliers').select('supplier_id, supplier_name').order('supplier_id');
  console.log('Suppliers:', supps?.map(s => `${s.supplier_id}: ${s.supplier_name}`).join(', '));

  const { data: custs } = await supabase.from('customers').select('customer_id, customer_name').order('customer_id');
  console.log('Customers:', custs?.map(c => `${c.customer_id}: ${c.customer_name}`).join(', '));

  console.log('\n=== Cleanup Complete ===');
}

cleanup().catch(console.error);
