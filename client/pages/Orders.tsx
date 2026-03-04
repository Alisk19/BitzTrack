import React, { useState, useMemo, useEffect } from 'react';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument } from '../services/firestore';
import { exportToCSV } from '../utils/exportUtils';

interface Order {
  id: string;
  customerId: string;
  customer: string;
  productName: string;
  quantity: number;
  pricePerUnit: number;
  amount: number;
  paid: number;
  pending: number;
  status: string;
  rawMaterialType: string;
  rawMaterialColor: string;
  failedProducts: number;
  date: string;
  deliveryDate: string;
  productionStatus: string;
  // Raw data for editing
  _rawDate?: string;
}

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Order; direction: 'asc' | 'desc' } | null>(null);

  // Edit State
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Customer Data for Dropdown
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    customerId: '', // Replaces customerName for input
    customerName: '', // Kept for display/legacy
    productName: '',
    quantity: '',
    unitPrice: '',
    amountPaid: '',
    rawMaterialType: '',
    rawMaterialColor: '',
    failedProducts: '',
    paymentStatus: '',
    productionStatus: 'Designing',
    deliveryDate: '',
    orderDate: new Date().toISOString().split('T')[0], // Default to today
    notes: ''
  });

  useEffect(() => {
    const unsubOrders = subscribeToCollection('orders', (data) => {
      const mappedOrders = data.map((o: any) => ({
        id: o.id,
        customerId: o.customerId,
        customer: o.customerName || 'Unknown',
        productName: o.productName || '',
        quantity: o.quantity || 0,
        pricePerUnit: o.unitPrice || 0,
        amount: o.totalAmount || 0,
        paid: o.amountPaid || 0,
        pending: (o.totalAmount || 0) - (o.amountPaid || 0),
        status: o.paymentStatus || 'Unpaid',
        productionStatus: o.productionStatus || 'Designing',
        rawMaterialType: o.rawMaterialType || '',
        rawMaterialColor: o.rawMaterialColor || '',
        failedProducts: o.failedProducts || 0,
        date: o.createdAt ? new Date(o.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
        _rawDate: o.createdAt ? o.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
        deliveryDate: o.deliveryDate || ''
      }));
      setOrders(mappedOrders);
      setLoading(false);
    });

    const unsubCustomers = subscribeToCollection('customers', (data) => {
      setCustomers(data.map(c => ({ id: c.id, name: c.name })));
    });

    return () => {
      unsubOrders();
      unsubCustomers();
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (order: Order) => {
    setEditMode(true);
    setEditingId(order.id);

    // Find full order data if needed, or use what we have
    // Try to match customer name to ID if ID is missing (legacy)
    const matchedCustomer = customers.find(c => c.name === order.customer);

    setFormData({
      customerId: order.customerId || (matchedCustomer ? matchedCustomer.id : ''),
      customerName: order.customer,
      productName: order.productName,
      quantity: order.quantity.toString(),
      unitPrice: order.pricePerUnit.toString(),
      amountPaid: order.paid.toString(),
      rawMaterialType: order.rawMaterialType,
      rawMaterialColor: order.rawMaterialColor,
      failedProducts: order.failedProducts.toString(),
      paymentStatus: order.status,
      productionStatus: order.productionStatus || 'Designing',
      deliveryDate: order.deliveryDate,
      orderDate: order._rawDate || new Date().toISOString().split('T')[0],
      notes: '' // Notes not in table, would need proper fetch or just leave empty
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditingId(null);
    setEditMode(false);
    setEditingId(null);
    setFormData({
      customerId: '',
      customerName: '',
      productName: '',
      quantity: '',
      unitPrice: '',
      amountPaid: '',
      rawMaterialType: '',
      rawMaterialColor: '',
      failedProducts: '',
      paymentStatus: '',
      productionStatus: 'Designing',
      deliveryDate: '',
      orderDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
    try {
      await deleteDocument('orders', id);
    } catch (error) {
      console.error("Failed to delete order", error);
      alert("Failed to delete order.");
    }
  };

  const handleSaveOrder = async () => {
    try {
      // Find the selected customer name
      const selectedCustomer = customers.find(c => c.id === formData.customerId);
      const customerName = selectedCustomer ? selectedCustomer.name : formData.customerName;

      const payload = {
        ...formData,
        customerName, // Ensure we upload the current name
        totalAmount: (parseFloat(formData.quantity) || 0) * (parseFloat(formData.unitPrice) || 0),
        createdAt: new Date(formData.orderDate).toISOString()
      };

      if (editMode && editingId) {
        await updateDocument('orders', editingId, payload);
        alert("Order updated successfully!");
      } else {
        await addDocument('orders', payload);
        alert("Order created successfully!");
      }

      handleCancelEdit();
    } catch (error) {
      console.error("Failed to save order", error);
      alert(`Failed to save order.`);
    }
  };

  const sortedOrders = useMemo(() => {
    let processableItems = [...orders];

    // Apply Filter
    if (filterStatus !== 'All') {
      processableItems = processableItems.filter(o => o.status === filterStatus);
    }

    // Apply Search
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      processableItems = processableItems.filter(o =>
        o.customer.toLowerCase().includes(lowerSearch) ||
        o.productName.toLowerCase().includes(lowerSearch) ||
        o.rawMaterialType.toLowerCase().includes(lowerSearch)
      );
    }

    if (sortConfig !== null) {
      processableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'date' || sortConfig.key === 'deliveryDate') {
          const dateA = new Date(aValue as string).getTime();
          const dateB = new Date(bValue as string).getTime();
          return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
        }

        if (aValue! < bValue!) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue! > bValue!) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return processableItems;
  }, [orders, sortConfig, searchTerm, filterStatus]);

  const requestSort = (key: keyof Order) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (name: keyof Order) => {
    if (!sortConfig || sortConfig.key !== name) {
      return <span className="material-icons text-gray-600 text-xs ml-1 opacity-0 group-hover:opacity-50 transition-opacity">unfold_more</span>;
    }
    return sortConfig.direction === 'asc'
      ? <span className="material-icons text-primary text-xs ml-1">arrow_upward</span>
      : <span className="material-icons text-primary text-xs ml-1">arrow_downward</span>;
  };

  if (loading) return <div className="text-foreground p-8">Loading Orders...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-foreground">Order Management</h2>
          <p className="mt-1 text-sm text-muted">Create new orders manually and track detailed production metrics.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => exportToCSV('orders_report', sortedOrders)}
            className="inline-flex items-center px-4 py-2 border border-border-color rounded-md shadow-sm text-sm font-medium text-foreground bg-background-surface hover:bg-[#2a2a2a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-primary relative"
          >
            <span className="material-icons mr-2 text-lg">download</span>
            Export Excel
          </button>
        </div>
      </div>

      {/* New Order Entry Form */}
      <div className="bg-background-surface border border-border-color rounded-lg p-6 mb-8 shadow-lg animate-fade-in-up" style={{ animationFillMode: 'both', animationDelay: '100ms' }}>
        <div className="flex items-center mb-6 justify-between">
          <div className="flex items-center">
            <span className="material-icons text-primary mr-2">{editMode ? 'edit' : 'add_circle_outline'}</span>
            <h3 className="text-lg font-medium text-primary">{editMode ? 'Edit Order' : 'New Order Entry'}</h3>
          </div>
          {editMode && (
            <button onClick={handleCancelEdit} className="text-sm text-red-400 hover:text-red-300 underline">Cancel Edit</button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Row 1 */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-muted mb-1">Customer</label>
            <select name="customerId" value={formData.customerId} onChange={handleInputChange} className="block w-full bg-background-base border border-border-color rounded-md py-2 px-3 text-foreground placeholder-text-muted focus:ring-primary focus:border-primary sm:text-sm appearance-none">
              <option value="">Select Customer</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium text-muted mb-1">Product Name</label>
            <input type="text" name="productName" value={formData.productName} onChange={handleInputChange} className="block w-full bg-background-base border border-border-color rounded-md py-2 px-3 text-foreground placeholder-text-muted focus:ring-primary focus:border-primary sm:text-sm" placeholder="Enter product name" />
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium text-muted mb-1">Quantity</label>
            <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} className="block w-full bg-background-base border border-border-color rounded-md py-2 px-3 text-foreground placeholder-text-muted focus:ring-primary focus:border-primary sm:text-sm" placeholder="0" />
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium text-muted mb-1">Pricing per Quantity</label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-muted sm:text-sm">₹</span>
              </div>
              <input type="number" name="unitPrice" value={formData.unitPrice} onChange={handleInputChange} className="block w-full pl-8 bg-background-base border border-border-color rounded-md py-2 text-foreground placeholder-text-muted focus:ring-primary focus:border-primary sm:text-sm" placeholder="0.00" />
            </div>
          </div>

          {/* Row 2 */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-muted mb-1">Total Pricing (Auto)</label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-muted sm:text-sm">₹</span>
              </div>
              {/* Read only calculated field */}
              <input type="number" readOnly value={((parseFloat(formData.quantity) || 0) * (parseFloat(formData.unitPrice) || 0)).toFixed(2)} className="block w-full pl-8 bg-background-base border border-border-color rounded-md py-2 text-muted placeholder-text-muted focus:ring-primary focus:border-primary sm:text-sm" />
            </div>
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium text-muted mb-1">Raw Material Type</label>
            <input type="text" name="rawMaterialType" value={formData.rawMaterialType} onChange={handleInputChange} className="block w-full bg-background-base border border-border-color rounded-md py-2 px-3 text-foreground placeholder-text-muted focus:ring-primary focus:border-primary sm:text-sm" placeholder="e.g. Steel, Plastic" />
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium text-muted mb-1">Raw Material Colour</label>
            <input type="text" name="rawMaterialColor" value={formData.rawMaterialColor} onChange={handleInputChange} className="block w-full bg-background-base border border-border-color rounded-md py-2 px-3 text-foreground placeholder-text-muted focus:ring-primary focus:border-primary sm:text-sm" placeholder="e.g. Black, Red" />
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium text-muted mb-1">Failed Products</label>
            <input type="number" name="failedProducts" value={formData.failedProducts} onChange={handleInputChange} className="block w-full bg-background-base border border-border-color rounded-md py-2 px-3 text-foreground placeholder-text-muted focus:ring-primary focus:border-primary sm:text-sm" placeholder="0" />
          </div>

          {/* Row 3 - Additional Logistics */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-muted mb-1">Amount Paid (₹)</label>
            <input type="number" name="amountPaid" value={formData.amountPaid} onChange={handleInputChange} className="block w-full bg-background-base border border-border-color rounded-md py-2 px-3 text-foreground placeholder-text-muted focus:ring-primary focus:border-primary sm:text-sm" placeholder="0.00" />
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium text-muted mb-1">Remaining Amount (₹)</label>
            <div className="relative rounded-md shadow-sm">
              <input type="number" readOnly value={(((parseFloat(formData.quantity) || 0) * (parseFloat(formData.unitPrice) || 0)) - (parseFloat(formData.amountPaid) || 0)).toFixed(2)} className={`block w-full bg-background-base border ${(((parseFloat(formData.quantity) || 0) * (parseFloat(formData.unitPrice) || 0)) - (parseFloat(formData.amountPaid) || 0)) > 0 ? 'border-red-900 text-red-400' : 'border-green-900 text-green-400'} rounded-md py-2 px-3 placeholder-text-muted focus:ring-primary focus:border-primary sm:text-sm`} />
            </div>
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium text-muted mb-1">Order Date</label>
            <input
              type="date"
              name="orderDate"
              value={formData.orderDate}
              onChange={handleInputChange}
              style={{ colorScheme: 'dark' }}
              className="block w-full bg-background-base border border-border-color rounded-md py-2 px-3 text-foreground placeholder-text-muted focus:ring-primary focus:border-primary sm:text-sm"
            />
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium text-muted mb-1">Delivery Date</label>
            <input
              type="date"
              name="deliveryDate"
              value={formData.deliveryDate}
              onChange={handleInputChange}
              style={{ colorScheme: 'dark' }}
              className="block w-full bg-background-base border border-border-color rounded-md py-2 px-3 text-foreground placeholder-text-muted focus:ring-primary focus:border-primary sm:text-sm"
            />
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium text-muted mb-1">Production Status</label>
            <select name="productionStatus" value={formData.productionStatus} onChange={handleInputChange} className="block w-full bg-background-base border border-border-color rounded-md py-2 px-3 text-foreground placeholder-text-muted focus:ring-primary focus:border-primary sm:text-sm appearance-none">
              <option value="Designing">Designing</option>
              <option value="Processing">Processing</option>
              <option value="Completed">Completed</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>
        </div>

        <button onClick={handleSaveOrder} disabled={!formData.customerId || formData.customerId === ''} className={`border font-bold py-3 px-8 rounded shadow-lg transition-all duration-300 w-full sm:w-auto flex items-center justify-center ${!formData.customerId || formData.customerId === '' ? 'bg-gray-800 border-border-color text-muted cursor-not-allowed' : 'bg-background-base border-primary/30 hover:border-primary text-primary hover:bg-primary/10'}`}>
          <span className="material-icons text-sm mr-2">{editMode ? 'update' : 'save'}</span>
          {editMode ? 'Update Order' : 'Save Order'}
        </button>

      </div>

      {/* Orders List */}
      <div className="bg-background-surface border border-border-color rounded-lg shadow-lg overflow-hidden animate-fade-in-up" style={{ animationFillMode: 'both', animationDelay: '200ms' }}>
        <div className="p-4 border-b border-border-color flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="text-lg font-medium text-foreground">Recent Orders</h3>
          <div className="flex gap-2 w-full sm:w-auto relative">
            <div className="relative flex-grow sm:flex-grow-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-icons text-muted text-sm">search</span>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full sm:w-64 pl-10 bg-background-base border border-border-color rounded-md py-2 text-foreground placeholder-text-muted focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="Search orders..."
              />
            </div>

            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="inline-flex items-center px-4 py-2 border border-border-color rounded-md text-sm font-medium text-foreground bg-background-base hover:bg-[#2a2a2a] focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <span className="material-icons text-sm mr-1">filter_list</span>
                {filterStatus === 'All' ? 'Filter' : filterStatus}
              </button>

              {showFilterDropdown && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-[#181818] ring-1 ring-black ring-opacity-5 z-20 border border-border-color">
                  <div className="py-1" role="menu">
                    {['All', 'Paid', 'Partial', 'Unpaid'].map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          setFilterStatus(status);
                          setShowFilterDropdown(false);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm ${filterStatus === status ? 'bg-primary/10 text-primary' : 'text-foreground-muted hover:bg-gray-800 hover:text-foreground'}`}
                        role="menuitem"
                      >
                        {status === 'All' ? 'All Statuses' : status}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-background-base">
              <tr>
                <th onClick={() => requestSort('date')} className="group px-6 py-3 text-left text-xs font-bold text-foreground-muted uppercase tracking-wider cursor-pointer hover:bg-gray-800 select-none">
                  <div className="flex items-center">Date {getSortIcon('date')}</div>
                </th>
                <th onClick={() => requestSort('customer')} className="group px-6 py-3 text-left text-xs font-bold text-foreground-muted uppercase tracking-wider cursor-pointer hover:bg-gray-800 select-none">
                  <div className="flex items-center">Customer {getSortIcon('customer')}</div>
                </th>
                <th onClick={() => requestSort('productName')} className="group px-6 py-3 text-left text-xs font-bold text-foreground-muted uppercase tracking-wider cursor-pointer hover:bg-gray-800 select-none">
                  <div className="flex items-center">Product {getSortIcon('productName')}</div>
                </th>
                <th onClick={() => requestSort('quantity')} className="group px-6 py-3 text-right text-xs font-bold text-foreground-muted uppercase tracking-wider cursor-pointer hover:bg-gray-800 select-none">
                  <div className="flex items-center justify-end">Qty {getSortIcon('quantity')}</div>
                </th>
                <th onClick={() => requestSort('amount')} className="group px-6 py-3 text-right text-xs font-bold text-foreground-muted uppercase tracking-wider cursor-pointer hover:bg-gray-800 select-none">
                  <div className="flex items-center justify-end">Total Price {getSortIcon('amount')}</div>
                </th>
                <th onClick={() => requestSort('rawMaterialType')} className="group px-6 py-3 text-left text-xs font-bold text-foreground-muted uppercase tracking-wider cursor-pointer hover:bg-gray-800 select-none">
                  <div className="flex items-center">Raw Material {getSortIcon('rawMaterialType')}</div>
                </th>
                <th onClick={() => requestSort('failedProducts')} className="group px-6 py-3 text-right text-xs font-bold text-foreground-muted uppercase tracking-wider cursor-pointer hover:bg-gray-800 select-none">
                  <div className="flex items-center justify-end">Failed {getSortIcon('failedProducts')}</div>
                </th>
                <th onClick={() => requestSort('productionStatus')} className="group px-6 py-3 text-left text-xs font-bold text-foreground-muted uppercase tracking-wider cursor-pointer hover:bg-gray-800 select-none">
                  <div className="flex items-center">Production {getSortIcon('productionStatus')}</div>
                </th>
                <th onClick={() => requestSort('status')} className="group px-6 py-3 text-left text-xs font-bold text-foreground-muted uppercase tracking-wider cursor-pointer hover:bg-gray-800 select-none">
                  <div className="flex items-center">Payment {getSortIcon('status')}</div>
                </th>
                <th onClick={() => requestSort('pending')} className="group px-6 py-3 text-right text-xs font-bold text-foreground-muted uppercase tracking-wider cursor-pointer hover:bg-gray-800 select-none">
                  <div className="flex items-center justify-end">Remaining {getSortIcon('pending')}</div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-foreground-muted uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-background-surface divide-y divide-gray-800">
              {sortedOrders.map((order, index) => (
                <tr key={order.id} className="animate-slide-up-fade premium-hover hover:bg-primary/5 hover:border-l-2 hover:border-primary transition-all group" style={{ animationDelay: `${index * 50}ms` }}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">{order.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-foreground">{order.customer}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground-muted">{order.productName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground-muted text-right">{order.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary text-right">₹{order.amount.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                    {order.rawMaterialType} <span className="text-xs text-muted">({order.rawMaterialColor})</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-400 text-right">{order.failedProducts}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-md border 
                                    ${order.productionStatus === 'Delivered' ? 'bg-green-900/20 text-green-400 border-green-800' :
                        order.productionStatus === 'Completed' ? 'bg-blue-900/20 text-blue-400 border-blue-800' :
                          order.productionStatus === 'Processing' ? 'bg-yellow-900/20 text-yellow-500 border-yellow-800' :
                            'bg-gray-800 text-foreground-muted border-border-color'}`}>
                      {order.productionStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-md border 
                                    ${order.status === 'Paid' ? 'bg-green-900/20 text-green-400 border-green-800' :
                        order.status === 'Partial' ? 'bg-yellow-900/20 text-yellow-500 border-yellow-800' :
                          'bg-gray-800 text-foreground-muted border-border-color'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right">
                    {order.pending > 0 ? (
                      <span className="text-red-400">₹{order.pending.toFixed(2)}</span>
                    ) : (
                      <span className="text-green-400">₹0.00</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEdit(order)} className="text-blue-400 hover:text-blue-300 mr-3">
                      <span className="material-icons text-base">edit</span>
                    </button>
                    <button onClick={() => handleDelete(order.id)} className="text-red-400 hover:text-red-300">
                      <span className="material-icons text-base">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Orders;