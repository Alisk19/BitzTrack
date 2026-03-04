import React, { useState, useMemo, useEffect } from 'react';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument } from '../services/firestore';
import { exportToCSV } from '../utils/exportUtils';

interface Material {
  id: string;
  name: string;
  dealerName: string;
  materialType: string;
  quantity: number;
  unit: string;
  receiveDate: string;
  paymentStatus: string;
  paidBy: string;
  icon?: string;
  unitCost?: number; // Added for completeness with backend
  totalCost?: number;
  materialColor?: string;
}

interface UsageLog {
  id: string;
  materialName: string;
  quantityUsed: number;
  previousQuantity: number;
  newRemainingQuantity: number;
  date: string;
  notes?: string;
}

const RawMaterials: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [partners, setPartners] = useState<string[]>(['Partner 1', 'Partner 2', 'Partner 3', 'Partner 4']);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Material; direction: 'asc' | 'desc' } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'inventory' | 'records' | 'control'>('inventory');
  const [searchTerm, setSearchTerm] = useState('');

  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);
  const [editingUsageId, setEditingUsageId] = useState<string | null>(null);
  const [usageFormData, setUsageFormData] = useState({
    materialName: '',
    quantityUsed: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [usageSearchTerm, setUsageSearchTerm] = useState('');

  // Stats
  const [stats, setStats] = useState({
    totalEntries: 0,
    totalDealers: 0,
    pendingPayments: 0
  });

  const [formData, setFormData] = useState({
    name: '',
    dealerName: '',
    materialType: '',
    quantity: '',
    unit: '',
    unitCost: '',
    receiveDate: '',
    paymentStatus: 'Paid',
    paidBy: '', // Initially empty, will be set when partners load
    notes: '',
    materialColor: ''
  });

  const getIconForType = (type: string) => {
    if (!type) return 'category';
    const t = type.toLowerCase();
    if (t.includes('metal')) return 'grid_view';
    if (t.includes('wire') || t.includes('electric')) return 'cable';
    if (t.includes('chemical') || t.includes('solvent')) return 'water_drop';
    if (t.includes('plastic')) return 'layers';
    return 'category';
  };

  useEffect(() => {
    const unsubMaterials = subscribeToCollection('raw-materials', (data) => {
      const mappedMaterials = data.map((m: any) => ({
        id: m.id,
        name: m.name,
        dealerName: m.dealerName,
        materialType: m.materialType,
        quantity: m.quantity,
        unit: m.unit,
        unitCost: m.unitCost,
        receiveDate: m.receiveDate,
        paymentStatus: m.paymentStatus,
        paidBy: m.paidBy,
        materialColor: m.materialColor || '',
        icon: getIconForType(m.materialType)
      }));
      setMaterials(mappedMaterials);

      // Calc Stats
      const dealers = new Set(mappedMaterials.map((m: any) => m.dealerName)).size;
      const pending = mappedMaterials.filter((m: any) => m.paymentStatus === 'Pending' || m.paymentStatus === 'Unpaid').length;
      setStats({
        totalEntries: mappedMaterials.length,
        totalDealers: dealers,
        pendingPayments: pending
      });
      setLoading(false);
    });

    const unsubSettings = subscribeToCollection('settings', (data) => {
      const partnerDoc = data.find(d => d.id === 'partners');
      const partnersList = partnerDoc?.list || ['Partner 1', 'Partner 2', 'Partner 3', 'Partner 4'];
      setPartners(partnersList);
      if (partnersList.length > 0) {
        setFormData(prev => ({ ...prev, paidBy: prev.paidBy || partnersList[0] }));
      }
    });

    const unsubUsage = subscribeToCollection('material-usage', (data) => {
      const mappedLogs = data.map((u: any) => ({
        id: u.id,
        materialName: u.materialName,
        quantityUsed: u.quantityUsed,
        previousQuantity: u.previousQuantity,
        newRemainingQuantity: u.newRemainingQuantity,
        date: u.date,
        notes: u.notes
      }));
      setUsageLogs(mappedLogs);
    });

    return () => {
      unsubMaterials();
      unsubSettings();
      unsubUsage();
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveMaterial = async () => {
    try {
      const payload = {
        ...formData,
        quantity: parseFloat(formData.quantity) || 0,
        unitCost: parseFloat(formData.unitCost) || 0
      };

      if (editingId) {
        await updateDocument('raw-materials', editingId, payload);
      } else {
        await addDocument('raw-materials', payload);
      }

      setFormData({
        name: '',
        dealerName: '',
        materialType: '',
        quantity: '',
        unit: '',
        unitCost: '',
        receiveDate: '',
        paymentStatus: 'Paid',
        paidBy: partners[0],
        notes: '',
        materialColor: ''
      });
      setEditingId(null);
    } catch (error) {
      console.error("Failed to save material", error);
      alert("Failed to save material.");
    }
  };

  const handleEditClick = (material: Material) => {
    setEditingId(material.id);
    setFormData({
      name: material.name,
      dealerName: material.dealerName,
      materialType: material.materialType,
      quantity: material.quantity.toString(),
      unit: material.unit,
      unitCost: (material.unitCost || 0).toString(),
      receiveDate: material.receiveDate,
      paymentStatus: material.paymentStatus,
      paidBy: material.paidBy || partners[0],
      notes: '',
      materialColor: material.materialColor || ''
    });
    // Scroll to top where the form is
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUseMaterial = async () => {
    try {
      const quantityUsed = parseFloat(usageFormData.quantityUsed) || 0;
      if (quantityUsed <= 0) {
        alert("Please enter a valid quantity.");
        return;
      }
      if (!usageFormData.materialName) {
        alert("Please select a material.");
        return;
      }

      const materialStats = inventoryOverview.find(m => m.name === usageFormData.materialName);
      if (!materialStats) return;

      const oldLog = editingUsageId ? usageLogs.find(u => u.id === editingUsageId) : null;
      const oldQuantity = oldLog && oldLog.materialName === usageFormData.materialName ? Number(oldLog.quantityUsed) : 0;
      const trueAvailable = materialStats.remainingQuantity + oldQuantity;

      if (quantityUsed > trueAvailable) {
        alert(`Cannot use ${quantityUsed} ${materialStats.unit}. Only ${trueAvailable} ${materialStats.unit} available.`);
        return;
      }

      const prevQty = oldLog && oldLog.materialName === usageFormData.materialName ? oldLog.previousQuantity : materialStats.remainingQuantity;

      const payload = {
        materialName: usageFormData.materialName,
        quantityUsed,
        previousQuantity: prevQty,
        newRemainingQuantity: prevQty - quantityUsed,
        date: usageFormData.date,
        notes: usageFormData.notes
      };

      if (editingUsageId) {
        await updateDocument('material-usage', editingUsageId, payload);
      } else {
        await addDocument('material-usage', payload);
      }

      setUsageFormData({
        materialName: '',
        quantityUsed: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      setEditingUsageId(null);
    } catch (error) {
      console.error("Failed to log material usage", error);
      alert("Failed to log material usage.");
    }
  };

  const handleEditUsage = (log: UsageLog) => {
    setEditingUsageId(log.id);
    setUsageFormData({
      materialName: log.materialName,
      quantityUsed: log.quantityUsed.toString(),
      date: log.date,
      notes: log.notes || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteUsage = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this usage log?")) {
      try {
        await deleteDocument('material-usage', id);
      } catch (error) {
        console.error("Error deleting usage log", error);
        alert("Failed to delete the log.");
      }
    }
  };

  const inventoryOverview = useMemo(() => {
    const overviewMap: Record<string, { totalQuantity: number; unit: string; dealers: Set<string>; icon: string; type: string; totalUsed: number; remainingQuantity: number; status: 'Healthy' | 'Low' | 'Critical' }> = {};

    materials.forEach(m => {
      if (!overviewMap[m.name]) {
        overviewMap[m.name] = { totalQuantity: 0, unit: m.unit, dealers: new Set(), icon: m.icon || 'category', type: m.materialType, totalUsed: 0, remainingQuantity: 0, status: 'Healthy' };
      }
      overviewMap[m.name].totalQuantity += Number(m.quantity) || 0;
      overviewMap[m.name].dealers.add(m.dealerName);
    });

    usageLogs.forEach(u => {
      if (overviewMap[u.materialName]) {
        overviewMap[u.materialName].totalUsed += Number(u.quantityUsed) || 0;
      }
    });

    return Object.entries(overviewMap).map(([name, data]) => {
      const remaining = data.totalQuantity - data.totalUsed;
      let status: 'Healthy' | 'Low' | 'Critical' = 'Healthy';
      // Low: <= 20% of total. Critical: <= 5% or 0
      if (remaining <= data.totalQuantity * 0.05) status = 'Critical';
      else if (remaining <= data.totalQuantity * 0.2) status = 'Low';

      return {
        name,
        totalQuantity: data.totalQuantity,
        totalUsed: data.totalUsed,
        remainingQuantity: remaining,
        status,
        unit: data.unit,
        dealerCount: data.dealers.size,
        dealersArray: Array.from(data.dealers),
        icon: data.icon,
        type: data.type
      };
    }).sort((a, b) => b.totalQuantity - a.totalQuantity);
  }, [materials, usageLogs]);

  const sortedMaterials = useMemo(() => {
    let processableItems = [...materials];

    // Search filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      processableItems = processableItems.filter(m =>
        m.name.toLowerCase().includes(lowerSearch) ||
        m.dealerName.toLowerCase().includes(lowerSearch) ||
        m.materialType.toLowerCase().includes(lowerSearch)
      );
    }

    if (sortConfig !== null) {
      processableItems.sort((a, b) => {
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
    return processableItems;
  }, [materials, sortConfig, searchTerm]);

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

  if (loading) return <div className="text-foreground p-8">Loading Inventory...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8 animate-slide-up-fade" style={{ animationFillMode: 'both', animationDelay: '0ms' }}>
        <div>
          <h2 className="text-2xl font-bold leading-7 text-foreground">Raw Materials <span className="text-muted font-normal">Inventory</span></h2>
          <p className="mt-1 text-sm text-muted">Manage your incoming stock, dealers, and payments.</p>
        </div>
        <button
          onClick={() => exportToCSV('raw_materials_inventory', sortedMaterials)}
          className="hidden sm:inline-flex items-center px-4 py-2 border border-border-color rounded-md shadow-sm text-sm font-medium text-foreground bg-background-surface hover:bg-[#2a2a2a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-primary"
        >
          <span className="material-icons mr-2 text-lg">download</span>
          Export CSV
        </button>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-background-surface border border-border-color rounded-lg p-6 animate-slide-up-fade" style={{ animationFillMode: 'both', animationDelay: '100ms' }}>
          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1">Total Entries</p>
          <div className="flex items-center">
            <span className="text-3xl font-bold text-foreground mr-3">{stats.totalEntries}</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary text-black">
              Live
            </span>
          </div>
        </div>
        <div className="bg-background-surface border border-border-color rounded-lg p-6 animate-slide-up-fade" style={{ animationFillMode: 'both', animationDelay: '200ms' }}>
          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1">Total Dealers</p>
          <div className="flex items-center">
            <span className="text-3xl font-bold text-primary">{stats.totalDealers}</span>
          </div>
        </div>
        <div className="bg-background-surface border border-border-color rounded-lg p-6 animate-slide-up-fade" style={{ animationFillMode: 'both', animationDelay: '300ms' }}>
          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1">Pending Payments</p>
          <div className="flex items-center">
            <span className="text-2xl font-bold text-foreground">{stats.pendingPayments}</span>
            {stats.pendingPayments > 0 &&
              <span className="ml-2 text-xs text-red-400 flex items-center"><span className="material-icons text-sm mr-1">warning</span> Action Needed</span>
            }
          </div>
        </div>
      </div>

      <div className="border-b border-border-color mb-8 animate-slide-up-fade" style={{ animationFillMode: 'both', animationDelay: '400ms' }}>
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'inventory'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted hover:text-foreground-muted hover:border-gray-600'
              }`}
          >
            <span className="flex items-center">
              <span className="material-icons text-[18px] mr-2">inventory_2</span> Inventory Stock
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
              <span className="material-icons text-[18px] mr-2">receipt_long</span> Material Records
            </span>
          </button>
          <button
            onClick={() => setActiveTab('control')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'control'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted hover:text-foreground-muted hover:border-gray-600'
              }`}
          >
            <span className="flex items-center">
              <span className="material-icons text-[18px] mr-2">precision_manufacturing</span> Inventory Control
            </span>
          </button>
        </nav>
      </div>

      {/* Inventory Overview Component */}
      {activeTab === 'inventory' && (
        <div className="mb-8 animate-slide-up-fade" style={{ animationFillMode: 'both', animationDelay: '500ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-foreground flex items-center"><span className="material-icons text-primary mr-2">inventory_2</span> Current Inventory Stock</h3>
            <span className="text-xs text-muted bg-gray-800 px-2 py-1 rounded">Auto-calculated from history</span>
          </div>

          {inventoryOverview.length === 0 ? (
            <div className="bg-background-base border border-border-color rounded-lg p-8 text-center">
              <span className="material-icons text-gray-600 text-4xl mb-2">inbox</span>
              <p className="text-muted">No inventory data available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {inventoryOverview.map((item, idx) => (
                <div key={idx} className="bg-[#181818] border border-border-color rounded-lg p-5 hover:border-primary/50 transition-colors relative overflow-hidden group">
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent rounded-full -z-0"></div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div className="h-10 w-10 bg-primary/10 rounded border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                        <span className="material-icons">{item.icon}</span>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded border shadow-sm transition-all duration-300
                        ${item.status === 'Critical' ? 'bg-red-900/20 text-red-500 border-red-800 animate-critical-pulse' :
                          item.status === 'Low' ? 'bg-yellow-900/20 text-yellow-500 border-yellow-800 animate-warning-pulse' :
                            'bg-green-900/20 text-green-500 border-green-800 shadow-[0_0_10px_rgba(34,197,94,0.2)]'}`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="flex items-center text-xs font-semibold bg-[#252525] text-foreground-muted px-2 py-1 rounded border border-border-color w-fit mb-2">
                      {item.type}
                    </div>
                    <h4 className="text-foreground font-bold text-lg mb-1 truncate" title={item.name}>{item.name}</h4>
                    <div className="flex items-end gap-1 mb-4">
                      <span className={`text-3xl font-extrabold leading-none ${item.status === 'Critical' ? 'text-red-400' : item.status === 'Low' ? 'text-yellow-400' : 'text-green-400'}`}>
                        {item.remainingQuantity.toLocaleString()}
                      </span>
                      <span className="text-muted text-sm font-medium mb-1">{item.unit} available</span>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border-color/50 flex items-center text-xs text-muted">
                      <span className="material-icons text-[14px] mr-1 text-muted">local_shipping</span>
                      From {item.dealerCount} {item.dealerCount === 1 ? 'dealer' : 'dealers'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'records' && (
        <div className="flex flex-col lg:flex-row gap-8 animate-slide-up-fade" style={{ animationFillMode: 'both', animationDelay: '500ms' }}>
          {/* Left Side: Add Material Form */}
          <div className="w-full lg:w-1/3">
            <div className="bg-background-surface border border-border-color rounded-lg p-6 sticky top-24 shadow-lg border-t-2 border-t-primary">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-foreground">
                  {editingId ? 'Edit Material Record' : 'Add Material'}
                </h3>
                <div className="flex space-x-2">
                  {editingId && (
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setFormData({
                          name: '', dealerName: '', materialType: '', quantity: '', unit: '', unitCost: '',
                          receiveDate: '', paymentStatus: 'Paid', paidBy: partners[0], notes: '', materialColor: ''
                        });
                      }}
                      className="text-muted hover:text-foreground"
                      title="Cancel Edit"
                    >
                      <span className="material-icons">close</span>
                    </button>
                  )}
                  {!editingId && (
                    <button className="text-primary hover:text-primary-hover">
                      <span className="material-icons">add_circle</span>
                    </button>
                  )}
                </div>
              </div>

              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSaveMaterial(); }}>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">Material Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="block w-full bg-background-base border border-border-color rounded-md py-3 px-4 text-foreground placeholder-text-muted focus:ring-primary focus:border-primary sm:text-sm" placeholder="e.g. Steel Sheets Grade A" required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-1">Dealer Name</label>
                  <input type="text" name="dealerName" value={formData.dealerName} onChange={handleInputChange} className="block w-full bg-background-base border border-border-color rounded-md py-3 px-4 text-foreground placeholder-text-muted focus:ring-primary focus:border-primary sm:text-sm" placeholder="e.g. MetalCorp Industries" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1 border-r border-border-color pr-4">
                    <label className="block text-sm font-medium text-primary mb-1">Material Type</label>
                    <input type="text" name="materialType" value={formData.materialType} onChange={handleInputChange} className="block w-full bg-background-base border border-border-color rounded-md py-3 px-4 text-foreground placeholder-text-muted focus:ring-primary focus:border-primary sm:text-sm" placeholder="e.g. Metal" />
                  </div>
                  <div className="col-span-2 sm:col-span-1 pl-4">
                    <label className="block text-sm font-medium text-primary mb-1">Material Color</label>
                    <input type="text" name="materialColor" value={formData.materialColor} onChange={handleInputChange} className="block w-full bg-background-base border border-border-color rounded-md py-3 px-4 text-foreground placeholder-text-muted focus:ring-primary focus:border-primary sm:text-sm" placeholder="e.g. Red, Black" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-primary mb-1">Receive Date</label>
                    <input type="date" name="receiveDate" value={formData.receiveDate} onChange={handleInputChange} className="block w-full bg-background-base border border-border-color rounded-md py-3 px-4 text-foreground placeholder-text-muted focus:ring-primary focus:border-primary sm:text-sm" style={{ colorScheme: 'dark' }} />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    {/* Placeholder for future if needed */}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1">Quantity</label>
                    <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} className="block w-full bg-background-base border border-border-color rounded-md py-3 px-4 text-foreground placeholder-text-muted focus:ring-primary focus:border-primary sm:text-sm" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1">Unit</label>
                    <input type="text" name="unit" value={formData.unit} onChange={handleInputChange} className="block w-full bg-background-base border border-border-color rounded-md py-3 px-4 text-foreground placeholder-text-muted focus:ring-primary focus:border-primary sm:text-sm" placeholder="e.g. Kg" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-primary mb-1">Payment Status</label>
                    <select
                      name="paymentStatus"
                      value={formData.paymentStatus}
                      onChange={handleInputChange}
                      className="block w-full bg-background-base border border-border-color rounded-md py-3 px-4 text-foreground focus:ring-primary focus:border-primary sm:text-sm"
                    >
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending</option>
                      <option value="Unpaid">Unpaid</option>
                    </select>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-primary mb-1">Paid By</label>
                    {formData.paymentStatus === 'Paid' ? (
                      <select name="paidBy" value={formData.paidBy} onChange={handleInputChange} className="block w-full bg-background-base border border-border-color rounded-md py-3 px-4 text-foreground focus:ring-primary focus:border-primary sm:text-sm">
                        {partners.map(partner => (
                          <option key={partner} value={partner}>{partner}</option>
                        ))}
                      </select>
                    ) : (
                      <input type="text" disabled value="-" className="block w-full bg-[#181818] border border-border-color rounded-md py-3 px-4 text-muted cursor-not-allowed sm:text-sm" />
                    )}
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <button type="submit" className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold py-3 px-4 rounded shadow-lg transition-all duration-300 uppercase tracking-wide text-sm">
                    {editingId ? 'Update Record' : 'Log Material'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Side: Entry History Table */}
          <div className="w-full lg:w-2/3">
            <div className="bg-background-surface border border-border-color rounded-lg shadow-lg overflow-hidden flex flex-col h-full">
              <div className="p-4 border-b border-border-color flex flex-col sm:flex-row items-center justify-between gap-4">
                <h3 className="text-lg font-medium text-foreground">Entry History</h3>
                <div className="relative w-full sm:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-icons text-muted text-sm">search</span>
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 bg-background-base border border-border-color rounded-md py-2 text-foreground placeholder-text-muted focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="Search materials..."
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-800">
                  <thead>
                    <tr className="bg-background-base">
                      <th onClick={() => requestSort('name')} className="group px-6 py-3 text-left text-xs font-bold text-primary uppercase tracking-wider cursor-pointer hover:bg-gray-800 select-none">
                        <div className="flex items-center whitespace-nowrap">Material Name {getSortIcon('name')}</div>
                      </th>
                      <th onClick={() => requestSort('dealerName')} className="group px-6 py-3 text-left text-xs font-bold text-primary uppercase tracking-wider cursor-pointer hover:bg-gray-800 select-none">
                        <div className="flex items-center whitespace-nowrap">Dealer Name {getSortIcon('dealerName')}</div>
                      </th>
                      <th onClick={() => requestSort('materialType')} className="group px-6 py-3 text-left text-xs font-bold text-primary uppercase tracking-wider cursor-pointer hover:bg-gray-800 select-none">
                        <div className="flex items-center whitespace-nowrap">Type {getSortIcon('materialType')}</div>
                      </th>
                      <th onClick={() => requestSort('materialColor')} className="group px-6 py-3 text-left text-xs font-bold text-primary uppercase tracking-wider cursor-pointer hover:bg-gray-800 select-none">
                        <div className="flex items-center whitespace-nowrap">Color {getSortIcon('materialColor')}</div>
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
                            <div className="flex-shrink-0 h-8 w-8 bg-gray-700/50 rounded-md flex items-center justify-center text-primary/80 border border-border-color mr-3">
                              <span className="material-icons text-sm">{item.icon || 'category'}</span>
                            </div>
                            <div className="text-sm font-medium text-foreground">{item.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground-muted">{item.dealerName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-800 text-foreground-muted border border-border-color">
                            {item.materialType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                          {item.materialColor || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <span className="text-primary font-medium">{item.quantity}</span> <span className="text-muted text-xs">{item.unit}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">{item.receiveDate}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-md border 
                            ${item.paymentStatus === 'Paid' ? 'bg-green-900/20 text-green-400 border-green-800' :
                              item.paymentStatus === 'Pending' ? 'bg-yellow-900/20 text-yellow-500 border-yellow-800' :
                                'bg-red-900/20 text-red-400 border-red-800'}`}>
                            {item.paymentStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">{item.paidBy}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button onClick={() => handleEditClick(item)} className="text-muted hover:text-primary transition-colors p-1" title="Edit Record">
                            <span className="material-icons text-sm">edit</span>
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
      )}

      {activeTab === 'control' && (
        <div className="flex flex-col gap-8 animate-fade-in-up" style={{ animationFillMode: 'both', animationDelay: '500ms' }}>
          {/* Top dual-pane section */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Panel: Usage Logging Form */}
            <div className="w-full lg:w-1/3">
              <div className="bg-background-surface border border-border-color rounded-lg p-6 shadow-lg border-t-2 border-t-primary">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-foreground flex items-center">
                    <span className="material-icons text-primary mr-2">outbox</span> {editingUsageId ? 'Edit Usage Log' : 'Use Material'}
                  </h3>
                  {editingUsageId && (
                    <button
                      onClick={() => {
                        setEditingUsageId(null);
                        setUsageFormData({
                          materialName: '', quantityUsed: '', date: new Date().toISOString().split('T')[0], notes: ''
                        });
                      }}
                      className="text-muted hover:text-foreground flex items-center"
                      title="Cancel Edit"
                    >
                      <span className="material-icons">close</span>
                    </button>
                  )}
                </div>

                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleUseMaterial(); }}>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1">Select Material</label>
                    <select
                      name="materialName"
                      value={usageFormData.materialName}
                      onChange={(e) => setUsageFormData({ ...usageFormData, materialName: e.target.value })}
                      className="block w-full bg-background-base border border-border-color rounded-md py-3 px-4 text-foreground focus:ring-primary focus:border-primary sm:text-sm"
                      required
                    >
                      <option value="">-- Select Material --</option>
                      {inventoryOverview.map(item => (
                        <option key={item.name} value={item.name}>{item.name} ({item.remainingQuantity} {item.unit} available)</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary mb-1">Quantity Used</label>
                    <input type="number" name="quantityUsed" value={usageFormData.quantityUsed} onChange={(e) => setUsageFormData({ ...usageFormData, quantityUsed: e.target.value })} className="block w-full bg-background-base border border-border-color rounded-md py-3 px-4 text-foreground placeholder-text-muted focus:ring-primary focus:border-primary sm:text-sm" placeholder="e.g. 50" required />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary mb-1">Date</label>
                    <input type="date" name="date" value={usageFormData.date} onChange={(e) => setUsageFormData({ ...usageFormData, date: e.target.value })} className="block w-full bg-background-base border border-border-color rounded-md py-3 px-4 text-foreground focus:ring-primary focus:border-primary sm:text-sm" style={{ colorScheme: 'dark' }} required />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary mb-1">Notes (Optional)</label>
                    <textarea name="notes" value={usageFormData.notes} onChange={(e) => setUsageFormData({ ...usageFormData, notes: e.target.value })} className="block w-full bg-background-base border border-border-color rounded-md py-3 px-4 text-foreground placeholder-text-muted focus:ring-primary focus:border-primary sm:text-sm" placeholder="e.g. Used for order #400" rows={2}></textarea>
                  </div>

                  <div className="mt-8 flex gap-3">
                    <button type="submit" className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-foreground font-bold py-3 px-4 rounded shadow-lg transition-all duration-300 uppercase tracking-wide text-sm flex items-center justify-center">
                      <span className="material-icons text-sm mr-2">{editingUsageId ? 'edit' : 'remove_circle_outline'}</span> {editingUsageId ? 'Update Stock Deduction' : 'Deduct Stock'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right Panel: Live Inventory Status Table */}
            <div className="w-full lg:w-2/3">
              <div className="bg-background-surface border border-border-color rounded-lg shadow-lg overflow-hidden h-full flex flex-col">
                <div className="p-4 border-b border-border-color">
                  <h3 className="text-lg font-medium text-foreground flex items-center">
                    <span className="material-icons text-primary mr-2">monitor_heart</span> Live Inventory Status
                  </h3>
                </div>
                <div className="overflow-x-auto flex-1 h-80 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-800">
                    <thead className="bg-background-base sticky top-0 border-b border-border-color shadow-sm z-10">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-foreground-muted uppercase tracking-wider">Material Name</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-foreground-muted uppercase tracking-wider">Total Added</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-foreground-muted uppercase tracking-wider">Total Used</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-foreground-muted uppercase tracking-wider">Remaining</th>
                        <th className="px-6 py-3 text-center text-xs font-bold text-foreground-muted uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {inventoryOverview.map((item, index) => (
                        <tr key={item.name} className="animate-slide-up-fade premium-hover hover:bg-primary/5 hover:border-l-2 hover:border-primary transition-all group" style={{ animationDelay: `${index * 50}ms` }}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{item.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted text-right">{item.totalQuantity.toLocaleString()} {item.unit}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted text-right">{item.totalUsed.toLocaleString()} {item.unit}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right" style={{ color: item.status === 'Critical' ? '#ef4444' : item.status === 'Low' ? '#eab308' : '#22c55e' }}>
                            {item.remainingQuantity.toLocaleString()} {item.unit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border shadow-sm transition-all duration-300
                              ${item.status === 'Critical' ? 'bg-red-900/20 text-red-500 border-red-800 animate-critical-pulse' :
                                item.status === 'Low' ? 'bg-yellow-900/20 text-yellow-500 border-yellow-800 animate-warning-pulse' :
                                  'bg-green-900/20 text-green-500 border-green-800 shadow-[0_0_10px_rgba(34,197,94,0.2)]'}`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom section: Usage History */}
          <div className="bg-background-surface border border-border-color rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 border-b border-border-color flex flex-col sm:flex-row items-center justify-between gap-4">
              <h3 className="text-lg font-medium text-foreground flex items-center">
                <span className="material-icons text-primary mr-2">history</span> Usage History Table
              </h3>
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-icons text-muted text-sm">search</span>
                </div>
                <input
                  type="text"
                  value={usageSearchTerm}
                  onChange={(e) => setUsageSearchTerm(e.target.value)}
                  className="block w-full pl-10 bg-background-base border border-border-color rounded-md py-2 text-foreground placeholder-text-muted focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="Search logs..."
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-800">
                <thead className="bg-background-base sticky top-0 border-b border-border-color shadow-sm z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-primary uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-primary uppercase tracking-wider">Material Name</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-primary uppercase tracking-wider">Used Qty</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-primary uppercase tracking-wider">Prev Qty</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-primary uppercase tracking-wider">New Remaining</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-primary uppercase tracking-wider">Notes</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-primary uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {usageLogs
                    .filter(log => log.materialName.toLowerCase().includes(usageSearchTerm.toLowerCase()) || (log.notes && log.notes.toLowerCase().includes(usageSearchTerm.toLowerCase())))
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((log, index) => (
                      <tr key={log.id} className="animate-slide-up-fade premium-hover hover:bg-primary/5 hover:border-l-2 hover:border-primary transition-all group" style={{ animationDelay: `${index * 50}ms` }}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">{log.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{log.materialName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-400 font-bold text-right">-{log.quantityUsed}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted text-right">{log.previousQuantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-foreground-muted text-right">{log.newRemainingQuantity}</td>
                        <td className="px-6 py-4 text-sm text-muted max-w-sm truncate" title={log.notes || ''}>{log.notes || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button onClick={() => handleEditUsage(log)} className="text-blue-400 hover:text-blue-300 mr-3 p-1">
                            <span className="material-icons text-base">edit</span>
                          </button>
                          <button onClick={() => handleDeleteUsage(log.id)} className="text-red-400 hover:text-red-300 p-1">
                            <span className="material-icons text-base">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  {usageLogs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-sm text-muted">
                        No usage logs found. Deduct stock using the form above to add an entry.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RawMaterials;