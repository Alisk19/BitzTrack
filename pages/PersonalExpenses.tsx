import React, { useState, useMemo } from 'react';
import { Expense } from '../types';

const PARTNERS = ['Alex Mercer', 'Sarah Connors', 'John Wick', 'Ellen Ripley'];
const EXPENSE_TYPES = ['Rent', 'Light Bill', 'Other'] as const;

const mockExpenses: Expense[] = [
  { id: '1', paidBy: 'Alex Mercer', expenseType: 'Rent', amount: 15000, date: '2023-11-01', notes: 'Monthly office rent' },
  { id: '2', paidBy: 'Sarah Connors', expenseType: 'Light Bill', amount: 3500, date: '2023-11-05', notes: 'October electricity' },
  { id: '3', paidBy: 'John Wick', expenseType: 'Other', amount: 1200, date: '2023-11-02', notes: 'Office supplies' },
  { id: '4', paidBy: 'Ellen Ripley', expenseType: 'Rent', amount: 15000, date: '2023-10-01', notes: 'Last month rent' },
  { id: '5', paidBy: 'Alex Mercer', expenseType: 'Other', amount: 500, date: '2023-11-10', notes: 'Coffee for meeting' },
];

const PersonalExpenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Expense; direction: 'asc' | 'desc' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [formData, setFormData] = useState<{
    paidBy: string;
    expenseType: typeof EXPENSE_TYPES[number];
    amount: string;
    date: string;
    notes: string;
  }>({
    paidBy: PARTNERS[0],
    expenseType: 'Rent',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Stats Calculation
  const partnerStats = useMemo(() => {
    const stats: Record<string, { total: number; breakdown: Record<string, number> }> = {};
    
    PARTNERS.forEach(partner => {
        stats[partner] = { total: 0, breakdown: { 'Rent': 0, 'Light Bill': 0, 'Other': 0 } };
    });

    expenses.forEach(expense => {
        if (stats[expense.paidBy]) {
            stats[expense.paidBy].total += expense.amount;
            stats[expense.paidBy].breakdown[expense.expenseType] += expense.amount;
        }
    });

    return stats;
  }, [expenses]);

  const sortedExpenses = useMemo(() => {
    let sortableItems = [...expenses];
    
    // Filtering
    if (searchTerm) {
        sortableItems = sortableItems.filter(item => 
            item.paidBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.expenseType.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.notes.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    // Sorting
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'date') {
            const dateA = new Date(aValue as string).getTime();
            const dateB = new Date(bValue as string).getTime();
            return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
             return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }

        if (aValue! < bValue!) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue! > bValue!) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    } else {
        // Default sort by date desc
        sortableItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return sortableItems;
  }, [expenses, sortConfig, searchTerm]);

  const requestSort = (key: keyof Expense) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (name: keyof Expense) => {
    if (!sortConfig || sortConfig.key !== name) {
      return <span className="material-icons text-gray-600 text-xs ml-1 opacity-0 group-hover:opacity-50 transition-opacity">unfold_more</span>;
    }
    return sortConfig.direction === 'asc' 
      ? <span className="material-icons text-primary text-xs ml-1">arrow_upward</span> 
      : <span className="material-icons text-primary text-xs ml-1">arrow_downward</span>;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.date) return;
    
    setIsSubmitting(true);

    // Simulate API delay
    setTimeout(() => {
        const newExpense: Expense = {
            id: Math.random().toString(36).substr(2, 9),
            paidBy: formData.paidBy,
            expenseType: formData.expenseType,
            amount: parseFloat(formData.amount),
            date: formData.date,
            notes: formData.notes
        };

        setExpenses(prev => [newExpense, ...prev]);
        setFormData({
            paidBy: PARTNERS[0],
            expenseType: 'Rent',
            amount: '',
            date: new Date().toISOString().split('T')[0],
            notes: ''
        });
        setSuccessMessage('Expense recorded successfully!');
        setIsSubmitting(false);

        setTimeout(() => setSuccessMessage(null), 3000);
    }, 500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-white">Personal Expenses <span className="text-gray-400 font-normal">Tracker</span></h2>
          <p className="mt-1 text-sm text-gray-400">Manage shared business expenses and track partner contributions.</p>
        </div>
        <div className="flex items-center space-x-2">
           <span className="material-icons text-gray-500">date_range</span>
           <span className="text-sm text-gray-400">Oct 2023 - Nov 2023</span>
        </div>
      </div>

      {/* Partners Dashboard - Top Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {PARTNERS.map((partner) => (
            <div key={partner} className="bg-background-surface border border-gray-800 rounded-lg p-6 flex flex-col justify-between hover:border-primary/40 transition-colors duration-300">
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-white text-center mb-4 pb-2 border-b border-gray-800">{partner}</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-400">
                            <span>Rent</span>
                            <span className="text-gray-200">₹{partnerStats[partner].breakdown['Rent'].toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-400">
                            <span>Light Bill</span>
                            <span className="text-gray-200">₹{partnerStats[partner].breakdown['Light Bill'].toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-400">
                            <span>Other</span>
                            <span className="text-gray-200">₹{partnerStats[partner].breakdown['Other'].toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                <div className="mt-2 pt-4 border-t border-gray-800 flex justify-between items-end">
                     <span className="text-xs font-medium text-primary uppercase tracking-wider">Total Paid</span>
                     <span className="text-2xl font-bold text-primary">₹{partnerStats[partner].total.toLocaleString()}</span>
                </div>
            </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Side: Expense Entry Form */}
        <div className="w-full lg:w-1/3">
          <div className="bg-background-surface border border-gray-800 rounded-lg p-6 sticky top-24 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-white">Record Expense</h3>
              <span className="material-icons text-primary/80">receipt_long</span>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Paid By</label>
                <select 
                    value={formData.paidBy}
                    onChange={(e) => setFormData({...formData, paidBy: e.target.value})}
                    className="block w-full bg-[#121212] border border-gray-700 rounded-md py-3 px-4 text-gray-200 focus:ring-primary focus:border-primary sm:text-sm"
                >
                    {PARTNERS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1">Expense Type</label>
                <select 
                    value={formData.expenseType}
                    onChange={(e) => setFormData({...formData, expenseType: e.target.value as any})}
                    className="block w-full bg-[#121212] border border-gray-700 rounded-md py-3 px-4 text-gray-200 focus:ring-primary focus:border-primary sm:text-sm"
                >
                    {EXPENSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-primary mb-1">Amount (₹)</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="block w-full bg-[#121212] border border-gray-700 rounded-md py-3 px-4 text-gray-200 placeholder-gray-600 focus:ring-primary focus:border-primary sm:text-sm" 
                    placeholder="0.00" 
                  />
                </div>
              </div>

              <div>
                 <label className="block text-sm font-medium text-primary mb-1">Date</label>
                 <input 
                    type="date" 
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="block w-full bg-[#121212] border border-gray-700 rounded-md py-3 px-4 text-gray-200 placeholder-gray-600 focus:ring-primary focus:border-primary sm:text-sm" 
                 />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1">Notes <span className="text-gray-500 font-normal text-xs">(Optional)</span></label>
                <textarea 
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="block w-full bg-[#121212] border border-gray-700 rounded-md py-3 px-4 text-gray-200 placeholder-gray-600 focus:ring-primary focus:border-primary sm:text-sm" 
                    placeholder="Details about the expense..." 
                />
              </div>

              <div className="pt-2">
                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold py-3 px-4 rounded shadow-lg transition-all duration-300 uppercase tracking-wide text-sm disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                >
                    {isSubmitting ? (
                        <span className="material-icons animate-spin mr-2">refresh</span>
                    ) : (
                        <span className="material-icons text-lg mr-2">add</span>
                    )}
                    {isSubmitting ? 'Saving...' : 'Add Expense'}
                </button>
              </div>
              {successMessage && (
                  <div className="mt-2 text-green-400 text-sm text-center flex items-center justify-center bg-green-900/20 py-2 rounded border border-green-800">
                      <span className="material-icons text-sm mr-1">check_circle</span> {successMessage}
                  </div>
              )}
            </form>
          </div>
        </div>

        {/* Right Side: Expense Records Table */}
        <div className="w-full lg:w-2/3">
          <div className="bg-background-surface border border-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <h3 className="text-lg font-medium text-white">Expense Records</h3>
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-icons text-gray-500 text-sm">search</span>
                </div>
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 bg-[#121212] border border-gray-700 rounded-md py-2 text-gray-200 placeholder-gray-600 focus:ring-primary focus:border-primary sm:text-sm" 
                    placeholder="Search records..." 
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-800">
                <thead>
                  <tr className="bg-[#121212]">
                    <th onClick={() => requestSort('date')} className="group px-6 py-3 text-left text-xs font-bold text-primary uppercase tracking-wider cursor-pointer hover:bg-gray-800 select-none">
                      <div className="flex items-center whitespace-nowrap">Date {getSortIcon('date')}</div>
                    </th>
                    <th onClick={() => requestSort('paidBy')} className="group px-6 py-3 text-left text-xs font-bold text-primary uppercase tracking-wider cursor-pointer hover:bg-gray-800 select-none">
                      <div className="flex items-center whitespace-nowrap">Paid By {getSortIcon('paidBy')}</div>
                    </th>
                    <th onClick={() => requestSort('expenseType')} className="group px-6 py-3 text-left text-xs font-bold text-primary uppercase tracking-wider cursor-pointer hover:bg-gray-800 select-none">
                      <div className="flex items-center whitespace-nowrap">Type {getSortIcon('expenseType')}</div>
                    </th>
                    <th onClick={() => requestSort('amount')} className="group px-6 py-3 text-right text-xs font-bold text-primary uppercase tracking-wider cursor-pointer hover:bg-gray-800 select-none">
                      <div className="flex items-center justify-end whitespace-nowrap">Amount {getSortIcon('amount')}</div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-primary uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-background-surface divide-y divide-gray-800">
                  {sortedExpenses.map((item) => (
                    <tr key={item.id} className="hover:bg-[#252525] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{item.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{item.paidBy}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-md border 
                            ${item.expenseType === 'Rent' ? 'bg-purple-900/20 text-purple-400 border-purple-800' : 
                              item.expenseType === 'Light Bill' ? 'bg-yellow-900/20 text-yellow-500 border-yellow-800' : 
                              'bg-gray-800 text-gray-300 border-gray-700'}`}>
                            {item.expenseType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-primary font-bold">
                        ₹{item.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400 max-w-xs truncate" title={item.notes}>
                        {item.notes || '-'}
                      </td>
                    </tr>
                  ))}
                  {sortedExpenses.length === 0 && (
                      <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">
                              No expenses found matching your criteria.
                          </td>
                      </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="bg-[#121212] px-4 py-3 flex items-center justify-between border-t border-gray-800 sm:px-6 mt-auto">
                <p className="text-sm text-gray-400">
                    Showing <span className="font-medium text-primary">{sortedExpenses.length}</span> results
                </p>
                {/* Pagination placeholder as per UI requirements */}
                 <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                     <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-700 bg-background-surface text-sm font-medium text-gray-400 hover:bg-gray-800 disabled:opacity-50">
                        <span className="material-icons text-xs">chevron_left</span>
                     </button>
                     <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-700 bg-background-surface text-sm font-medium text-gray-400 hover:bg-gray-800 disabled:opacity-50">
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

export default PersonalExpenses;