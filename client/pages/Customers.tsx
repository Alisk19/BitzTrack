import React, { useState, useMemo, useEffect } from 'react';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument } from '../services/firestore';

interface Customer {
  id: string;
  name: string;
  email: string;
  totalOrders: number;
  totalRevenue: number;
  lastOrderDate: string;
  avatarLetter: string;
  contact?: string;
  notes?: string;
}

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Customer; direction: 'asc' | 'desc' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    contact: '', // utilizing contact as email/phone
    notes: ''
  });

  const [customersRaw, setCustomersRaw] = useState<any[]>([]);
  const [ordersRaw, setOrdersRaw] = useState<any[]>([]);

  useEffect(() => {
    const unsubCustomers = subscribeToCollection('customers', (data) => {
      setCustomersRaw(data);
    });
    const unsubOrders = subscribeToCollection('orders', (data) => {
      setOrdersRaw(data);
    });

    return () => {
      unsubCustomers();
      unsubOrders();
    };
  }, []);

  useEffect(() => {
    if (customersRaw.length === 0 && ordersRaw.length === 0) {
      setTimeout(() => setLoading(false), 1000);
    }
    const mappedCustomers = customersRaw.map((c: any) => {
      const customerOrders = ordersRaw.filter(o => o.customerId === c.id);
      const totalRevenue = customerOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
      let lastOrderDate = 'N/A';
      if (customerOrders.length > 0) {
        const dates = customerOrders.filter(o => o.createdAt).map(o => new Date(o.createdAt).getTime());
        if (dates.length > 0) {
          lastOrderDate = new Date(Math.max(...dates)).toLocaleDateString();
        }
      }

      return {
        id: c.id,
        name: c.name,
        email: c.email || c.contact || '', // Fallback
        totalOrders: customerOrders.length,
        totalRevenue: totalRevenue,
        lastOrderDate: lastOrderDate,
        avatarLetter: c.name ? c.name.charAt(0).toUpperCase() : '?'
      };
    });
    setCustomers(mappedCustomers);
    if (customersRaw.length > 0) setLoading(false);
  }, [customersRaw, ordersRaw]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };



  const sortedCustomers = useMemo(() => {
    let processableItems = [...customers];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      processableItems = processableItems.filter(c =>
        c.name.toLowerCase().includes(lowerSearch) ||
        c.email.toLowerCase().includes(lowerSearch) ||
        (c.contact && c.contact.toLowerCase().includes(lowerSearch))
      );
    }

    if (sortConfig !== null) {
      processableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'lastOrderDate') {
          if (aValue === 'N/A') return 1;
          if (bValue === 'N/A') return -1;
          const dateA = new Date(aValue as string).getTime();
          const dateB = new Date(bValue as string).getTime();
          return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
        }

        // Handle string/number
        if (aValue === undefined) return 1;
        if (bValue === undefined) return -1;

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return processableItems;
  }, [customers, sortConfig, searchTerm]);

  const requestSort = (key: keyof Customer) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (name: keyof Customer) => {
    if (!sortConfig || sortConfig.key !== name) {
      return <span className="material-icons text-gray-600 text-xs ml-1 opacity-0 group-hover:opacity-50 transition-opacity">unfold_more</span>;
    }
    return sortConfig.direction === 'asc'
      ? <span className="material-icons text-primary text-xs ml-1">arrow_upward</span>
      : <span className="material-icons text-primary text-xs ml-1">arrow_downward</span>;
  };

  // Edit State
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleEdit = (customer: Customer) => {
    setEditMode(true);
    setEditingId(customer.id);
    setFormData({
      name: customer.name,
      contact: customer.email || '', // Fallback
      notes: customer.notes || ''
    });
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditingId(null);
    setFormData({ name: '', contact: '', notes: '' });
  };

  const handleSaveCustomer = async () => {
    try {
      const payload = {
        ...formData,
        email: formData.contact
      };

      if (editMode && editingId) {
        await updateDocument('customers', editingId, payload);
        setEditMode(false);
        setEditingId(null);
      } else {
        await addDocument('customers', payload);
      }

      setFormData({ name: '', contact: '', notes: '' });
    } catch (error) {
      console.error("Failed to save customer", error);
      alert("Failed to save customer. Name might look like a duplicate.");
    }
  };

  const handleDelete = async (id: string, customerData: Customer) => {
    if (customerData.totalOrders > 0) {
      alert("Cannot delete customer with existing orders. Please delete their orders first.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this customer?")) return;

    try {
      await deleteDocument('customers', id);
    } catch (error) {
      console.error("Failed to delete customer", error);
      alert("Failed to delete customer");
    }
  }

  // ... (Sort logic remains same)

  if (loading) return <div className="text-foreground p-8">Loading Customers...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="flex flex-col lg:flex-row gap-8">

        {/* Left Side: Register/Edit Customer Form */}
        <div className="w-full lg:w-1/3 animate-fade-in-up" style={{ animationFillMode: 'both', animationDelay: '0ms' }}>
          <div className="bg-background-surface shadow-lg shadow-black/50 border border-border-color rounded-xl p-6 sticky top-24">
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{editMode ? 'Edit Customer' : 'Register New Customer'}</h2>
                <p className="text-sm text-muted mt-1">{editMode ? 'Update customer details' : 'Add a new client to the directory.'}</p>
              </div>
              {editMode && (
                <button onClick={handleCancelEdit} className="text-xs text-red-400 hover:text-red-300 underline">Cancel</button>
              )}
            </div>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSaveCustomer(); }}>
              <div>
                <label className="block text-sm font-medium text-muted" htmlFor="name">Customer Name</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-icons text-gray-600 text-sm">person</span>
                  </div>
                  <input className="block w-full pl-10 sm:text-sm bg-background-surface border-border-color border text-foreground rounded-lg py-2.5 focus:ring-primary focus:border-primary placeholder-text-muted"
                    id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. Acme Industries" type="text" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted" htmlFor="contact">Contact Details</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-icons text-gray-600 text-sm">email</span>
                  </div>
                  <input className="block w-full pl-10 sm:text-sm bg-background-surface border-border-color border text-foreground rounded-lg py-2.5 focus:ring-primary focus:border-primary placeholder-text-muted"
                    id="contact" name="contact" value={formData.contact} onChange={handleInputChange} placeholder="Email or Phone Number" type="text" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted" htmlFor="notes">Internal Notes</label>
                <div className="mt-1">
                  <textarea className="shadow-sm block w-full sm:text-sm bg-background-surface border-border-color border text-foreground rounded-lg py-2.5 focus:ring-primary focus:border-primary placeholder-text-muted"
                    id="notes" name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Preferences, delivery instructions, etc." rows={4}></textarea>
                </div>
              </div>
              <div className="pt-2">
                <button className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-black transition-all transform hover:scale-[1.02] ${editMode ? 'bg-primary hover:bg-primary/90' : 'bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500'}`} type="submit">
                  <span className="material-icons text-sm mr-2 text-black">{editMode ? 'save' : 'add'}</span> {editMode ? 'Update Customer' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side: Customer Database Table */}
        <div className="w-full lg:w-2/3 animate-fade-in-up" style={{ animationFillMode: 'both', animationDelay: '100ms' }}>
          <div className="bg-background-surface shadow-lg shadow-black/50 border border-border-color rounded-xl overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-border-color flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Customer Database</h2>
                <p className="text-sm text-muted mt-1">Manage and view all registered customers.</p>
              </div>
              <div className="relative rounded-md shadow-sm max-w-xs w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-icons text-primary">search</span>
                </div>
                <input
                  className="block w-full pl-10 sm:text-sm bg-background-surface border border-border-color text-foreground rounded-lg py-2 focus:ring-primary focus:border-primary placeholder-text-muted"
                  id="search"
                  name="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or contact..."
                  type="text"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-800">
                <thead className="bg-background-base">
                  <tr>
                    <th onClick={() => requestSort('name')} className="group px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider cursor-pointer hover:bg-gray-800 select-none">
                      <div className="flex items-center">Customer Name {getSortIcon('name')}</div>
                    </th>
                    <th onClick={() => requestSort('totalOrders')} className="group px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider cursor-pointer hover:bg-gray-800 select-none">
                      <div className="flex items-center">Orders {getSortIcon('totalOrders')}</div>
                    </th>
                    <th onClick={() => requestSort('totalRevenue')} className="group px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider cursor-pointer hover:bg-gray-800 select-none">
                      <div className="flex items-center">Total Revenue {getSortIcon('totalRevenue')}</div>
                    </th>
                    <th onClick={() => requestSort('lastOrderDate')} className="group px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider cursor-pointer hover:bg-gray-800 select-none">
                      <div className="flex items-center">Last Order {getSortIcon('lastOrderDate')}</div>
                    </th>
                    <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="bg-background-surface divide-y divide-gray-800">
                  {sortedCustomers.map((customer, index) => (
                    <tr key={customer.id} className="animate-slide-up-fade premium-hover hover:bg-primary/5 hover:border-l-2 hover:border-primary transition-all group" style={{ animationDelay: `${index * 50}ms` }}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-800 rounded-full flex items-center justify-center text-primary font-bold border border-border-color group-hover:border-primary/50 transition-colors">
                            {customer.avatarLetter}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-foreground group-hover:text-foreground">{customer.name}</div>
                            <div className="text-sm text-muted">{customer.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-800 text-foreground-muted border border-border-color">
                          {customer.totalOrders}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary font-mono font-medium tracking-tight">
                        ₹{customer.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">{customer.lastOrderDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => handleEdit(customer)} className="text-muted hover:text-primary transition-colors mr-3">
                          <span className="material-icons text-lg">edit</span>
                        </button>
                        <button onClick={() => handleDelete(customer.id, customer)} className="text-muted hover:text-red-400 transition-colors">
                          <span className="material-icons text-lg">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Customers;