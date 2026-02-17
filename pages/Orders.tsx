import React, { useState, useMemo } from 'react';
import { Order } from '../types';

const mockOrders: Order[] = [
  { 
    id: 'ORD-2023-001', 
    customer: 'Apex Construction', 
    productName: 'Steel Girders',
    quantity: 50,
    pricePerUnit: 90.00,
    amount: 4500.00, 
    rawMaterialType: 'Steel',
    rawMaterialColor: 'Grey',
    failedProducts: 0,
    date: 'Oct 24, 2023', 
    paid: 4500.00, 
    pending: 0, 
    status: 'Paid', 
    deliveryDate: 'Nov 01, 2023' 
  },
  { 
    id: 'ORD-2023-002', 
    customer: 'Skyline Interiors', 
    productName: 'Copper Wiring Bundle',
    quantity: 200,
    pricePerUnit: 61.75,
    amount: 12350.00, 
    rawMaterialType: 'Copper',
    rawMaterialColor: 'Orange',
    failedProducts: 12,
    date: 'Oct 23, 2023', 
    paid: 5000.00, 
    pending: 7350.00, 
    status: 'Partial', 
    deliveryDate: 'Nov 15, 2023' 
  },
  { 
    id: 'ORD-2023-003', 
    customer: 'Modern Homes Ltd', 
    productName: 'Plastic Casings',
    quantity: 1000,
    pricePerUnit: 2.10,
    amount: 2100.00, 
    rawMaterialType: 'Plastic',
    rawMaterialColor: 'Black',
    failedProducts: 5,
    date: 'Oct 22, 2023', 
    paid: 0, 
    pending: 2100.00, 
    status: 'Unpaid', 
    deliveryDate: 'Oct 30, 2023' 
  },
  { 
    id: 'ORD-2023-004', 
    customer: 'John Doe Renovations', 
    productName: 'Aluminum Sheets',
    quantity: 20,
    pricePerUnit: 42.50,
    amount: 850.00, 
    rawMaterialType: 'Aluminum',
    rawMaterialColor: 'Silver',
    failedProducts: 0,
    date: 'Oct 20, 2023', 
    paid: 850.00, 
    pending: 0, 
    status: 'Paid', 
    deliveryDate: 'Oct 22, 2023' 
  },
];

