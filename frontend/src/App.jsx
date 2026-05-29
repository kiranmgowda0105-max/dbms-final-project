import React, { useState, useEffect } from 'react';
import { Pill, Activity, ShoppingCart, CheckCircle2, AlertTriangle, Users, BadgeCheck, LayoutDashboard, Trash2, PlusCircle, LogOut, History, ArrowLeft, Printer, X, FileText, ClipboardList, Truck } from 'lucide-react';
import { supabase } from './supabaseClient';
import Login from './components/Login';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  const [medicines, setMedicines] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [expiryAlerts, setExpiryAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // History State
  const [selectedHistoryCustomer, setSelectedHistoryCustomer] = useState(null);
  const [customerHistory, setCustomerHistory] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  
  // Sale Form State
  const [selectedMedId, setSelectedMedId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  // Sale Customer Input (always manual)
  const [saleNewCustName, setSaleNewCustName] = useState('');
  const [saleNewCustPhone, setSaleNewCustPhone] = useState('');
  const [saleNewCustEmail, setSaleNewCustEmail] = useState('');

  // My Sales History (employee view)
  const [mySales, setMySales] = useState([]);

  // Restock State
  const [restockMedId, setRestockMedId] = useState('');
  const [restockQty, setRestockQty] = useState('');

  // New Customer State
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');

  // New Employee State (manager adds employees with login credentials)
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeeRole, setNewEmployeeRole] = useState('');
  const [newEmployeeSalary, setNewEmployeeSalary] = useState('');
  const [newEmployeeEmail, setNewEmployeeEmail] = useState('');
  const [newEmployeePassword, setNewEmployeePassword] = useState('');

  // New Medicine State
  const [newMedName, setNewMedName] = useState('');
  const [newMedCategory, setNewMedCategory] = useState('');
  const [newMedPrice, setNewMedPrice] = useState('');
  const [newMedSupplierName, setNewMedSupplierName] = useState('');
  const [newMedExpiryDate, setNewMedExpiryDate] = useState('');
  const [newMedQty, setNewMedQty] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 5000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Medicines
      let { data: medData, error: medError } = await supabase
        .from('medicines')
        .select(`
          medicine_id, medicine_name, category, price,
          suppliers (supplier_name), stock (quantity, expiry_date)
        `)
        .order('medicine_id');

      if (medError && medError.code === '42P01') {
        const res = await supabase.from('Medicines').select(`medicine_id, medicine_name, category, price, Suppliers (supplier_name), Stock (quantity, expiry_date)`).order('medicine_id');
        medData = res.data;
      }
      
      const formattedData = (medData || []).map(med => {
        const stockData = med.stock || med.Stock;
        const stockObj = Array.isArray(stockData) ? stockData[0] : stockData;
        const suppData = med.suppliers || med.Suppliers;
        const suppObj = Array.isArray(suppData) ? suppData[0] : suppData;
        return {
          ...med,
          supplier_name: suppObj ? suppObj.supplier_name : 'N/A',
          stock_quantity: stockObj ? stockObj.quantity : 0,
          expiry_date: stockObj ? stockObj.expiry_date : null
        };
      });
      setMedicines(formattedData);

      // Customers
      let { data: custData, error: custError } = await supabase.from('customers').select('*');
      if (custError && custError.code === '42P01') {
        const res = await supabase.from('Customers').select('*');
        custData = res.data;
      }
      setCustomers(custData || []);

      // Employees
      let { data: empData, error: empError } = await supabase.from('employees').select('*');
      if (empError && empError.code === '42P01') {
        const res = await supabase.from('Employees').select('*');
        empData = res.data;
      }
      setEmployees(empData || []);

      // Alerts
      let { data: alertsData, error: alertsError } = await supabase.from('expiry_alerts').select('*').order('created_at', { ascending: false });
      if (alertsError && alertsError.code === '42P01') {
        const res = await supabase.from('Expiry_Alerts').select('*').order('created_at', { ascending: false });
        alertsData = res.data;
      }
      setExpiryAlerts(alertsData || []);

      // Suppliers
      let { data: suppData, error: suppError } = await supabase.from('suppliers').select('*');
      if (suppError && suppError.code === '42P01') {
        const res = await supabase.from('Suppliers').select('*');
        suppData = res.data;
      }
      setSuppliers(suppData || []);

    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerHistory = async (customer) => {
    try {
      setLoading(true);
      setSelectedHistoryCustomer(customer);
      setActiveTab('customer_history');
      
      let { data, error } = await supabase
        .from('sales')
        .select(`
          sale_id, sale_date, total_amount,
          employees (employee_name),
          sales_items ( quantity, subtotal, medicines (medicine_name) )
        `)
        .eq('customer_id', customer.customer_id)
        .order('sale_date', { ascending: false });

      if (error && error.code === '42P01') {
         const res = await supabase
          .from('Sales')
          .select(`
            sale_id, sale_date, total_amount,
            Employees (employee_name),
            Sales_Items ( quantity, subtotal, Medicines (medicine_name) )
          `)
          .eq('customer_id', customer.customer_id)
          .order('sale_date', { ascending: false });
          data = res.data;
          error = res.error;
      }

      if (error) throw error;
      setCustomerHistory(data || []);
    } catch (err) {
      console.error('Error fetching history:', err);
      showToast('Failed to load customer history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedSession = localStorage.getItem('nexus_session') || sessionStorage.getItem('nexus_session');
    if (savedSession) {
      try {
        const user = JSON.parse(savedSession);
        setCurrentUser(user);
        setIsAuthenticated(true);
      } catch (e) {
        // Invalid session data
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const handleAuthSuccess = (userObj) => {
    setCurrentUser(userObj);
    setIsAuthenticated(true);
    
    if (userObj.rememberMe) {
      localStorage.setItem('nexus_session', JSON.stringify(userObj));
    } else {
      sessionStorage.setItem('nexus_session', JSON.stringify(userObj));
    }
    
    showToast(`Welcome, ${userObj.name}!`);
    setActiveTab('dashboard');
  };

  const handleLogout = async () => {
    localStorage.removeItem('nexus_session');
    sessionStorage.removeItem('nexus_session');
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  const handleDeduplicate = async () => {
    if (!window.confirm("Are you sure you want to clean up duplicate records in the database? This will keep only one unique copy of each supplier, employee, customer, and medicine, and clean up their stock records.")) return;
    
    setLoading(true);
    try {
      const safeFetch = async (tableName) => {
        let { data, error } = await supabase.from(tableName.toLowerCase()).select('*');
        if (error && error.code === '42P01') {
          const res = await supabase.from(tableName).select('*');
          data = res.data;
        }
        return data;
      };

      const safeDelete = async (tableName, idCol, idValue) => {
        let { error } = await supabase.from(tableName.toLowerCase()).delete().eq(idCol, idValue);
        if (error && error.code === '42P01') {
          await supabase.from(tableName).delete().eq(idCol, idValue);
        }
      };

      let suppliersDeleted = 0;
      let employeesDeleted = 0;
      let customersDeleted = 0;
      let medicinesDeleted = 0;

      // 1. Deduplicate Suppliers
      const suppliers = await safeFetch('Suppliers');
      if (suppliers) {
        const seenSuppliers = new Set();
        for (const supp of suppliers) {
          const key = supp.supplier_name.trim().toLowerCase();
          if (seenSuppliers.has(key)) {
            await safeDelete('Suppliers', 'supplier_id', supp.supplier_id);
            suppliersDeleted++;
          } else {
            seenSuppliers.add(key);
          }
        }
      }

      // 2. Deduplicate Employees
      const employees = await safeFetch('Employees');
      if (employees) {
        const seenEmployees = new Set();
        for (const emp of employees) {
          const key = `${emp.employee_name.trim().toLowerCase()}-${emp.role.trim().toLowerCase()}`;
          if (seenEmployees.has(key)) {
            await safeDelete('Employees', 'employee_id', emp.employee_id);
            employeesDeleted++;
          } else {
            seenEmployees.add(key);
          }
        }
      }

      // 3. Deduplicate Customers
      const customersList = await safeFetch('Customers');
      if (customersList) {
        const seenCustomers = new Set();
        for (const cust of customersList) {
          const key = cust.customer_name.trim().toLowerCase();
          if (seenCustomers.has(key)) {
            await safeDelete('Customers', 'customer_id', cust.customer_id);
            customersDeleted++;
          } else {
            seenCustomers.add(key);
          }
        }
      }

      // 4. Deduplicate Medicines
      const medicinesList = await safeFetch('Medicines');
      if (medicinesList) {
        const seenMedicines = new Set();
        for (const med of medicinesList) {
          const key = med.medicine_name.trim().toLowerCase();
          if (seenMedicines.has(key)) {
            await safeDelete('Medicines', 'medicine_id', med.medicine_id);
            medicinesDeleted++;
          } else {
            seenMedicines.add(key);
          }
        }
      }

      showToast(`Cleaned duplicates: ${medicinesDeleted} medicines, ${customersDeleted} customers, ${employeesDeleted} employees, ${suppliersDeleted} suppliers.`);
      fetchData();
    } catch (err) {
      alert("Error cleaning duplicates: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers ---
  const handleSale = async (e) => {
    e.preventDefault();
    
    // Auto-detect employee ID from logged-in user
    const employeeId = currentUser?.employee_id;
    if (!employeeId) {
      alert("Error: Employee ID not found. Please log in again.");
      return;
    }

    if (!saleNewCustName.trim()) { alert("Customer name is required."); return; }
    if (!selectedMedId || quantity < 1) return;

    setIsSubmitting(true);

    try {
      // Auto-detect: check if customer already exists by phone or email
      let customerId = null;
      
      if (saleNewCustPhone.trim()) {
        let { data: existingByPhone } = await supabase
          .from('customers')
          .select('customer_id')
          .eq('phone', saleNewCustPhone.trim())
          .maybeSingle();
        if (existingByPhone) customerId = existingByPhone.customer_id;
      }
      
      if (!customerId && saleNewCustEmail.trim()) {
        let { data: existingByEmail } = await supabase
          .from('customers')
          .select('customer_id')
          .eq('email', saleNewCustEmail.trim())
          .maybeSingle();
        if (existingByEmail) customerId = existingByEmail.customer_id;
      }

      // If customer not found, create new
      if (!customerId) {
        let { data: newCust, error: custErr } = await supabase.from('customers').insert({
          customer_name: saleNewCustName.trim(),
          phone: saleNewCustPhone.trim(),
          email: saleNewCustEmail.trim()
        }).select().single();
        if (custErr && custErr.code === '42P01') {
          const res = await supabase.from('Customers').insert({ customer_name: saleNewCustName.trim(), phone: saleNewCustPhone.trim(), email: saleNewCustEmail.trim() }).select().single();
          newCust = res.data; custErr = res.error;
        }
        if (custErr) throw custErr;
        customerId = newCust.customer_id;
        showToast('New customer registered & sale recorded!');
      }

      const med = medicines.find(m => m.medicine_id === parseInt(selectedMedId));
      const price = med ? med.price : 0;
      const totalAmount = parseInt(quantity) * price;

      let { data: saleData, error: saleError } = await supabase.from('sales').insert({
        customer_id: customerId,
        employee_id: employeeId
      }).select('sale_id').single();

      if (saleError && saleError.code === '42P01') {
        const res = await supabase.from('Sales').insert({ customer_id: customerId, employee_id: employeeId }).select('sale_id').single();
        saleData = res.data; saleError = res.error;
      }
      if (saleError) throw saleError;

      let { error: itemError } = await supabase.from('sales_items').insert({
        sale_id: saleData.sale_id,
        medicine_id: parseInt(selectedMedId),
        quantity: parseInt(quantity),
        unit_price_at_sale: price
      });
      if (itemError && itemError.code === '42P01') {
        const res = await supabase.from('Sales_Items').insert({ sale_id: saleData.sale_id, medicine_id: parseInt(selectedMedId), quantity: parseInt(quantity), unit_price_at_sale: price });
        itemError = res.error;
      }
      if (itemError) throw itemError;

      showToast('Sale recorded successfully!');
      setSelectedMedId(''); setQuantity(1);
      setSaleNewCustName(''); setSaleNewCustPhone(''); setSaleNewCustEmail('');
      fetchData();
    } catch (err) {
      alert('Failed to record sale: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let { error } = await supabase.from('customers').insert({ customer_name: newCustomerName, phone: newCustomerPhone, email: newCustomerEmail });
      if (error && error.code === '42P01') {
        const res = await supabase.from('Customers').insert({ customer_name: newCustomerName, phone: newCustomerPhone, email: newCustomerEmail });
        error = res.error;
      }
      if (error) throw error;
      showToast('Customer added successfully!');
      setNewCustomerName(''); setNewCustomerPhone(''); setNewCustomerEmail('');
      fetchData();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally { setIsSubmitting(false); }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!newEmployeeEmail.trim() || !newEmployeePassword.trim()) {
      alert('Email and password are required for employee login.');
      return;
    }
    setIsSubmitting(true);
    try {
      const password_hash = btoa(newEmployeePassword);
      let { error } = await supabase.from('employees').insert({ 
        employee_name: newEmployeeName, 
        role: newEmployeeRole, 
        salary: parseInt(newEmployeeSalary),
        email: newEmployeeEmail.trim(),
        password_hash: password_hash
      });
      if (error && error.code === '42P01') {
        const res = await supabase.from('Employees').insert({ 
          employee_name: newEmployeeName, role: newEmployeeRole, salary: parseInt(newEmployeeSalary),
          email: newEmployeeEmail.trim(), password_hash: password_hash
        });
        error = res.error;
      }
      if (error) throw error;
      showToast('Employee registered successfully!');
      setNewEmployeeName(''); setNewEmployeeRole(''); setNewEmployeeSalary('');
      setNewEmployeeEmail(''); setNewEmployeePassword('');
      fetchData();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally { setIsSubmitting(false); }
  };

  const handleDeleteEmployee = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) return;
    try {
      let { error: empErr } = await supabase.from('employees').delete().eq('employee_id', id);
      if (empErr && empErr.code === '42P01') {
        const res = await supabase.from('Employees').delete().eq('employee_id', id);
        empErr = res.error;
      }
      if (empErr) throw empErr;
      showToast('Employee deleted successfully.');
      fetchData();
    } catch (err) {
      alert('Error deleting employee: ' + err.message);
    }
  };

  const fetchMySales = async () => {
    const employeeId = currentUser?.employee_id;
    if (!employeeId) return;
    try {
      setLoading(true);
      setActiveTab('my_sales');
      
      let { data, error } = await supabase
        .from('sales')
        .select(`
          sale_id, sale_date, total_amount,
          customers (customer_name, phone, email),
          sales_items ( quantity, subtotal, medicines (medicine_name) )
        `)
        .eq('employee_id', employeeId)
        .order('sale_date', { ascending: false });

      if (error && error.code === '42P01') {
        const res = await supabase
          .from('Sales')
          .select(`
            sale_id, sale_date, total_amount,
            Customers (customer_name, phone, email),
            Sales_Items ( quantity, subtotal, Medicines (medicine_name) )
          `)
          .eq('employee_id', employeeId)
          .order('sale_date', { ascending: false });
        data = res.data;
        error = res.error;
      }

      if (error) throw error;
      setMySales(data || []);
    } catch (err) {
      console.error('Error fetching my sales:', err);
      showToast('Failed to load sales history');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    if (!newMedSupplierName.trim()) {
      alert('Please enter a supplier name');
      return;
    }
    setIsSubmitting(true);
    try {
      let supplierIdToUse = null;
      
      // Check if supplier exists (case insensitive)
      let { data: existingSupp, error: suppErr } = await supabase
        .from('suppliers')
        .select('supplier_id')
        .ilike('supplier_name', newMedSupplierName.trim())
        .maybeSingle();

      if (suppErr && suppErr.code === '42P01') {
        const res = await supabase.from('Suppliers').select('supplier_id').ilike('supplier_name', newMedSupplierName.trim()).maybeSingle();
        existingSupp = res.data;
        suppErr = res.error;
      }

      if (existingSupp) {
        supplierIdToUse = existingSupp.supplier_id;
      } else {
        // Create new supplier
        let { data: newSupp, error: insertSuppErr } = await supabase
          .from('suppliers')
          .insert({ supplier_name: newMedSupplierName.trim() })
          .select('supplier_id')
          .single();

        if (insertSuppErr && insertSuppErr.code === '42P01') {
          const res = await supabase.from('Suppliers').insert({ supplier_name: newMedSupplierName.trim() }).select('supplier_id').single();
          newSupp = res.data;
          insertSuppErr = res.error;
        }
        if (insertSuppErr) throw insertSuppErr;
        supplierIdToUse = newSupp.supplier_id;
      }

      let { data: medData, error } = await supabase.from('medicines').insert({ medicine_name: newMedName, category: newMedCategory, price: parseFloat(newMedPrice), supplier_id: supplierIdToUse }).select().single();
      if (error && error.code === '42P01') {
        const res = await supabase.from('Medicines').insert({ medicine_name: newMedName, category: newMedCategory, price: parseFloat(newMedPrice), supplier_id: supplierIdToUse }).select().single();
        medData = res.data;
        error = res.error;
      }
      if (error) throw error;
      
      const initialQty = parseInt(newMedQty) || 0;

      // Update the auto-created stock's quantity and expiry date
      let stockUpdates = {};
      if (initialQty > 0) stockUpdates.quantity = initialQty;
      if (newMedExpiryDate) stockUpdates.expiry_date = newMedExpiryDate;

      if (Object.keys(stockUpdates).length > 0 && medData) {
        let { error: stockUpdateErr } = await supabase.from('stock').update(stockUpdates).eq('medicine_id', medData.medicine_id);
        if (stockUpdateErr && stockUpdateErr.code === '42P01') {
           const res = await supabase.from('Stock').update(stockUpdates).eq('medicine_id', medData.medicine_id);
           stockUpdateErr = res.error;
        }
        if (stockUpdateErr) throw stockUpdateErr;
      }

      showToast('Medicine added successfully!');
      setNewMedName(''); setNewMedCategory(''); setNewMedPrice(''); setNewMedSupplierName(''); setNewMedExpiryDate(''); setNewMedQty('');
      fetchData();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally { setIsSubmitting(false); }
  };

  const handleDeleteMedicine = async (id) => {
    if (!window.confirm("Are you sure you want to delete this medicine? Its stock, sales history, and expiry alerts will also be deleted.")) return;
    try {
      // 1. Delete related expiry alerts (no FK constraint, so must clean manually)
      let { error: alertErr } = await supabase.from('expiry_alerts').delete().eq('medicine_id', id);
      if (alertErr && alertErr.code === '42P01') {
        await supabase.from('Expiry_Alerts').delete().eq('medicine_id', id);
      }

      // 2. Delete related sales_items (FK to medicines)
      let { error: siErr } = await supabase.from('sales_items').delete().eq('medicine_id', id);
      if (siErr && siErr.code === '42P01') {
        await supabase.from('Sales_Items').delete().eq('medicine_id', id);
      }

      // 3. Delete stock (FK to medicines)
      let { error: stockErr } = await supabase.from('stock').delete().eq('medicine_id', id);
      if (stockErr && stockErr.code === '42P01') {
        const res = await supabase.from('Stock').delete().eq('medicine_id', id);
        stockErr = res.error;
      }
      
      // 4. Finally delete the medicine itself
      let { error: medErr } = await supabase.from('medicines').delete().eq('medicine_id', id);
      if (medErr && medErr.code === '42P01') {
        const res = await supabase.from('Medicines').delete().eq('medicine_id', id);
        medErr = res.error;
      }

      if (medErr) throw medErr;
      showToast('Medicine deleted successfully.');
      fetchData();
    } catch (err) {
      alert('Error deleting medicine: ' + err.message);
    }
  };

  const handleRestock = async (e) => {
    e.preventDefault();
    const medId = parseInt(restockMedId);
    const qty = parseInt(restockQty);
    if (!medId || !qty || qty < 1) return;
    setIsSubmitting(true);
    try {
      let { data: stockData } = await supabase.from('stock').select('quantity').eq('medicine_id', medId).single();
      if (!stockData) {
        const res = await supabase.from('Stock').select('quantity').eq('medicine_id', medId).single();
        stockData = res.data;
      }
      const currentQty = stockData ? stockData.quantity : 0;
      let { error } = await supabase.from('stock').update({ quantity: currentQty + qty }).eq('medicine_id', medId);
      if (error && error.code === '42P01') {
        const res = await supabase.from('Stock').update({ quantity: currentQty + qty }).eq('medicine_id', medId);
        error = res.error;
      }
      if (error) throw error;

      showToast(`Added ${qty} units to stock successfully!`);
      setRestockMedId(''); setRestockQty('');
      fetchData();
    } catch (err) {
      alert('Error restocking: ' + err.message);
    } finally { setIsSubmitting(false); }
  };

  // --- Render Sections ---

  const renderDashboard = () => (
    <>
      {expiryAlerts.length > 0 && (
        <div style={{ marginBottom: '1.5rem', padding: '0.85rem 1rem', background: 'rgba(239, 68, 68, 0.08)', borderLeft: '3px solid #EF4444', borderRadius: '8px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FCA5A5', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 600 }}>
            <AlertTriangle size={20} /> Expiry Alerts
          </h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {expiryAlerts.map(alert => (
              <li key={alert.alert_id} style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                <strong style={{color: '#F1F5F9'}}>{alert.medicine_name}</strong> is expiring soon ({new Date(alert.expiry_date).toLocaleDateString()})
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value">{medicines.length}</div>
          <div className="stat-label">Total Medicines</div>
          <Pill className="stat-icon" />
        </div>
        <div className="stat-card danger">
          <div className="stat-value">{medicines.filter(m => (parseInt(m.stock_quantity) || 0) < 20).length}</div>
          <div className="stat-label">Low Stock Items</div>
          <AlertTriangle className="stat-icon" />
        </div>
        <div className="stat-card info">
          <div className="stat-value">{new Set(medicines.filter(m => m.supplier_name).map(m => m.supplier_name)).size}</div>
          <div className="stat-label">Active Suppliers</div>
          <Truck className="stat-icon" />
        </div>
      </div>

      <div className="grid">
        <section className="card">
          <h2>
            <Pill className="icon" /> Inventory Overview
            <span className="concept-badge" title="DBMS View combining Medicines, Stock, and Suppliers">💡 View: vw_medicine_stock_details</span>
          </h2>
          {loading ? <p>Loading...</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Medicine</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.map(med => {
                    const stock = parseInt(med.stock_quantity) || 0;
                    return (
                      <tr key={med.medicine_id}>
                        <td style={{ fontWeight: 500, color: '#F1F5F9' }}>{med.medicine_name}</td>
                        <td>{med.category}</td><td>₹{med.price}</td><td>{stock}</td>
                        <td>{stock < 20 ? <span className="badge low-stock">Low Stock</span> : <span className="badge in-stock">In Stock</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card">
          <h2>
            <ShoppingCart className="icon" /> Record Sale
            <span className="concept-badge" title="DBMS Stored Procedure inserting into Sales and Sales_Items">💡 Exec: create_sale()</span>
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Selling as: <strong style={{ color: 'var(--primary)' }}>{currentUser?.name}</strong></p>
          <form onSubmit={handleSale}>
            <div className="form-group">
              <label><Users size={16} style={{display:'inline', verticalAlign:'text-bottom'}}/> Customer Details</label>
              <p style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '0.5rem', marginTop: '0.25rem' }}>
                Enter customer info. Existing customers are auto-detected by phone or email.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <input type="text" className="form-control" placeholder="Customer Name *" value={saleNewCustName} onChange={e => setSaleNewCustName(e.target.value)} required />
                <input type="text" className="form-control" placeholder="Phone Number" value={saleNewCustPhone} onChange={e => setSaleNewCustPhone(e.target.value)} />
                <input type="email" className="form-control" placeholder="Email Address" value={saleNewCustEmail} onChange={e => setSaleNewCustEmail(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label>Medicine</label>
              <select className="form-control" value={selectedMedId} onChange={e => setSelectedMedId(e.target.value)} required>
                <option value="" disabled>Select...</option>
                {medicines.filter(m => (parseInt(m.stock_quantity) || 0) > 0).map(med => (
                  <option key={med.medicine_id} value={med.medicine_id}>{med.medicine_name} (Stock: {med.stock_quantity})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Quantity</label>
              <input type="number" className="form-control" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} required />
            </div>
            <button type="submit" className="btn" disabled={isSubmitting || !selectedMedId || !saleNewCustName.trim()}>
              {isSubmitting ? 'Processing...' : <><Activity size={20} /> Execute Sale</>}
            </button>
          </form>
        </section>
      </div>
    </>
  );

  const renderCustomers = () => (
    <div className="grid">
      <section className="card">
        <h2><Users className="icon" /> Customer Database</h2>
        {loading ? <p>Loading...</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead><tr><th>ID</th><th>Name</th><th>Phone</th><th>Email</th><th>Action</th></tr></thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.customer_id}>
                    <td>{c.customer_id}</td>
                    <td style={{ fontWeight: 500, color: '#F1F5F9' }}>{c.customer_name}</td>
                    <td>{c.phone}</td><td>{c.email || 'N/A'}</td>
                    <td>
                      <button onClick={() => fetchCustomerHistory(c)} style={{background:'transparent', border:'none', cursor:'pointer', padding:'4px'}} title="View Purchase History">
                        <History size={18} color="#14b8a6" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="card">
        <h2><PlusCircle className="icon" /> Add Customer</h2>
        <form onSubmit={handleAddCustomer}>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" className="form-control" value={newCustomerName} onChange={e=>setNewCustomerName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input type="text" className="form-control" value={newCustomerPhone} onChange={e=>setNewCustomerPhone(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" className="form-control" value={newCustomerEmail} onChange={e=>setNewCustomerEmail(e.target.value)} />
          </div>
          <button type="submit" className="btn" disabled={isSubmitting}>Add Customer</button>
        </form>
      </section>
    </div>
  );

  const renderEmployees = () => (
    <div className="grid">
      <section className="card">
        <h2><BadgeCheck className="icon" /> Staff Roster</h2>
        {loading ? <p>Loading...</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead><tr><th>ID</th><th>Name</th><th>Role</th><th>Email</th><th>Salary (₹)</th><th>Actions</th></tr></thead>
              <tbody>
                {employees.map(e => (
                  <tr key={e.employee_id}>
                    <td>{e.employee_id}</td>
                    <td style={{ fontWeight: 500, color: '#F1F5F9' }}>{e.employee_name}</td>
                    <td><span className="badge" style={{background:'rgba(13,148,136,0.08)', color:'#5EEAD4', border:'1px solid rgba(13,148,136,0.2)'}}>{e.role}</span></td>
                    <td style={{ fontSize: '0.85rem', color: '#94A3B8' }}>{e.email || 'N/A'}</td>
                    <td>{e.salary}</td>
                    <td>
                      <button className="btn-icon" onClick={() => handleDeleteEmployee(e.employee_id)} style={{ color: '#EF4444', padding: '0.25rem', background: 'transparent', border: 'none', cursor: 'pointer' }} title="Delete Employee">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="card">
        <h2><PlusCircle className="icon" /> Register Employee</h2>
        <p style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '1rem' }}>Create login credentials so the employee can sign in.</p>
        <form onSubmit={handleAddEmployee}>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" className="form-control" value={newEmployeeName} onChange={e=>setNewEmployeeName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Role / Position</label>
            <input type="text" className="form-control" placeholder="e.g. Cashier, Manager" value={newEmployeeRole} onChange={e=>setNewEmployeeRole(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Salary (₹)</label>
            <input type="number" className="form-control" value={newEmployeeSalary} onChange={e=>setNewEmployeeSalary(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Login Email</label>
            <input type="email" className="form-control" placeholder="employee@example.com" value={newEmployeeEmail} onChange={e=>setNewEmployeeEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Login Password</label>
            <input type="password" className="form-control" placeholder="Set a password" value={newEmployeePassword} onChange={e=>setNewEmployeePassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn" disabled={isSubmitting || !newEmployeeEmail.trim() || !newEmployeePassword.trim()}>Register Employee</button>
        </form>
      </section>
    </div>
  );

  const renderMySales = () => (
    <div className="grid" style={{ gridTemplateColumns: '1fr' }}>
      <section className="card">
        <h2>
          <ClipboardList className="icon" /> My Sales History
          <span className="concept-badge" title="DBMS View aggregating Sales and Customer Data">💡 View: vw_sales_report</span>
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          All sales made by <strong style={{ color: 'var(--primary)' }}>{currentUser?.name}</strong>
        </p>
        {loading ? <p>Loading...</p> : mySales.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No sales recorded yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Sale ID</th>
                  <th>Date & Time</th>
                  <th>Customer</th>
                  <th>Items Sold</th>
                  <th>Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {mySales.map(sale => {
                  const items = sale.sales_items || sale.Sales_Items || [];
                  const custData = sale.customers || sale.Customers;
                  const custObj = Array.isArray(custData) ? custData[0] : custData;
                  return (
                    <tr key={sale.sale_id}>
                      <td>#{sale.sale_id}</td>
                      <td style={{ fontSize: '0.85rem' }}>
                        {new Date(sale.sale_date).toLocaleDateString()} <span style={{ color: '#64748B' }}>{new Date(sale.sale_date).toLocaleTimeString()}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, color: '#F1F5F9' }}>{custObj?.customer_name || 'Unknown'}</div>
                        {custObj?.phone && <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{custObj.phone}</div>}
                      </td>
                      <td>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.85rem' }}>
                          {items.map((item, idx) => {
                            const med = item.medicines || item.Medicines || {};
                            return (
                              <li key={idx} style={{ marginBottom: '0.2rem' }}>
                                <strong style={{ color: '#F1F5F9' }}>{item.quantity}x</strong> {med.medicine_name || 'Unknown'} <span style={{ color: '#64748B', fontSize: '0.8rem' }}>(₹{item.subtotal})</span>
                              </li>
                            );
                          })}
                        </ul>
                      </td>
                      <td style={{ fontWeight: 600, color: '#F1F5F9' }}>₹{sale.total_amount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );

  const renderMedicines = () => (
    <>
      {expiryAlerts.length > 0 && (
        <div style={{ marginBottom: '1.5rem', padding: '0.85rem 1rem', background: 'rgba(239, 68, 68, 0.08)', borderLeft: '3px solid #EF4444', borderRadius: '8px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FCA5A5', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 600 }}>
            <AlertTriangle size={20} /> Expiry Alerts
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {expiryAlerts.map(alert => (
              <li key={alert.alert_id} style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                <strong style={{color: '#F1F5F9'}}>{alert.medicine_name}</strong> is expiring soon ({new Date(alert.expiry_date).toLocaleDateString()})
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="grid">
        <section className="card">
          <h2><Pill className="icon" /> Medicine Master List</h2>
          {loading ? <p>Loading...</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead><tr><th>ID</th><th>Name</th><th>Category</th><th>Supplier</th><th>Price</th><th>Expiry Date</th><th>Action</th></tr></thead>
                <tbody>
                  {medicines.map(m => {
                    const isExpiring = expiryAlerts.some(alert => alert.medicine_id === m.medicine_id);
                    return (
                    <tr key={m.medicine_id} style={isExpiring ? { background: 'rgba(239, 68, 68, 0.06)' } : {}}>
                      <td>{m.medicine_id}</td>
                      <td style={{ fontWeight: 500, color: '#F1F5F9' }}>
                        {m.medicine_name}
                        {isExpiring && <AlertTriangle size={14} color="#EF4444" style={{marginLeft: '6px', verticalAlign: 'text-bottom'}} title="Expiring Soon" />}
                      </td>
                      <td>{m.category}</td><td>{m.supplier_name}</td><td>₹{m.price}</td>
                      <td style={{ color: isExpiring ? '#EF4444' : 'inherit', fontWeight: isExpiring ? 600 : 'normal' }}>
                        {m.expiry_date ? new Date(m.expiry_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td>
                        <button onClick={() => handleDeleteMedicine(m.medicine_id)} style={{background:'transparent', border:'none', color:'#EF4444', cursor:'pointer', padding:'4px'}}>
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          )}
        </section>
      <section className="card">
        <h2>
          <PlusCircle className="icon" /> Add Medicine
          <span className="concept-badge" title="DBMS Trigger creating stock row automatically">💡 Triggers: auto_create_stock()</span>
        </h2>
        <form onSubmit={handleAddMedicine}>
          <div className="form-group">
            <label>Medicine Name</label>
            <input type="text" className="form-control" value={newMedName} onChange={e=>setNewMedName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Category</label>
            <input type="text" className="form-control" placeholder="e.g. Tablet, Syrup" value={newMedCategory} onChange={e=>setNewMedCategory(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Price (₹)</label>
            <input type="number" step="0.01" className="form-control" value={newMedPrice} onChange={e=>setNewMedPrice(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Initial Quantity</label>
            <input type="number" className="form-control" placeholder="Optional" value={newMedQty} onChange={e=>setNewMedQty(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Supplier Name</label>
            <input type="text" className="form-control" placeholder="Enter supplier name" value={newMedSupplierName} onChange={e=>setNewMedSupplierName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Expiry Date</label>
            <input type="date" className="form-control" value={newMedExpiryDate} onChange={e=>setNewMedExpiryDate(e.target.value)} required />
          </div>
          <button type="submit" className="btn" disabled={isSubmitting || !newMedSupplierName.trim() || !newMedExpiryDate}>Add Medicine</button>
        </form>
      </section>
      <section className="card" style={{ gridColumn: '1 / -1', marginTop: '1.25rem' }}>
        <h2>
          <PlusCircle className="icon" /> Restock Medicine
          <span className="concept-badge" title="DBMS Trigger checking expiry constraints">💡 Triggers: check_expiry_alert()</span>
        </h2>
        <form onSubmit={handleRestock} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
            <label>Medicine</label>
            <select className="form-control" value={restockMedId} onChange={e => setRestockMedId(e.target.value)} required>
              <option value="" disabled>Select medicine to restock...</option>
              {medicines.map(med => (
                <option key={med.medicine_id} value={med.medicine_id}>{med.medicine_name} (Current: {med.stock_quantity})</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label>Quantity to Add</label>
            <input type="number" className="form-control" min="1" placeholder="e.g. 50" value={restockQty} onChange={e => setRestockQty(e.target.value)} required />
          </div>
          <button type="submit" className="btn" style={{ flex: '0 0 auto', width: 'auto', padding: '0.65rem 1.5rem' }} disabled={isSubmitting || !restockMedId || !restockQty}>
            {isSubmitting ? 'Updating...' : 'Restock'}
          </button>
        </form>
      </section>
      </div>
    </>
  );

  const renderCustomerHistory = () => (
    <div className="grid" style={{ gridTemplateColumns: '1fr' }}>
      <section className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button onClick={() => setActiveTab('customers')} className="btn-text" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, padding: '0.5rem' }}>
            <ArrowLeft size={18} /> Back to Customers
          </button>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><History className="icon" /> Purchase History for {selectedHistoryCustomer?.customer_name}</h2>
        </div>
        
        {loading ? <p>Loading history...</p> : customerHistory.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No past purchases found for this customer.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Sale ID</th>
                  <th>Total Amount</th>
                  <th>Items Purchased</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {customerHistory.map(sale => {
                  const items = sale.sales_items || sale.Sales_Items || [];
                  return (
                    <tr key={sale.sale_id}>
                      <td>{new Date(sale.sale_date).toLocaleDateString()} {new Date(sale.sale_date).toLocaleTimeString()}</td>
                      <td>#{sale.sale_id}</td>
                      <td style={{ fontWeight: 600, color: '#F1F5F9' }}>₹{sale.total_amount}</td>
                      <td>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                          {items.map((item, idx) => {
                            const med = item.medicines || item.Medicines || {};
                            return (
                              <li key={idx} style={{ marginBottom: '0.25rem' }}>
                                {item.quantity}x <strong style={{color: '#F1F5F9'}}>{med.medicine_name || 'Unknown Item'}</strong> <span style={{fontSize:'0.8rem', color:'#64748B'}}>(₹{item.subtotal})</span>
                              </li>
                            );
                          })}
                        </ul>
                      </td>
                      <td>
                        <button onClick={() => setSelectedReceipt(sale)} className="btn-text" style={{ color: '#14b8a6', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <FileText size={16} /> Receipt
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );

  const renderSuppliers = () => {
    // Group medicines by supplier
    const supplierMap = {};
    medicines.forEach(med => {
      const suppName = med.supplier_name || 'Unknown Supplier';
      if (!supplierMap[suppName]) {
        supplierMap[suppName] = { name: suppName, items: [], totalStockValue: 0 };
      }
      supplierMap[suppName].items.push(med);
      supplierMap[suppName].totalStockValue += (med.price * med.stock_quantity);
    });
    
    const supplierList = Object.values(supplierMap);

    return (
      <div className="grid" style={{ gridTemplateColumns: '1fr' }}>
        <section className="card">
          <h2><Truck className="icon" /> Supplier Portfolio</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Current medicines and stock value provided by each supplier.
          </p>
          {loading ? <p>Loading...</p> : supplierList.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No suppliers found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {supplierList.map((supp, idx) => (
                <div key={idx} style={{ background: 'var(--bg-lighter)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h3 style={{ margin: 0, color: '#F1F5F9', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Truck size={18} color="#0d9488" /> {supp.name}
                    </h3>
                    <span className="badge" style={{ background: 'rgba(13, 148, 136, 0.1)', color: '#5EEAD4' }}>
                      Total Value: ₹{supp.totalStockValue.toFixed(2)}
                    </span>
                  </div>
                  <table style={{ margin: 0, background: 'transparent' }}>
                    <thead>
                      <tr>
                        <th style={{ background: 'transparent', borderBottom: '1px solid var(--border)' }}>Medicine</th>
                        <th style={{ background: 'transparent', borderBottom: '1px solid var(--border)' }}>Category</th>
                        <th style={{ background: 'transparent', borderBottom: '1px solid var(--border)' }}>Unit Price (₹)</th>
                        <th style={{ background: 'transparent', borderBottom: '1px solid var(--border)' }}>Current Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supp.items.map(item => (
                        <tr key={item.medicine_id}>
                          <td style={{ fontWeight: 500, borderBottom: 'none' }}>{item.medicine_name}</td>
                          <td style={{ borderBottom: 'none' }}>{item.category}</td>
                          <td style={{ borderBottom: 'none' }}>₹{item.price}</td>
                          <td style={{ borderBottom: 'none' }}>{item.stock_quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  };

  const renderReceiptModal = () => {
    if (!selectedReceipt) return null;
    const items = selectedReceipt.sales_items || selectedReceipt.Sales_Items || [];
    const empData = selectedReceipt.employees || selectedReceipt.Employees;
    const employeeName = empData ? (Array.isArray(empData) ? empData[0]?.employee_name : empData.employee_name) : 'Unknown';

    return (
      <div className="modal-overlay">
        <div className="modal-content receipt-modal">
          <button className="modal-close no-print" onClick={() => setSelectedReceipt(null)}><X size={24} /></button>
          
          <div className="receipt-header">
            <h2>Nexus Pharmacy</h2>
            <p>123 Health Avenue, Med City</p>
            <p>Tel: +91 98765 43210</p>
            <div className="receipt-divider"></div>
          </div>
          
          <div className="receipt-details">
            <p><strong>Receipt No:</strong> #{selectedReceipt.sale_id}</p>
            <p><strong>Date:</strong> {new Date(selectedReceipt.sale_date).toLocaleString()}</p>
            <p><strong>Customer:</strong> {selectedHistoryCustomer?.customer_name}</p>
            <p><strong>Cashier:</strong> {employeeName}</p>
          </div>
          
          <div className="receipt-divider"></div>
          
          <table className="receipt-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const med = item.medicines || item.Medicines || {};
                return (
                  <tr key={idx}>
                    <td>{med.medicine_name || 'Item'}</td>
                    <td>{item.quantity}</td>
                    <td>₹{item.subtotal}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          <div className="receipt-divider"></div>
          
          <div className="receipt-total">
            <h3>TOTAL</h3>
            <h3>₹{selectedReceipt.total_amount}</h3>
          </div>
          
          <div className="receipt-footer">
            <p>Thank you for your purchase!</p>
            <p>Get well soon.</p>
          </div>

          <div className="no-print" style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button className="btn" onClick={() => window.print()}><Printer size={18} /> Print Receipt</button>
          </div>
        </div>
      </div>
    );
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="container">
      <header className="header">
        <div>
          <h1>Nexus Pharmacy</h1>
          <p>Advanced Real-Time Inventory & Management System</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {currentUser?.role === 'Manager' && (
            <button className="btn-logout" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#FCA5A5', border: '1px solid rgba(239, 68, 68, 0.2)' }} onClick={handleDeduplicate}>
              Clean Duplicates
            </button>
          )}
          <span style={{ color: '#64748B', fontSize: '0.82rem' }}>
            Logged in as <strong style={{ color: '#F1F5F9' }}>{currentUser?.name}</strong> <span style={{opacity: 0.5}}>({currentUser?.role})</span>
          </span>
          <button className="btn-logout" onClick={handleLogout}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </header>

      <nav className="nav-tabs">
        <button className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          <LayoutDashboard size={18} /> Dashboard
        </button>
        <button className={`nav-tab ${activeTab === 'my_sales' ? 'active' : ''}`} onClick={() => fetchMySales()}>
          <ClipboardList size={18} /> My Sales
        </button>
        <button className={`nav-tab ${activeTab === 'customers' ? 'active' : ''}`} onClick={() => setActiveTab('customers')}>
          <Users size={18} /> Customers
        </button>
        {currentUser?.role === 'Manager' && (
          <button className={`nav-tab ${activeTab === 'employees' ? 'active' : ''}`} onClick={() => setActiveTab('employees')}>
            <BadgeCheck size={18} /> Employees
          </button>
        )}
        <button className={`nav-tab ${activeTab === 'medicines' ? 'active' : ''}`} onClick={() => setActiveTab('medicines')}>
          <Pill size={18} /> Medicines
        </button>
        {currentUser?.role === 'Manager' && (
          <button className={`nav-tab ${activeTab === 'suppliers' ? 'active' : ''}`} onClick={() => setActiveTab('suppliers')}>
            <Truck size={18} /> Suppliers
          </button>
        )}
      </nav>

      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'my_sales' && renderMySales()}
      {activeTab === 'customers' && renderCustomers()}
      {activeTab === 'employees' && currentUser?.role === 'Manager' && renderEmployees()}
      {activeTab === 'medicines' && renderMedicines()}
      {activeTab === 'suppliers' && currentUser?.role === 'Manager' && renderSuppliers()}
      {activeTab === 'customer_history' && renderCustomerHistory()}

      {renderReceiptModal()}

      {toast && (
        <div className="toast">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={20} /> {toast}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
