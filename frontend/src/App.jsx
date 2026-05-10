import React, { useState, useEffect } from 'react';
import { Pill, Activity, ShoppingCart, CheckCircle2, AlertTriangle, Users, BadgeCheck, LayoutDashboard, Trash2, PlusCircle } from 'lucide-react';
import { supabase } from './supabaseClient';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const [medicines, setMedicines] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [expiryAlerts, setExpiryAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Sale Form State
  const [selectedMedId, setSelectedMedId] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  // New Customer State
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');

  // New Employee State
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeeRole, setNewEmployeeRole] = useState('');
  const [newEmployeeSalary, setNewEmployeeSalary] = useState('');

  // New Medicine State
  const [newMedName, setNewMedName] = useState('');
  const [newMedCategory, setNewMedCategory] = useState('');
  const [newMedPrice, setNewMedPrice] = useState('');

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

    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Handlers ---
  const handleSale = async (e) => {
    e.preventDefault();
    if (!selectedMedId || !selectedCustomerId || !selectedEmployeeId || quantity < 1) return;

    setIsSubmitting(true);
    const med = medicines.find(m => m.medicine_id === parseInt(selectedMedId));
    const price = med ? med.price : 0;
    const totalAmount = parseInt(quantity) * price;

    try {
      let { data: saleData, error: saleError } = await supabase.from('sales').insert({
        customer_id: parseInt(selectedCustomerId),
        employee_id: parseInt(selectedEmployeeId),
        total_amount: totalAmount
      }).select('sale_id').single();

      if (saleError && saleError.code === '42P01') {
        const res = await supabase.from('Sales').insert({ customer_id: parseInt(selectedCustomerId), employee_id: parseInt(selectedEmployeeId), total_amount: totalAmount }).select('sale_id').single();
        saleData = res.data; saleError = res.error;
      }
      if (saleError) throw saleError;

      let { error: itemError } = await supabase.from('sales_items').insert({
        sale_id: saleData.sale_id,
        medicine_id: parseInt(selectedMedId),
        quantity: parseInt(quantity),
        subtotal: totalAmount
      });
      if (itemError && itemError.code === '42P01') {
        const res = await supabase.from('Sales_Items').insert({ sale_id: saleData.sale_id, medicine_id: parseInt(selectedMedId), quantity: parseInt(quantity), subtotal: totalAmount });
        itemError = res.error;
      }
      if (itemError) throw itemError;

      showToast('Sale recorded successfully!');
      setSelectedMedId(''); setQuantity(1);
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
    setIsSubmitting(true);
    try {
      let { error } = await supabase.from('employees').insert({ employee_name: newEmployeeName, role: newEmployeeRole, salary: parseInt(newEmployeeSalary) });
      if (error && error.code === '42P01') {
        const res = await supabase.from('Employees').insert({ employee_name: newEmployeeName, role: newEmployeeRole, salary: parseInt(newEmployeeSalary) });
        error = res.error;
      }
      if (error) throw error;
      showToast('Employee added successfully!');
      setNewEmployeeName(''); setNewEmployeeRole(''); setNewEmployeeSalary('');
      fetchData();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally { setIsSubmitting(false); }
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let { error } = await supabase.from('medicines').insert({ medicine_name: newMedName, category: newMedCategory, price: parseFloat(newMedPrice), supplier_id: 1 });
      if (error && error.code === '42P01') {
        const res = await supabase.from('Medicines').insert({ medicine_name: newMedName, category: newMedCategory, price: parseFloat(newMedPrice), supplier_id: 1 });
        error = res.error;
      }
      if (error) throw error;
      showToast('Medicine added successfully! Stock row auto-created.');
      setNewMedName(''); setNewMedCategory(''); setNewMedPrice('');
      fetchData();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally { setIsSubmitting(false); }
  };

  const handleDeleteMedicine = async (id) => {
    if (!window.confirm("Are you sure you want to delete this medicine? Its stock will also be deleted.")) return;
    try {
      // Must delete stock first due to foreign key constraint
      let { error: stockErr } = await supabase.from('stock').delete().eq('medicine_id', id);
      if (stockErr && stockErr.code === '42P01') {
        const res = await supabase.from('Stock').delete().eq('medicine_id', id);
        stockErr = res.error;
      }
      
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

  // --- Render Sections ---

  const renderDashboard = () => (
    <>
      {expiryAlerts.length > 0 && (
        <div style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', borderRadius: '8px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fca5a5', marginBottom: '0.5rem' }}>
            <AlertTriangle size={20} /> Expiry Alerts
          </h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {expiryAlerts.map(alert => (
              <li key={alert.alert_id} style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                <strong style={{color: '#fff'}}>{alert.medicine_name}</strong> is expiring soon ({new Date(alert.expiry_date).toLocaleDateString()})
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid">
        <section className="card">
          <h2><Pill className="icon" /> Inventory Overview</h2>
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
                        <td style={{ fontWeight: 500, color: '#fff' }}>{med.medicine_name}</td>
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
          <h2><ShoppingCart className="icon" /> Record Sale</h2>
          <form onSubmit={handleSale}>
            <div className="form-group">
              <label><Users size={16} style={{display:'inline', verticalAlign:'text-bottom'}}/> Customer</label>
              <select className="form-control" value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)} required>
                <option value="" disabled>Select...</option>
                {customers.map(c => <option key={c.customer_id} value={c.customer_id}>{c.customer_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label><BadgeCheck size={16} style={{display:'inline', verticalAlign:'text-bottom'}}/> Employee</label>
              <select className="form-control" value={selectedEmployeeId} onChange={e => setSelectedEmployeeId(e.target.value)} required>
                <option value="" disabled>Select...</option>
                {employees.map(e => <option key={e.employee_id} value={e.employee_id}>{e.employee_name}</option>)}
              </select>
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
            <button type="submit" className="btn" disabled={isSubmitting || !selectedMedId || !selectedCustomerId || !selectedEmployeeId}>
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
              <thead><tr><th>ID</th><th>Name</th><th>Phone</th><th>Email</th></tr></thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.customer_id}>
                    <td>{c.customer_id}</td>
                    <td style={{ fontWeight: 500, color: '#fff' }}>{c.customer_name}</td>
                    <td>{c.phone}</td><td>{c.email || 'N/A'}</td>
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
              <thead><tr><th>ID</th><th>Name</th><th>Role</th><th>Salary (₹)</th></tr></thead>
              <tbody>
                {employees.map(e => (
                  <tr key={e.employee_id}>
                    <td>{e.employee_id}</td>
                    <td style={{ fontWeight: 500, color: '#fff' }}>{e.employee_name}</td>
                    <td><span className="badge" style={{background:'rgba(59, 130, 246, 0.2)', color:'#93c5fd', border:'1px solid rgba(59, 130, 246, 0.3)'}}>{e.role}</span></td>
                    <td>{e.salary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="card">
        <h2><PlusCircle className="icon" /> Add Employee</h2>
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
          <button type="submit" className="btn" disabled={isSubmitting}>Add Employee</button>
        </form>
      </section>
    </div>
  );

  const renderMedicines = () => (
    <div className="grid">
      <section className="card">
        <h2><Pill className="icon" /> Medicine Master List</h2>
        {loading ? <p>Loading...</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead><tr><th>ID</th><th>Name</th><th>Category</th><th>Supplier</th><th>Price</th><th>Action</th></tr></thead>
              <tbody>
                {medicines.map(m => (
                  <tr key={m.medicine_id}>
                    <td>{m.medicine_id}</td>
                    <td style={{ fontWeight: 500, color: '#fff' }}>{m.medicine_name}</td>
                    <td>{m.category}</td><td>{m.supplier_name}</td><td>₹{m.price}</td>
                    <td>
                      <button onClick={() => handleDeleteMedicine(m.medicine_id)} style={{background:'transparent', border:'none', color:'#ef4444', cursor:'pointer', padding:'4px'}}>
                        <Trash2 size={18} />
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
        <h2><PlusCircle className="icon" /> Add Medicine</h2>
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
          <button type="submit" className="btn" disabled={isSubmitting}>Add Medicine</button>
        </form>
      </section>
    </div>
  );

  return (
    <div className="container">
      <header className="header">
        <h1>Nexus Pharmacy</h1>
        <p>Advanced Real-Time Inventory & Management System</p>
      </header>

      <nav className="nav-tabs">
        <button className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          <LayoutDashboard size={18} /> Dashboard
        </button>
        <button className={`nav-tab ${activeTab === 'customers' ? 'active' : ''}`} onClick={() => setActiveTab('customers')}>
          <Users size={18} /> Customers
        </button>
        <button className={`nav-tab ${activeTab === 'employees' ? 'active' : ''}`} onClick={() => setActiveTab('employees')}>
          <BadgeCheck size={18} /> Employees
        </button>
        <button className={`nav-tab ${activeTab === 'medicines' ? 'active' : ''}`} onClick={() => setActiveTab('medicines')}>
          <Pill size={18} /> Medicines
        </button>
      </nav>

      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'customers' && renderCustomers()}
      {activeTab === 'employees' && renderEmployees()}
      {activeTab === 'medicines' && renderMedicines()}

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
