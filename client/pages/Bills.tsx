import React, { useState, useMemo, useEffect } from 'react';
import { subscribeToBills, updateBill, deleteBill, downloadPdfInvoice } from '../services/billingService';
import { Bill } from '../types';
import ScrollableTable from '../components/ScrollableTable';

const Bills: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Bill; direction: 'asc' | 'desc' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    amount: '',
    status: 'Pending'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  useEffect(() => {
    const unsubBills = subscribeToBills((data) => {
      const mappedBills = data.map((b) => ({
        ...b,
        createdAt: (b as any).createdAt || new Date(0).toISOString()
      }));
      mappedBills.sort((a, b) => new Date((b as any).createdAt).getTime() - new Date((a as any).createdAt).getTime());
      setBills(mappedBills);
      setLoading(false);
    });

    return () => {
      unsubBills();
    };
  }, []);

  const handleEditClick = (bill: Bill) => {
    setFormData({
      amount: bill.amount.toString(),
      status: bill.status
    });
    setEditingId(bill.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ amount: '', status: 'Pending' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !formData.amount) return;

    setIsSubmitting(true);
    try {
      await updateBill(editingId, {
        amount: parseFloat(formData.amount),
        status: formData.status as 'Pending' | 'Paid'
      });
      handleCancelEdit();
    } catch (error) {
      console.error("Failed to update bill", error);
      alert("Failed to update bill.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this bill?')) return;
    try {
      await deleteBill(id);
    } catch (error) {
      console.error("Failed to delete bill", error);
      alert("Failed to delete bill.");
    }
  };

  const handleDownloadInvoice = async (bill: Bill) => {
    setIsDownloading(bill.id);
    try {
      await downloadPdfInvoice(bill);
    } catch (e) {
        console.error("PDF generation failed", e);
    } finally {
      setIsDownloading(null);
    }
  };

  const sortedBills = useMemo(() => {
    let sortableItems = [...bills];

    // Search
    if (searchTerm) {
      sortableItems = sortableItems.filter(item =>
        item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'date') {
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
    return sortableItems;
  }, [bills, sortConfig, searchTerm]);

  const requestSort = (key: keyof Bill) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (name: keyof Bill) => {
    if (!sortConfig || sortConfig.key !== name) {
      return <span className="material-icons text-gray-600 text-xs ml-1 opacity-0 group-hover:opacity-50 transition-opacity">unfold_more</span>;
    }
    return sortConfig.direction === 'asc'
      ? <span className="material-icons text-primary text-xs ml-1">arrow_upward</span>
      : <span className="material-icons text-primary text-xs ml-1">arrow_downward</span>;
  };

  if (loading) return <div className="text-foreground p-8">Loading Bills...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="flex items-center justify-between mb-8 animate-fade-in-up" style={{ animationFillMode: 'both', animationDelay: '0ms' }}>
        <div>
          <h2 className="text-2xl font-bold leading-7 text-foreground">Billing Module <span className="text-muted font-normal">Invoices</span></h2>
          <p className="mt-1 text-sm text-muted">Auto-generated professional bills from completed orders.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 animate-slide-up-fade" style={{ animationFillMode: 'both', animationDelay: '200ms' }}>
        
        {/* Left Side: Edit Form (Visible only in edit mode) */}
        {editingId && (
          <div className="w-full lg:w-1/3">
            <div className="bg-background-surface border border-border-color rounded-lg p-6 sticky top-24 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-foreground">Edit Bill Parameters</h3>
                <span className="material-icons text-primary/80">edit</span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">Final Amount (₹)</label>
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
                  <p className="text-xs text-muted mt-1">Modifying this does not alter original Order amount.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="block w-full bg-background-base border border-border-color rounded-md py-3 px-4 text-foreground focus:ring-primary focus:border-primary sm:text-sm"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>

                <div className="pt-2 flex flex-col gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold py-3 px-4 rounded shadow-lg transition-all duration-300 uppercase tracking-wide text-sm disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                  >
                    {isSubmitting ? (
                      <span className="material-icons animate-spin mr-2">refresh</span>
                    ) : (
                      <span className="material-icons text-lg mr-2">save</span>
                    )}
                    Update Bill
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={isSubmitting}
                    className="w-full bg-background-surface hover:bg-[#252525] border border-border-color text-foreground font-bold py-3 px-4 rounded shadow-lg transition-all duration-300 uppercase tracking-wide text-sm disabled:opacity-50 flex justify-center items-center"
                  >
                    <span className="material-icons text-lg mr-2">close</span>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Right Side: Bills Table */}
        <div className={`w-full ${editingId ? 'lg:w-2/3' : ''}`}>
          <div className="bg-background-surface border border-border-color rounded-lg shadow-lg overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-border-color flex flex-col sm:flex-row items-center justify-between gap-4">
              <h3 className="text-lg font-medium text-foreground">Generated Invoices</h3>
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-icons text-muted text-sm">search</span>
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 bg-background-base border border-border-color rounded-md py-2 text-foreground placeholder-text-muted focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="Search bills..."
                />
              </div>
            </div>

            <ScrollableTable>
              <table className="min-w-full divide-y divide-gray-800 whitespace-nowrap">
                <thead>
                  <tr className="bg-background-base">
                    <th className="px-6 py-3 text-left text-xs font-bold text-primary uppercase tracking-wider">
                      Invoice ID
                    </th>
                    <th onClick={() => requestSort('date')} className="group px-6 py-3 text-left text-xs font-bold text-primary uppercase tracking-wider cursor-pointer hover:bg-gray-800 select-none">
                      <div className="flex items-center whitespace-nowrap">Date {getSortIcon('date')}</div>
                    </th>
                    <th onClick={() => requestSort('customerName')} className="group px-6 py-3 text-left text-xs font-bold text-primary uppercase tracking-wider cursor-pointer hover:bg-gray-800 select-none">
                      <div className="flex items-center whitespace-nowrap">Customer {getSortIcon('customerName')}</div>
                    </th>
                    <th onClick={() => requestSort('amount')} className="group px-6 py-3 text-right text-xs font-bold text-primary uppercase tracking-wider cursor-pointer hover:bg-gray-800 select-none">
                      <div className="flex items-center justify-end whitespace-nowrap">Amount {getSortIcon('amount')}</div>
                    </th>
                    <th onClick={() => requestSort('status')} className="group px-6 py-3 text-center text-xs font-bold text-primary uppercase tracking-wider cursor-pointer hover:bg-gray-800 select-none">
                      <div className="flex justify-center items-center whitespace-nowrap">Status {getSortIcon('status')}</div>
                    </th>
                    <th className="group px-6 py-3 text-right text-xs font-bold text-primary uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-background-surface divide-y divide-gray-800">
                  {sortedBills.map((item, index) => {
                    const dispId = `INV-${item.id.substring(0, 6).toUpperCase()}`;
                    return (
                    <tr key={item.id} className="animate-slide-up-fade premium-hover hover:bg-primary/5 hover:border-l-2 hover:border-primary transition-all group" style={{ animationDelay: `${index * 50}ms` }}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">
                        {dispId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">{item.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-foreground">{item.customerName}</div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-primary font-bold">
                        ₹{item.amount.toLocaleString()}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-md border 
                              ${item.status === 'Paid' ? 'bg-green-900/20 text-green-400 border-green-800' :
                              'bg-yellow-900/20 text-yellow-500 border-yellow-800'}`}>
                          {item.status}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        
                        <button
                          onClick={() => handleDownloadInvoice(item)}
                          disabled={isDownloading === item.id}
                          className="text-primary hover:text-white transition-colors mr-3 disabled:opacity-50"
                          title="Download Invoice"
                        >
                          {isDownloading === item.id ? (
                            <span className="material-icons animate-spin text-[18px]">refresh</span>
                          ) : (
                            <span className="material-icons text-[18px]">download</span>
                          )}
                        </button>

                        <button
                          onClick={() => handleEditClick(item)}
                          className="text-blue-400 hover:text-white transition-colors mr-3"
                          title="Edit Bill"
                        >
                          <span className="material-icons text-[18px]">edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(item.id)}
                          className="text-red-500 hover:text-red-400 transition-colors"
                          title="Delete Bill"
                        >
                          <span className="material-icons text-[18px]">delete_outline</span>
                        </button>
                      </td>
                    </tr>
                  )})}
                  {sortedBills.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-muted text-sm">
                        No bills found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </ScrollableTable>

            <div className="bg-background-base px-4 py-3 flex items-center justify-between border-t border-border-color sm:px-6 mt-auto">
              <p className="text-sm text-muted">
                Showing <span className="font-medium text-primary">{sortedBills.length}</span> results
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bills;
