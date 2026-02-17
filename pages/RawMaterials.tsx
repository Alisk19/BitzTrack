import React, { useState, useMemo } from 'react';
import { Material } from '../types';

const PARTNERS = ['Alex Mercer', 'Sarah Connors', 'John Wick', 'Ellen Ripley'];

const mockMaterials: Material[] = [
  { id: 1, name: 'Steel Sheets (Grade A)', dealerName: 'MetalCorp Industries', materialType: 'Metal', quantity: 500, unit: 'Units', receiveDate: '2023-10-24', paymentStatus: 'Paid', paidBy: 'Alex Mercer', icon: 'grid_view' },
  { id: 2, name: 'Copper Wire Spools', dealerName: 'ElectroSupply Co.', materialType: 'Conductive', quantity: 120, unit: 'Kg', receiveDate: '2023-10-23', paymentStatus: 'Pending', paidBy: '-', icon: 'cable' },
  { id: 3, name: 'Industrial Solvent', dealerName: 'ChemTech Solutions', materialType: 'Chemical', quantity: 50, unit: 'Liters', receiveDate: '2023-10-22', paymentStatus: 'Paid', paidBy: 'John Wick', icon: 'water_drop' },
  { id: 4, name: 'Polymer Granules', dealerName: 'Plastico Ltd.', materialType: 'Plastic', quantity: 2000, unit: 'Kg', receiveDate: '2023-10-21', paymentStatus: 'Unpaid', paidBy: '-', icon: 'layers' },
  { id: 5, name: 'Aluminum Brackets', dealerName: 'Alloy World', materialType: 'Metal', quantity: 300, unit: 'Units', receiveDate: '2023-10-20', paymentStatus: 'Paid', paidBy: 'Sarah Connors', icon: 'grid_view' },
];

