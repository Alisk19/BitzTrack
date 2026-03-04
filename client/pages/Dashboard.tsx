import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { subscribeToCollection } from '../services/firestore';
import { computeDashboardStats } from '../services/dashboardService';
import CountUp from '../components/CountUp';

const COLORS = ['#D4AF37', '#E5E7EB', '#9CA3AF', '#4B5563'];

const StatCard = ({ title, numericValue, isCurrency, change, trend, icon, period, isHero = false }: any) => (
  <div className={`bg-background-surface border ${isHero ? 'border-primary/50 shadow-[0_0_15px_rgba(212,175,55,0.15)] animate-glow-pulse' : 'border-border-color'} overflow-hidden shadow-lg rounded-lg relative group premium-hover cursor-default`}>
    {isHero && <div className="absolute inset-0 bg-primary/5 blur-xl pointer-events-none transition-opacity duration-500 group-hover:bg-primary/10"></div>}
    <div className="p-5 relative z-10">
      <div className="flex items-center">
        <div className={`flex-shrink-0 ${isHero ? 'bg-primary/20' : 'bg-primary/10'} rounded-md p-3 group-hover:scale-110 transition-transform duration-300`}>
          <span className="material-icons text-primary text-2xl">{icon}</span>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-muted truncate">{title}</dt>
            <dd>
              <div className="text-2xl font-bold text-primary">
                <CountUp end={numericValue || 0} prefix={isCurrency ? '₹' : ''} />
              </div>
            </dd>
          </dl>
        </div>
      </div>
    </div>
    <div className="bg-[#252525] px-5 py-3 border-t border-border-color relative z-10 transition-colors duration-300 group-hover:bg-[#2a2a2a]">
      <div className="text-sm">
        <div className={`font-medium inline-flex items-baseline ${trend === 'details' ? 'text-muted' : (trend === 'up' ? 'text-green-400' : 'text-red-400')}`}>
          {change}
        </div>
        <span className="text-muted"> {period}</span>
      </div>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState('Default');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);

  const [stats, setStats] = useState<any>({
    summary: { totalOrders: 0, totalRevenue: 0, totalCustomers: 0, pendingOrders: 0 },
    revenueChart: [],
    ordersCountChart: [],
    rawMaterialsPieChart: []
  });

  useEffect(() => {
    const unsubOrders = subscribeToCollection('orders', setOrders);
    const unsubCustomers = subscribeToCollection('customers', setCustomers);
    const unsubMaterials = subscribeToCollection('raw-materials', setMaterials);

    // Quick stop for loading
    setTimeout(() => setLoading(false), 1000);

    return () => {
      unsubOrders();
      unsubCustomers();
      unsubMaterials();
    };
  }, []);

  useEffect(() => {
    setStats(computeDashboardStats(orders, customers, materials, timeRange));
    if (loading && (orders.length > 0 || customers.length > 0)) {
      setLoading(false);
    }
  }, [orders, customers, materials, timeRange]);

  const ranges = ['Default', 'Past 7 Days', 'Last Month', 'Last 3 Months', '6 Months', 'Last Year'];

  if (loading) return <div className="text-foreground p-8">Loading Dashboard...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-foreground sm:text-3xl sm:truncate">Overview</h2>
          <p className="mt-1 text-sm text-muted">Track your key metrics in real-time.</p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 gap-3">
          <div className="relative inline-block text-left w-full sm:w-auto">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="inline-flex items-center justify-between sm:justify-center w-full rounded-md border border-border-color shadow-sm px-4 py-2 bg-background-surface text-sm font-medium text-foreground hover:bg-[#2a2a2a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-primary"
            >
              <div className="flex items-center">
                <span className="material-icons text-primary mr-2 text-lg">calendar_today</span>
                <span>{timeRange}</span>
              </div>
              <span className="material-icons ml-2 -mr-1 text-lg">expand_more</span>
            </button>

            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-background-surface ring-1 ring-black ring-opacity-5 focus:outline-none z-20 border border-border-color">
                  <div className="py-1">
                    {ranges.map((range) => (
                      <button
                        key={range}
                        onClick={() => {
                          setTimeRange(range);
                          setIsDropdownOpen(false);
                        }}
                        className={`${timeRange === range ? 'bg-primary/10 text-primary' : 'text-foreground-muted hover:bg-gray-800'
                          } block w-full text-left px-4 py-2 text-sm transition-colors`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="animate-slide-up-fade" style={{ animationDelay: '100ms' }}>
          <StatCard title="Total Orders" numericValue={stats.summary.totalOrders} change="Real-time" trend="details" icon="shopping_bag" period="" />
        </div>
        <div className="animate-slide-up-fade" style={{ animationDelay: '200ms' }}>
          <StatCard title="Total Revenue" numericValue={stats.summary.totalRevenue} isCurrency={true} change="Real-time" trend="details" icon="payments" period="" isHero={true} />
        </div>
        <div className="animate-slide-up-fade" style={{ animationDelay: '300ms' }}>
          <StatCard title="Total Customers" numericValue={stats.summary.totalCustomers} change="Real-time" trend="details" icon="people" period="" />
        </div>
        <div className="animate-slide-up-fade" style={{ animationDelay: '400ms' }}>
          <StatCard title="Pending Orders" numericValue={stats.summary.pendingOrders} change="Action Needed" trend="down" icon="pending_actions" period="" />
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Revenue Chart */}
        <div className="bg-background-surface rounded-lg border border-border-color p-6 lg:col-span-3 animate-slide-up-fade premium-hover glass-panel" style={{ animationDelay: '500ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-foreground">Revenue Over Time</h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.revenueChart}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#333" strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={30}
                  padding={{ left: 20, right: 40 }}
                  tickFormatter={(dateStr) => {
                    const d = new Date(dateStr);
                    if (isNaN(d.getTime())) return dateStr;
                    // Check if it's a YYYY-MM string
                    if (dateStr.length === 7) {
                      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                    }
                    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  }}
                />
                <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#333', color: '#fff' }}
                  itemStyle={{ color: '#D4AF37' }}
                  cursor={{ stroke: '#444', strokeWidth: 1 }}
                  formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom charts row */}
        <div className="lg:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Orders Bar Chart */}
          <div className="bg-background-surface rounded-lg shadow border border-border-color p-6 animate-fade-in-up" style={{ animationFillMode: 'both', animationDelay: '500ms' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-foreground">Orders Status</h3>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.ordersCountChart}>
                  <CartesianGrid vertical={false} stroke="#333" strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: '#2a2a2a' }}
                    contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#333', color: '#fff' }}
                  />
                  <Bar dataKey="value" fill="#D4AF37" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Raw Materials Pie Chart */}
          <div className="bg-background-surface rounded-lg shadow border border-border-color p-6 animate-fade-in-up" style={{ animationFillMode: 'both', animationDelay: '600ms' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-foreground">Raw Materials Stock Value (%)</h3>
            </div>
            <div className="h-72 w-full flex items-center justify-center">
              {stats.rawMaterialsPieChart?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#333', color: '#fff', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                      formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Total Value']}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                    <Pie
                      data={stats.rawMaterialsPieChart}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      nameKey="name"
                      animationBegin={200}
                      animationDuration={1500}
                    >
                      {stats.rawMaterialsPieChart.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.5)" strokeWidth={2} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-muted flex flex-col items-center">
                  <span className="material-icons text-4xl mb-2 opacity-50">pie_chart</span>
                  <p>No material data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;