import React, { useState, useMemo } from 'react';
import { Customer } from '../types';

const mockCustomers: Customer[] = [
  { id: '1', name: 'Acme Corp', email: 'contact@acme.com', totalOrders: 12, totalRevenue: 4500.00, lastOrderDate: 'Oct 24, 2023', avatarLetter: 'A' },
  { id: '2', name: 'Globex Inc', email: 'purchasing@globex.net', totalOrders: 3, totalRevenue: 1250.50, lastOrderDate: 'Nov 02, 2023', avatarLetter: 'G' },
  { id: '3', name: 'Stark Industries', email: 'tony@stark.com', totalOrders: 45, totalRevenue: 128400.00, lastOrderDate: 'Nov 05, 2023', avatarLetter: 'S' },
  { id: '4', name: 'Wayne Ent', email: 'bruce@wayne.com', totalOrders: 8, totalRevenue: 9200.00, lastOrderDate: 'Oct 15, 2023', avatarLetter: 'W' },
  { id: '5', name: 'Umbrella Corp', email: 'wesker@umbrella.com', totalOrders: 1, totalRevenue: 350.00, lastOrderDate: 'Sep 30, 2023', avatarLetter: 'U' },
];

const Customers: React.FC = () => {
  const [sortConfig, setSortConfig] = useState<{ key: keyof Customer; direction: 'asc' | 'desc' } | null>(null);

  const sortedCustomers = useMemo(() => {
    let sortableItems = [...mockCustomers];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'lastOrderDate') {
            const dateA = new Date(aValue as string).getTime();
            const dateB = new Date(bValue as string).getTime();
            return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [sortConfig]);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Side: Register New Customer Form */}
        <div className="w-full lg:w-1/3">
          <div className="bg-background-surface shadow-lg shadow-black/50 border border-gray-800 rounded-xl p-6 sticky top-24">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white">Register New Customer</h2>
              <p className="text-sm text-gray-500 mt-1">Add a new client to the directory for order tracking.</p>
            </div>
            <form action="#" className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-sm font-medium text-gray-400" htmlFor="name">Customer Name</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-icons text-gray-600 text-sm">person</span>
                  </div>
                  <input className="block w-full pl-10 sm:text-sm bg-[#1e1e1e] border-gray-700 border text-gray-200 rounded-lg py-2.5 focus:ring-primary focus:border-primary placeholder-gray-600" id="name" name="name" placeholder="e.g. Acme Industries" type="text" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400" htmlFor="contact">Contact Details</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-icons text-gray-600 text-sm">email</span>
                  </div>
                  <input className="block w-full pl-10 sm:text-sm bg-[#1e1e1e] border-gray-700 border text-gray-200 rounded-lg py-2.5 focus:ring-primary focus:border-primary placeholder-gray-600" id="contact" name="contact" placeholder="Email or Phone Number" type="text" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400" htmlFor="notes">Internal Notes</label>
                <div className="mt-1">
                  <textarea className="shadow-sm block w-full sm:text-sm bg-[#1e1e1e] border-gray-700 border text-gray-200 rounded-lg py-2.5 focus:ring-primary focus:border-primary placeholder-gray-600" id="notes" name="notes" placeholder="Preferences, delivery instructions, etc." rows={4}></textarea>
                </div>
              </div>
              <div className="pt-2">
                <button className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-black bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-[#1e1e1e] transition-all transform hover:scale-[1.02]" type="submit">
                  <span className="material-icons text-sm mr-2 text-black">add</span> Create Record
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side: Customer Database Table */}
        <div className="w-full lg:w-2/3">
          <div className="bg-background-surface shadow-lg shadow-black/50 border border-gray-800 rounded-xl overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Customer Database</h2>
                <p className="text-sm text-gray-500 mt-1">Manage and view all registered customers.</p>
              </div>
              <div className="relative rounded-md shadow-sm max-w-xs w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-icons text-primary">search</span>
                </div>
                <input className="block w-full pl-10 sm:text-sm bg-[#1e1e1e] border border-gray-700 text-gray-200 rounded-lg py-2 focus:ring-primary focus:border-primary placeholder-gray-600" id="search" name="search" placeholder="Search by name..." type="text" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-800">
                <thead className="bg-[#121212]">
                  <tr>
                    <th onClick={() => requestSort('name')} className="group px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-800 select-none">
                      <div className="flex items-center">Customer Name {getSortIcon('name')}</div>
                    </th>
                    <th onClick={() => requestSort('totalOrders')} className="group px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-800 select-none">
                      <div className="flex items-center">Orders {getSortIcon('totalOrders')}</div>
                    </th>
                    <th onClick={() => requestSort('totalRevenue')} className="group px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider cursor-pointer hover:bg-gray-800 select-none">
                      <div className="flex items-center">Total Revenue {getSortIcon('totalRevenue')}</div>
                    </th>
                    <th onClick={() => requestSort('lastOrderDate')} className="group px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-800 select-none">
                      <div className="flex items-center">Last Order {getSortIcon('lastOrderDate')}</div>
                    </th>
                    <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="bg-background-surface divide-y divide-gray-800">
                  {sortedCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-900 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-800 rounded-full flex items-center justify-center text-primary font-bold border border-gray-700 group-hover:border-primary/50 transition-colors">
                            {customer.avatarLetter}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-200 group-hover:text-white">{customer.name}</div>
                            <div className="text-sm text-gray-500">{customer.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-800 text-gray-300 border border-gray-700">
                          {customer.totalOrders}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary font-mono font-medium tracking-tight">
                        ${customer.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{customer.lastOrderDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-gray-500 hover:text-primary transition-colors">
                          <span className="material-icons text-lg">edit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="bg-[#121212] px-4 py-3 flex items-center justify-between border-t border-gray-800 sm:px-6 mt-auto">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-400">
                    Showing <span className="font-medium text-white">1</span> to <span className="font-medium text-white">5</span> of <span className="font-medium text-white">42</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-700 bg-background-surface text-sm font-medium text-gray-400 hover:bg-gray-800 transition-colors">
                      <span className="sr-only">Previous</span>
                      <span className="material-icons text-sm">chevron_left</span>
                    </button>
                    <button className="z-10 bg-primary/10 border-primary text-primary relative inline-flex items-center px-4 py-2 border text-sm font-medium">1</button>
                    <button className="bg-background-surface border-gray-700 text-gray-400 hover:bg-gray-800 relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors">2</button>
                    <button className="bg-background-surface border-gray-700 text-gray-400 hover:bg-gray-800 hidden md:inline-flex relative items-center px-4 py-2 border text-sm font-medium transition-colors">3</button>
                    <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-700 bg-background-surface text-sm font-medium text-gray-400 hover:bg-gray-800 transition-colors">
                      <span className="sr-only">Next</span>
                      <span className="material-icons text-sm">chevron_right</span>
                    </button>
                  </nav>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Customers;