const RawMaterials: React.FC = () => {
  const [sortConfig, setSortConfig] = useState<{ key: keyof Material; direction: 'asc' | 'desc' } | null>(null);
  const [formPaymentStatus, setFormPaymentStatus] = useState('Paid');

  const sortedMaterials = useMemo(() => {
    let sortableItems = [...mockMaterials];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'receiveDate') {
            const dateA = new Date(aValue as string).getTime();
            const dateB = new Date(bValue as string).getTime();
            return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
        }

        if (aValue === undefined || bValue === undefined) return 0;

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

  const requestSort = (key: keyof Material) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (name: keyof Material) => {
    if (!sortConfig || sortConfig.key !== name) {
      return <span className="material-icons text-gray-600 text-xs ml-1 opacity-0 group-hover:opacity-50 transition-opacity">unfold_more</span>;
    }
    return sortConfig.direction === 'asc' 
      ? <span className="material-icons text-primary text-xs ml-1">arrow_upward</span> 
      : <span className="material-icons text-primary text-xs ml-1">arrow_downward</span>;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-white">Raw Materials <span className="text-gray-400 font-normal">Inventory</span></h2>
          <p className="mt-1 text-sm text-gray-400">Manage your incoming stock, dealers, and payments.</p>
        </div>
        <button className="hidden sm:inline-flex items-center px-4 py-2 border border-gray-700 rounded-md shadow-sm text-sm font-medium text-gray-200 bg-background-surface hover:bg-[#2a2a2a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-primary">
          <span className="material-icons mr-2 text-lg">download</span>
          Export CSV
        </button>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-background-surface border border-gray-800 rounded-lg p-6">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Total Entries</p>
          <div className="flex items-center">
            <span className="text-3xl font-bold text-white mr-3">1,248</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary text-black">
              +12%
            </span>
          </div>
        </div>
        <div className="bg-background-surface border border-gray-800 rounded-lg p-6">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Total Dealers</p>
          <div className="flex items-center">
            <span className="text-3xl font-bold text-primary">42</span>
          </div>
        </div>
        <div className="bg-background-surface border border-gray-800 rounded-lg p-6">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Pending Payments</p>
          <div className="flex items-center">
            <span className="text-2xl font-bold text-white">5</span>
            <span className="ml-2 text-xs text-red-400 flex items-center"><span className="material-icons text-sm mr-1">warning</span> Action Needed</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Side: Add Material Form */}
        <div className="w-full lg:w-1/3">
          <div className="bg-background-surface border border-gray-800 rounded-lg p-6 sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-white">Add Material</h3>
              <button className="text-primary hover:text-primary-hover">
                <span className="material-icons">add_circle</span>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Material Name</label>
                <input type="text" className="block w-full bg-[#121212] border border-gray-700 rounded-md py-3 px-4 text-gray-200 placeholder-gray-600 focus:ring-primary focus:border-primary sm:text-sm" placeholder="e.g. Steel Sheets Grade A" />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1">Dealer Name</label>
                <input type="text" className="block w-full bg-[#121212] border border-gray-700 rounded-md py-3 px-4 text-gray-200 placeholder-gray-600 focus:ring-primary focus:border-primary sm:text-sm" placeholder="e.g. MetalCorp Industries" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-primary mb-1">Material Type</label>
                    <input type="text" className="block w-full bg-[#121212] border border-gray-700 rounded-md py-3 px-4 text-gray-200 placeholder-gray-600 focus:ring-primary focus:border-primary sm:text-sm" placeholder="e.g. Metal" />
                 </div>
                 <div className="col-span-2 sm:col-span-1">
                   <label className="block text-sm font-medium text-primary mb-1">Receive Date</label>
                   <input type="date" className="block w-full bg-[#121212] border border-gray-700 rounded-md py-3 px-4 text-gray-200 placeholder-gray-600 focus:ring-primary focus:border-primary sm:text-sm" />
                 </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">Quantity</label>
                  <input type="number" className="block w-full bg-[#121212] border border-gray-700 rounded-md py-3 px-4 text-gray-200 placeholder-gray-600 focus:ring-primary focus:border-primary sm:text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">Unit</label>
                  <input type="text" className="block w-full bg-[#121212] border border-gray-700 rounded-md py-3 px-4 text-gray-200 placeholder-gray-600 focus:ring-primary focus:border-primary sm:text-sm" placeholder="e.g. Kg" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-2 sm:col-span-1">
                   <label className="block text-sm font-medium text-primary mb-1">Payment Status</label>
                   <select 
                      value={formPaymentStatus}
                      onChange={(e) => setFormPaymentStatus(e.target.value)}
                      className="block w-full bg-[#121212] border border-gray-700 rounded-md py-3 px-4 text-gray-200 focus:ring-primary focus:border-primary sm:text-sm"
                   >
                     <option value="Paid">Paid</option>
                     <option value="Pending">Pending</option>
                     <option value="Unpaid">Unpaid</option>
                   </select>
                 </div>
                 <div className="col-span-2 sm:col-span-1">
                   <label className="block text-sm font-medium text-primary mb-1">Paid By</label>
                   {formPaymentStatus === 'Paid' ? (
                     <select className="block w-full bg-[#121212] border border-gray-700 rounded-md py-3 px-4 text-gray-200 focus:ring-primary focus:border-primary sm:text-sm">
                       {PARTNERS.map(partner => (
                         <option key={partner} value={partner}>{partner}</option>
                       ))}
                     </select>
                   ) : (
                     <input type="text" disabled value="-" className="block w-full bg-[#181818] border border-gray-700 rounded-md py-3 px-4 text-gray-500 cursor-not-allowed sm:text-sm" />
                   )}
                 </div>
              </div>
            </div>

            <div className="mt-8">
              <button className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold py-3 px-4 rounded shadow-lg transition-all duration-300 uppercase tracking-wide text-sm">
                Log Material
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Entry History Table */}
        <div className="w-full lg:w-2/3">
          <div className="bg-background-surface border border-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <h3 className="text-lg font-medium text-white">Entry History</h3>
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-icons text-gray-500 text-sm">search</span>
                </div>
                <input type="text" className="block w-full pl-10 bg-[#121212] border border-gray-700 rounded-md py-2 text-gray-200 placeholder-gray-600 focus:ring-primary focus:border-primary sm:text-sm" placeholder="Search materials..." />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-800">
                <thead>
                  <tr className="bg-[#121212]">
                    <th onClick={() => requestSort('name')} className="group px-6 py-3 text-left text-xs font-bold text-primary uppercase tracking-wider cursor-pointer hover:bg-gray-800 select-none">
                      <div className="flex items-center whitespace-nowrap">Material Name {getSortIcon('name')}</div>
                    </th>
                    <th onClick={() => requestSort('dealerName')} className="group px-6 py-3 text-left text-xs font-bold text-primary uppercase tracking-wider cursor-pointer hover:bg-gray-800 select-none">
                      <div className="flex items-center whitespace-nowrap">Dealer Name {getSortIcon('dealerName')}</div>
                    </th>
                    <th onClick={() => requestSort('materialType')} className="group px-6 py-3 text-left text-xs font-bold text-primary uppercase tracking-wider cursor-pointer hover:bg-gray-800 select-none">
                      <div className="flex items-center whitespace-nowrap">Type {getSortIcon('materialType')}</div>
                    </th>
                    <th onClick={() => requestSort('quantity')} className="group px-6 py-3 text-right text-xs font-bold text-primary uppercase tracking-wider cursor-pointer hover:bg-gray-800 select-none">
                      <div className="flex items-center justify-end whitespace-nowrap">Quantity {getSortIcon('quantity')}</div>
                    </th>
                    <th onClick={() => requestSort('receiveDate')} className="group px-6 py-3 text-left text-xs font-bold text-primary uppercase tracking-wider cursor-pointer hover:bg-gray-800 select-none">
                      <div className="flex items-center whitespace-nowrap">Receive Date {getSortIcon('receiveDate')}</div>
                    </th>
                    <th onClick={() => requestSort('paymentStatus')} className="group px-6 py-3 text-left text-xs font-bold text-primary uppercase tracking-wider cursor-pointer hover:bg-gray-800 select-none">
                      <div className="flex items-center whitespace-nowrap">Payment Status {getSortIcon('paymentStatus')}</div>
                    </th>
                    <th onClick={() => requestSort('paidBy')} className="group px-6 py-3 text-left text-xs font-bold text-primary uppercase tracking-wider cursor-pointer hover:bg-gray-800 select-none">
                      <div className="flex items-center whitespace-nowrap">Paid By {getSortIcon('paidBy')}</div>
                    </th>
                    <th className="relative px-6 py-3"><span className="sr-only">Menu</span></th>
                  </tr>
                </thead>
                <tbody className="bg-background-surface divide-y divide-gray-800">
                  {sortedMaterials.map((item) => (
                    <tr key={item.id} className="hover:bg-[#252525] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-gray-700/50 rounded-md flex items-center justify-center text-primary/80 border border-gray-700 mr-3">
                            <span className="material-icons text-sm">{item.icon || 'category'}</span>
                          </div>
                          <div className="text-sm font-medium text-white">{item.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.dealerName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700">
                           {item.materialType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <span className="text-primary font-medium">{item.quantity}</span> <span className="text-gray-500 text-xs">{item.unit}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{item.receiveDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-md border 
                            ${item.paymentStatus === 'Paid' ? 'bg-green-900/20 text-green-400 border-green-800' : 
                              item.paymentStatus === 'Pending' ? 'bg-yellow-900/20 text-yellow-500 border-yellow-800' : 
                              'bg-red-900/20 text-red-400 border-red-800'}`}>
                            {item.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{item.paidBy}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                         <button className="text-gray-500 hover:text-white">
                           <span className="material-icons text-sm">more_vert</span>
                         </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-[#121212] px-4 py-3 flex items-center justify-between border-t border-gray-800 sm:px-6 mt-auto">
                <p className="text-sm text-gray-400">
                    Showing <span className="font-medium text-primary">1</span> to <span className="font-medium text-primary">5</span> of <span className="font-medium text-primary">128</span> results
                </p>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                     <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-700 bg-background-surface text-sm font-medium text-gray-400 hover:bg-gray-800">
                        <span className="material-icons text-xs">chevron_left</span>
                     </button>
                     <button className="z-10 bg-primary text-black font-bold relative inline-flex items-center px-4 py-2 border border-primary text-sm">1</button>
                     <button className="bg-background-surface border-gray-700 text-gray-400 hover:bg-gray-800 relative inline-flex items-center px-4 py-2 border text-sm font-medium">2</button>
                     <button className="bg-background-surface border-gray-700 text-gray-400 hover:bg-gray-800 relative inline-flex items-center px-4 py-2 border text-sm font-medium">3</button>
                     <span className="bg-background-surface border-gray-700 text-gray-400 relative inline-flex items-center px-4 py-2 border text-sm font-medium">...</span>
                     <button className="bg-background-surface border-gray-700 text-gray-400 hover:bg-gray-800 relative inline-flex items-center px-3 py-2 border text-sm font-medium">10</button>
                     <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-700 bg-background-surface text-sm font-medium text-gray-400 hover:bg-gray-800">
                        <span className="material-icons text-xs">chevron_right</span>
                     </button>
                </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RawMaterials;