const Orders: React.FC = () => {
  const [sortConfig, setSortConfig] = useState<{ key: keyof Order; direction: 'asc' | 'desc' } | null>(null);

  const sortedOrders = useMemo(() => {
    let sortableItems = [...mockOrders];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle Date Sorting
        if (sortConfig.key === 'date' || sortConfig.key === 'deliveryDate') {
            const dateA = new Date(aValue as string).getTime();
            const dateB = new Date(bValue as string).getTime();
            return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
        }
        
        // Handle String and Number Sorting
        if (aValue! < bValue!) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue! > bValue!) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [sortConfig]);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold leading-7 text-white">Order Management</h2>
        <p className="mt-1 text-sm text-gray-400">Create new orders manually and track detailed production metrics.</p>
        <div className="absolute top-8 right-8 mt-20 sm:mt-0 sm:relative sm:top-auto sm:right-auto sm:float-right -translate-y-12 sm:translate-y-0">
             <button className="inline-flex items-center px-4 py-2 border border-gray-700 rounded-md shadow-sm text-sm font-medium text-gray-200 bg-background-surface hover:bg-[#2a2a2a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-primary">
                <span className="material-icons mr-2 text-lg">download</span>
                Export Excel
            </button>
        </div>
      </div>

      {/* New Order Entry Form */}
      <div className="bg-background-surface border border-gray-800 rounded-lg p-6 mb-8 shadow-lg">
        <div className="flex items-center mb-6">
            <span className="material-icons text-primary mr-2">add_circle_outline</span>
            <h3 className="text-lg font-medium text-primary">New Order Entry</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Row 1 */}
            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-400 mb-1">Customer Name</label>
                <input type="text" className="block w-full bg-[#121212] border border-gray-700 rounded-md py-2 px-3 text-gray-200 placeholder-gray-600 focus:ring-primary focus:border-primary sm:text-sm" placeholder="Enter customer name" />
            </div>
            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-400 mb-1">Product Name</label>
                <input type="text" className="block w-full bg-[#121212] border border-gray-700 rounded-md py-2 px-3 text-gray-200 placeholder-gray-600 focus:ring-primary focus:border-primary sm:text-sm" placeholder="Enter product name" />
            </div>
            <div className="col-span-1">
                 <label className="block text-sm font-medium text-gray-400 mb-1">Quantity</label>
                 <input type="number" className="block w-full bg-[#121212] border border-gray-700 rounded-md py-2 px-3 text-gray-200 placeholder-gray-600 focus:ring-primary focus:border-primary sm:text-sm" placeholder="0" />
            </div>
            <div className="col-span-1">
                 <label className="block text-sm font-medium text-gray-400 mb-1">Pricing per Quantity</label>
                 <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">₹</span>
                    </div>
                    <input type="number" className="block w-full pl-8 bg-[#121212] border border-gray-700 rounded-md py-2 text-gray-200 placeholder-gray-600 focus:ring-primary focus:border-primary sm:text-sm" placeholder="0.00" />
                </div>
            </div>

            {/* Row 2 */}
            <div className="col-span-1">
                 <label className="block text-sm font-medium text-gray-400 mb-1">Total Pricing</label>
                 <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">₹</span>
                    </div>
                    <input type="number" className="block w-full pl-8 bg-[#121212] border border-gray-700 rounded-md py-2 text-gray-200 placeholder-gray-600 focus:ring-primary focus:border-primary sm:text-sm" placeholder="0.00" />
                </div>
            </div>
            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-400 mb-1">Raw Material Type</label>
                <input type="text" className="block w-full bg-[#121212] border border-gray-700 rounded-md py-2 px-3 text-gray-200 placeholder-gray-600 focus:ring-primary focus:border-primary sm:text-sm" placeholder="e.g. Steel, Plastic" />
            </div>
            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-400 mb-1">Raw Material Colour</label>
                <input type="text" className="block w-full bg-[#121212] border border-gray-700 rounded-md py-2 px-3 text-gray-200 placeholder-gray-600 focus:ring-primary focus:border-primary sm:text-sm" placeholder="e.g. Black, Red" />
            </div>
            <div className="col-span-1">
                 <label className="block text-sm font-medium text-gray-400 mb-1">Failed Products</label>
                 <input type="number" className="block w-full bg-[#121212] border border-gray-700 rounded-md py-2 px-3 text-gray-200 placeholder-gray-600 focus:ring-primary focus:border-primary sm:text-sm" placeholder="0" />
            </div>

            {/* Row 3 - Additional Logistics */}
             <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                <input type="text" className="block w-full bg-[#121212] border border-gray-700 rounded-md py-2 px-3 text-gray-200 placeholder-gray-600 focus:ring-primary focus:border-primary sm:text-sm" placeholder="e.g. Paid, Pending" />
            </div>
            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-400 mb-1">Order Date</label>
                <input type="date" className="block w-full bg-[#121212] border border-gray-700 rounded-md py-2 px-3 text-gray-200 placeholder-gray-600 focus:ring-primary focus:border-primary sm:text-sm" />
            </div>
             <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-400 mb-1">Delivery Date</label>
                <input type="date" className="block w-full bg-[#121212] border border-gray-700 rounded-md py-2 px-3 text-gray-200 placeholder-gray-600 focus:ring-primary focus:border-primary sm:text-sm" />
            </div>
        </div>

        <div className="flex justify-end">
            <button className="bg-[#121212] border border-primary/30 hover:border-primary text-primary hover:bg-primary/10 font-bold py-3 px-8 rounded shadow-lg transition-all duration-300 w-full sm:w-auto flex items-center justify-center">
                <span className="material-icons text-sm mr-2">save</span>
                Save Order
            </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-background-surface border border-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h3 className="text-lg font-medium text-white">Recent Orders</h3>
            <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-grow sm:flex-grow-0">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="material-icons text-gray-500 text-sm">search</span>
                    </div>
                    <input type="text" className="block w-full sm:w-64 pl-10 bg-[#121212] border border-gray-700 rounded-md py-2 text-gray-200 placeholder-gray-600 focus:ring-primary focus:border-primary sm:text-sm" placeholder="Search..." />
                </div>
                <button className="inline-flex items-center px-4 py-2 border border-gray-700 rounded-md text-sm font-medium text-gray-200 bg-[#121212] hover:bg-[#2a2a2a] focus:outline-none focus:ring-2 focus:ring-primary">
                    <span className="material-icons text-sm mr-1">filter_list</span> Filter
                </button>
            </div>
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800">
                <thead className="bg-[#121212]">
                    <tr>
                        <th onClick={() => requestSort('date')} className="group px-6 py-3 text-left text-xs font-bold text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-800 select-none">
                          <div className="flex items-center">Date {getSortIcon('date')}</div>
                        </th>
                        <th onClick={() => requestSort('customer')} className="group px-6 py-3 text-left text-xs font-bold text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-800 select-none">
                          <div className="flex items-center">Customer {getSortIcon('customer')}</div>
                        </th>
                        <th onClick={() => requestSort('productName')} className="group px-6 py-3 text-left text-xs font-bold text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-800 select-none">
                          <div className="flex items-center">Product {getSortIcon('productName')}</div>
                        </th>
                        <th onClick={() => requestSort('quantity')} className="group px-6 py-3 text-right text-xs font-bold text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-800 select-none">
                          <div className="flex items-center justify-end">Qty {getSortIcon('quantity')}</div>
                        </th>
                        <th onClick={() => requestSort('amount')} className="group px-6 py-3 text-right text-xs font-bold text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-800 select-none">
                          <div className="flex items-center justify-end">Total Price {getSortIcon('amount')}</div>
                        </th>
                        <th onClick={() => requestSort('rawMaterialType')} className="group px-6 py-3 text-left text-xs font-bold text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-800 select-none">
                          <div className="flex items-center">Raw Material {getSortIcon('rawMaterialType')}</div>
                        </th>
                         <th onClick={() => requestSort('failedProducts')} className="group px-6 py-3 text-right text-xs font-bold text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-800 select-none">
                          <div className="flex items-center justify-end">Failed {getSortIcon('failedProducts')}</div>
                        </th>
                        <th onClick={() => requestSort('status')} className="group px-6 py-3 text-left text-xs font-bold text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-800 select-none">
                          <div className="flex items-center">Status {getSortIcon('status')}</div>
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-background-surface divide-y divide-gray-800">
                    {sortedOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-[#252525] transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{order.date}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-white">{order.customer}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{order.productName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 text-right">{order.quantity}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary text-right">₹{order.amount.toFixed(2)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                {order.rawMaterialType} <span className="text-xs text-gray-500">({order.rawMaterialColor})</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-400 text-right">{order.failedProducts}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-md border 
                                    ${order.status === 'Paid' ? 'bg-green-900/20 text-green-400 border-green-800' : 
                                      order.status === 'Partial' ? 'bg-yellow-900/20 text-yellow-500 border-yellow-800' : 
                                      'bg-gray-800 text-gray-300 border-gray-700'}`}>
                                    {order.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <div className="bg-[#121212] px-4 py-3 flex items-center justify-between border-t border-gray-800 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-gray-400">
                        Showing <span className="font-medium text-white">1</span> to <span className="font-medium text-white">4</span> of <span className="font-medium text-white">24</span> results
                    </p>
                </div>
                <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-700 bg-background-surface text-sm font-medium text-gray-400 hover:bg-gray-800">
                            <span className="material-icons text-sm">chevron_left</span>
                        </button>
                        <button className="relative inline-flex items-center px-4 py-2 border border-primary text-sm font-medium text-primary bg-primary/10">1</button>
                        <button className="relative inline-flex items-center px-4 py-2 border border-gray-700 bg-background-surface text-sm font-medium text-gray-400 hover:bg-gray-800">2</button>
                        <button className="relative inline-flex items-center px-4 py-2 border border-gray-700 bg-background-surface text-sm font-medium text-gray-400 hover:bg-gray-800">3</button>
                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-700 bg-background-surface text-sm font-medium text-gray-400">...</span>
                        <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-700 bg-background-surface text-sm font-medium text-gray-400 hover:bg-gray-800">
                             <span className="material-icons text-sm">chevron_right</span>
                        </button>
                    </nav>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Orders;