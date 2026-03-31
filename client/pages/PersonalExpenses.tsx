import React, { useState, useMemo, useEffect } from 'react';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument } from '../services/firestore';
import { Link } from 'react-router-dom';
import ScrollableTable from '../components/ScrollableTable';

interface Expense {
  id: string;
  paidBy: string;
  expenseType: string;
  amount: number;
  date: string;
  notes: string;
  createdAt: string;
}

const EXPENSE_TYPES = ['Rent', 'Light Bill', 'Other'] as const;

const PersonalExpenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [partners, setPartners] = useState<string[]>(['Partner 1', 'Partner 2', 'Partner 3', 'Partner 4']);
  const [partnerDetails, setPartnerDetails] = useState<Record<string, { phone: string; email: string }>>({});
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  // For dropdowns, we append 'Other'
  const dropdownPartners = useMemo(() => [...partners, 'Other'], [partners]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Expense; direction: 'asc' | 'desc' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // View State
  const [activeTab, setActiveTab] = useState<'overview' | 'records'>('overview');
  const [timeFilter, setTimeFilter] = useState<'all' | '7days' | '30days' | 'thisMonth'>('all');

  // Form State
  const [formData, setFormData] = useState<{
    paidBy: string;
    expenseType: typeof EXPENSE_TYPES[number];
    amount: string;
    date: string;
    notes: string;
  }>({
    paidBy: '', // Set on load
    expenseType: 'Rent',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const unsubExpenses = subscribeToCollection('expenses', (data) => {
      const mappedExpenses = data.map((e: any) => ({
        id: e.id,
        paidBy: e.partnerName || e.paidBy || '',
        expenseType: e.type || e.expenseType || 'Other',
        amount: parseFloat(e.amount) || 0,
        date: e.date || new Date().toISOString().split('T')[0],
        notes: e.notes || '',
        createdAt: e.createdAt || new Date(0).toISOString()
      }));
      mappedExpenses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setExpenses(mappedExpenses);
      setLoading(false);
    });

    const unsubSettings = subscribeToCollection('settings', (data) => {
      const partnerDoc = data.find(d => d.id === 'partners');
      const partnersList = partnerDoc?.list || ['Partner 1', 'Partner 2', 'Partner 3', 'Partner 4'];
      setPartners(partnersList);
      setPartnerDetails(partnerDoc?.details || {});
      if (partnersList.length > 0) {
        setFormData(prev => ({ ...prev, paidBy: prev.paidBy || partnersList[0] }));
      }
    });

    return () => {
      unsubExpenses();
      unsubSettings();
    };
  }, []);

  const toggleFlip = (partner: string) => {
    setFlippedCards(prev => ({
      ...prev,
      [partner]: !prev[partner]
    }));
  };

  const getFilteredExpenses = () => {
    if (timeFilter === 'all') return expenses;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return expenses.filter(expense => {
      const expDate = new Date(expense.date);
      if (timeFilter === '7days') {
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        return expDate >= sevenDaysAgo;
      }
      if (timeFilter === '30days') {
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        return expDate >= thirtyDaysAgo;
      }
      if (timeFilter === 'thisMonth') {
        return expDate.getMonth() === today.getMonth() && expDate.getFullYear() === today.getFullYear();
      }
      return true;
    });
  };

  const filteredExpenses = useMemo(() => getFilteredExpenses(), [expenses, timeFilter]);

  // Stats Calculation
  const partnerStats = useMemo(() => {
    const stats: Record<string, { total: number; breakdown: Record<string, number> }> = {};

    // Initialize for known partners (excluding 'Other' from overview cards)
    partners.forEach(partner => {
      stats[partner] = { total: 0, breakdown: { 'Rent': 0, 'Light Bill': 0, 'Other': 0 } };
    });

    filteredExpenses.forEach(expense => {
      if (!stats[expense.paidBy]) {
        // Handle unknown partners dynamically if data differs
        stats[expense.paidBy] = { total: 0, breakdown: { 'Rent': 0, 'Light Bill': 0, 'Other': 0 } };
      }
      stats[expense.paidBy].total += expense.amount;
      // Handle unknown types safely
      if (stats[expense.paidBy].breakdown[expense.expenseType] !== undefined) {
        stats[expense.paidBy].breakdown[expense.expenseType] += expense.amount;
      } else {
        stats[expense.paidBy].breakdown['Other'] += expense.amount;
      }
    });

    return stats;
  }, [filteredExpenses, partners]);

  const sortedExpenses = useMemo(() => {
    let sortableItems = [...filteredExpenses];

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
  }, [filteredExpenses, sortConfig, searchTerm]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.date) return;

    setIsSubmitting(true);

    try {
      const payload = {
        partnerName: formData.paidBy,
        type: formData.expenseType,
        amount: parseFloat(formData.amount),
        date: formData.date,
        notes: formData.notes
      };

      if (editingId) {
        await updateDocument('expenses', editingId, payload);
        setSuccessMessage('Expense updated successfully!');
      } else {
        await addDocument('expenses', payload);
        setSuccessMessage('Expense recorded successfully!');
      }

      setFormData({
        paidBy: partners[0] || '',
        expenseType: 'Rent',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      setEditingId(null);


      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error(`Failed to ${editingId ? 'update' : 'save'} expense`, error);
      alert(`Failed to ${editingId ? 'update' : 'save'} expense.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (expense: Expense) => {
    setFormData({
      paidBy: expense.paidBy,
      expenseType: expense.expenseType as any,
      amount: expense.amount.toString(),
      date: expense.date,
      notes: expense.notes
    });
    setEditingId(expense.id);
    setActiveTab('records');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) return;

    try {
      await deleteDocument('expenses', id);
    } catch (error) {
      console.error("Failed to delete expense", error);
      alert("Failed to delete expense.");
    }
  };

  if (loading) return <div className="text-foreground p-8">Loading Expenses...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="flex items-center justify-between mb-8 animate-fade-in-up" style={{ animationFillMode: 'both', animationDelay: '0ms' }}>
        <div>
          <h2 className="text-2xl font-bold leading-7 text-foreground">Personal Expenses <span className="text-muted font-normal">Tracker</span></h2>
          <p className="mt-1 text-sm text-muted">Manage shared business expenses and track partner contributions.</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="material-icons text-muted">date_range</span>
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as any)}
            className="bg-background-base border border-border-color text-foreground text-sm rounded focus:ring-primary focus:border-primary px-2 py-1"
          >
            <option value="all">All Time</option>
            <option value="7days">Past 7 Days</option>
            <option value="30days">Past 30 Days</option>
            <option value="thisMonth">This Month</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border-color mb-8 animate-fade-in-up" style={{ animationFillMode: 'both', animationDelay: '100ms' }}>
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'overview'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted hover:text-foreground-muted hover:border-gray-600'
              }`}
          >
            <span className="flex items-center">
              <span className="material-icons text-[18px] mr-2">dashboard</span> Partner Overview
            </span>
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'records'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted hover:text-foreground-muted hover:border-gray-600'
              }`}
          >
            <span className="flex items-center">
              <span className="material-icons text-[18px] mr-2">list_alt</span> Expense Records
            </span>
          </button>
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="mb-8 animate-slide-up-fade" style={{ animationFillMode: 'both', animationDelay: '200ms' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {partners.map((partner, index) => (
              <div
                key={partner}
                className="relative w-full cursor-pointer group animate-slide-up-fade perspective-1000"
                onClick={() => toggleFlip(partner)}
                style={{
                  height: '280px',
                  perspective: '1000px',
                  animationDelay: `${index * 100 + 300}ms`
                }}
              >
                <div
                  className="w-full h-full duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] transition-transform relative"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: flippedCards[partner] ? 'rotateY(180deg)' : 'rotateY(0deg)'
                  }}
                >
                  {/* Front side (Now Contact Info) */}
                  <div
                    className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#1c1c1c] to-[#121212] border border-border-color rounded-lg p-6 flex flex-col items-center justify-center shadow-lg text-center overflow-hidden hover:border-primary/40 transition-colors duration-300"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <div className="absolute top-3 right-3 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:text-primary">
                      <span className="material-icons text-sm animate-pulse cursor-help" title="Click to view financial breakdown">360</span>
                    </div>

                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl flex-shrink-0 transition-opacity duration-300 group-hover:bg-primary/10"></div>
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl flex-shrink-0 transition-opacity duration-300 group-hover:bg-primary/10"></div>

                    <div className="w-14 h-14 rounded-full bg-background-surface flex items-center justify-center mb-3 border border-border-color shadow-inner z-10 flex-shrink-0 transition-colors duration-300 group-hover:border-primary/30 group-hover:bg-primary/5">
                      <span className="material-icons text-primary/80 text-2xl group-hover:text-primary transition-colors">badge</span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-5 z-10">{partner}</h3>

                    <div className="w-full space-y-3 z-10 px-1">
                      <div className="flex items-center text-sm bg-background-base/40 py-2 px-3 rounded border border-border-color overflow-hidden transition-colors duration-200 group-hover:border-border-color">
                        <span className="material-icons text-primary/60 text-[18px] mr-3 shrink-0">phone</span>
                        <span className={`font-medium truncate ${partnerDetails[partner]?.phone ? 'text-foreground' : 'text-gray-600 italic'}`}>
                          {partnerDetails[partner]?.phone || 'No Phone Added'}
                        </span>
                      </div>

                      <div className="flex items-center text-sm bg-background-base/40 py-2 px-3 rounded border border-border-color overflow-hidden transition-colors duration-200 group-hover:border-border-color">
                        <span className="material-icons text-primary/60 text-[18px] mr-3 shrink-0">email</span>
                        <span className={`font-medium truncate ${partnerDetails[partner]?.email ? 'text-foreground' : 'text-gray-600 italic'}`} title={partnerDetails[partner]?.email || ''}>
                          {partnerDetails[partner]?.email || 'No Email Added'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Back side (Now Financial Breakdown) */}
                  <div
                    className="absolute inset-0 w-full h-full bg-background-surface border border-border-color rounded-lg p-6 flex flex-col justify-between shadow-2xl hover:border-primary/40 transition-colors duration-300 flex-shrink-0"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                  >
                    <div className="absolute top-3 right-3 text-muted z-20 cursor-help" title="Click to return to contact details">
                      <span className="material-icons text-sm animate-pulse">360</span>
                    </div>
                    <div className="mb-4 relative z-10">
                      <h3 className="text-lg font-bold text-foreground text-center mb-4 pb-2 border-b border-border-color">Financial Breakdown</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-muted">
                          <span>Rent</span>
                          <span className="text-foreground">₹{(partnerStats[partner]?.breakdown['Rent'] || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted">
                          <span>Light Bill</span>
                          <span className="text-foreground">₹{(partnerStats[partner]?.breakdown['Light Bill'] || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted">
                          <span>Other</span>
                          <span className="text-foreground">₹{(partnerStats[partner]?.breakdown['Other'] || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 pt-4 border-t border-border-color flex justify-between items-end relative z-10">
                      <span className="text-xs font-medium text-primary uppercase tracking-wider">Total Paid</span>
                      <span className="text-2xl font-bold text-primary">₹{(partnerStats[partner]?.total || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'records' && (
        <div className="flex flex-col lg:flex-row gap-8 animate-slide-up-fade" style={{ animationFillMode: 'both', animationDelay: '200ms' }}>
          {/* Left Side: Expense Entry Form */}
          <div className="w-full lg:w-1/3">
            <div className="bg-background-surface border border-border-color rounded-lg p-6 sticky top-24 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-foreground">
                  {editingId ? 'Edit Expense' : 'Record Expense'}
                </h3>
                <span className="material-icons text-primary/80">
                  {editingId ? 'edit' : 'receipt_long'}
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">Paid By</label>
                  <select
                    value={formData.paidBy}
                    onChange={(e) => setFormData({ ...formData, paidBy: e.target.value })}
                    className="block w-full bg-background-base border border-border-color rounded-md py-3 px-4 text-foreground focus:ring-primary focus:border-primary sm:text-sm"
                  >
                    {dropdownPartners.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-1">Expense Type</label>
                  <select
                    value={formData.expenseType}
                    onChange={(e) => setFormData({ ...formData, expenseType: e.target.value as any })}
                    className="block w-full bg-background-base border border-border-color rounded-md py-3 px-4 text-foreground focus:ring-primary focus:border-primary sm:text-sm"
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
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="block w-full bg-background-base border border-border-color rounded-md py-3 px-4 text-foreground placeholder-text-muted focus:ring-primary focus:border-primary sm:text-sm"
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
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="block w-full bg-background-base border border-border-color rounded-md py-3 px-4 text-foreground placeholder-text-muted focus:ring-primary focus:border-primary sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-1">Notes <span className="text-muted font-normal text-xs">(Optional)</span></label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="block w-full bg-background-base border border-border-color rounded-md py-3 px-4 text-foreground placeholder-text-muted focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="Details about the expense..."
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold py-3 px-4 rounded shadow-lg transition-all duration-300 uppercase tracking-wide text-sm disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                  >
                    {isSubmitting ? (
                      <span className="material-icons animate-spin mr-2">refresh</span>
                    ) : (
                      <span className="material-icons text-lg mr-2">{editingId ? 'save' : 'add'}</span>
                    )}
                    {isSubmitting ? 'Saving...' : (editingId ? 'Update Expense' : 'Add Expense')}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setFormData({
                          paidBy: partners[0] || '',
                          expenseType: 'Rent',
                          amount: '',
                          date: new Date().toISOString().split('T')[0],
                          notes: ''
                        });
                      }}
                      disabled={isSubmitting}
                      className="bg-background-surface hover:bg-[#252525] border border-border-color text-foreground font-bold py-3 px-4 rounded shadow-lg transition-all duration-300 uppercase tracking-wide text-sm disabled:opacity-50 flex justify-center items-center"
                    >
                      <span className="material-icons text-lg mr-2">close</span>
                      Cancel
                    </button>
                  )}
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
            <div className="bg-background-surface border border-border-color rounded-lg shadow-lg overflow-hidden flex flex-col h-full">
              <div className="p-4 border-b border-border-color flex flex-col sm:flex-row items-center justify-between gap-4">
                <h3 className="text-lg font-medium text-foreground">Expense Records</h3>
                <div className="relative w-full sm:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-icons text-muted text-sm">search</span>
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 bg-background-base border border-border-color rounded-md py-2 text-foreground placeholder-text-muted focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="Search records..."
                  />
                </div>
              </div>

              <ScrollableTable>
                <table className="min-w-full divide-y divide-gray-800 whitespace-nowrap">
                  <thead>
                    <tr className="bg-background-base">
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
                      <th className="group px-6 py-3 text-right text-xs font-bold text-primary uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-background-surface divide-y divide-gray-800">
                    {sortedExpenses.map((item, index) => (
                      <tr key={item.id} className="animate-slide-up-fade premium-hover hover:bg-primary/5 hover:border-l-2 hover:border-primary transition-all group" style={{ animationDelay: `${index * 50}ms` }}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">{item.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-foreground">{item.paidBy}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-md border 
                                ${item.expenseType === 'Rent' ? 'bg-purple-900/20 text-purple-400 border-purple-800' :
                              item.expenseType === 'Light Bill' ? 'bg-yellow-900/20 text-yellow-500 border-yellow-800' :
                                'bg-gray-800 text-foreground-muted border-border-color'}`}>
                            {item.expenseType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-primary font-bold">
                          ₹{item.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted max-w-xs truncate" title={item.notes}>
                          {item.notes || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditClick(item)}
                            className="text-primary hover:text-foreground transition-colors mr-3"
                            title="Edit"
                          >
                            <span className="material-icons text-[18px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteClick(item.id)}
                            className="text-red-500 hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <span className="material-icons text-[18px]">delete_outline</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {sortedExpenses.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-muted text-sm">
                          No expenses found matching your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </ScrollableTable>

              <div className="bg-background-base px-4 py-3 flex items-center justify-between border-t border-border-color sm:px-6 mt-auto">
                <p className="text-sm text-muted">
                  Showing <span className="font-medium text-primary">{sortedExpenses.length}</span> results
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalExpenses;