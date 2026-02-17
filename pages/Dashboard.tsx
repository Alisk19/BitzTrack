import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';

const dataRevenue = [
  { name: 'Nov 1', value: 4000 },
  { name: 'Nov 5', value: 4500 },
  { name: 'Nov 8', value: 3800 },
  { name: 'Nov 12', value: 5500 },
  { name: 'Nov 15', value: 5000 },
  { name: 'Nov 19', value: 6500 },
  { name: 'Nov 22', value: 6000 },
  { name: 'Nov 26', value: 7800 },
  { name: 'Nov 30', value: 9000 },
];

const dataOrders = [
  { name: 'Mon', confirmed: 40, pending: 24 },
  { name: 'Tue', confirmed: 60, pending: 13 },
  { name: 'Wed', confirmed: 50, pending: 38 },
  { name: 'Thu', confirmed: 80, pending: 10 },
  { name: 'Fri', confirmed: 30, pending: 45 },
  { name: 'Sat', confirmed: 90, pending: 30 },
  { name: 'Sun', confirmed: 60, pending: 20 },
  { name: 'Mon', confirmed: 75, pending: 25 },
];

const dataCategories = [
  { name: 'Electronics', value: 400 },
  { name: 'Industrial', value: 300 },
  { name: 'Automotive', value: 300 },
  { name: 'Home & Office', value: 200 },
];

const COLORS = ['#D4AF37', '#E5E7EB', '#9CA3AF', '#4B5563'];

const StatCard = ({ title, value, change, trend, icon, period }: any) => (
  <div className="bg-background-surface border border-gray-800 overflow-hidden shadow-lg rounded-lg relative group hover:border-primary/50 transition-colors duration-300">
    <div className="p-5">
      <div className="flex items-center">
        <div className="flex-shrink-0 bg-primary/10 rounded-md p-3">
          <span className="material-icons text-primary text-2xl">{icon}</span>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-400 truncate">{title}</dt>
            <dd>
              <div className="text-2xl font-bold text-primary">{value}</div>
            </dd>
          </dl>
        </div>
      </div>
    </div>
    <div className="bg-[#252525] px-5 py-3 border-t border-gray-800">
      <div className="text-sm">
        <div className={`font-medium inline-flex items-baseline ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
          <span className="material-icons text-sm self-center mr-1">{trend === 'up' ? 'arrow_upward' : 'warning'}</span>
          {change}
        </div>
        <span className="text-gray-500"> {period}</span>
      </div>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState('Last 30 Days');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const ranges = ['Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'This Year'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-white sm:text-3xl sm:truncate">Overview</h2>
          <p className="mt-1 text-sm text-gray-400">Track your key metrics in real-time.</p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 gap-3">
          <div className="relative inline-block text-left">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="inline-flex justify-center w-full rounded-md border border-gray-700 shadow-sm px-4 py-2 bg-background-surface text-sm font-medium text-gray-200 hover:bg-[#2a2a2a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-primary"
            >
              <span className="material-icons text-primary mr-2 text-lg">calendar_today</span>
              {timeRange}
              <span className="material-icons ml-2 -mr-1 text-lg">expand_more</span>
            </button>
            
            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-background-surface ring-1 ring-black ring-opacity-5 focus:outline-none z-20 border border-gray-700">
                  <div className="py-1">
                    {ranges.map((range) => (
                      <button
                        key={range}
                        onClick={() => {
                          setTimeRange(range);
                          setIsDropdownOpen(false);
                        }}
                        className={`${
                          timeRange === range ? 'bg-primary/10 text-primary' : 'text-gray-300 hover:bg-gray-800'
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
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-primary">
            <span className="material-icons mr-2 text-lg">download</span>
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard title="Total Orders" value="1,240" change="12%" trend="up" icon="shopping_bag" period="from last month" />
        <StatCard title="Total Revenue" value="₹45,200" change="4.3%" trend="up" icon="payments" period="from last month" />
        <StatCard title="Total Customers" value="850" change="28 new" trend="up" icon="people" period="this week" />
        <StatCard title="Pending Orders" value="14" change="Action Needed" trend="down" icon="pending_actions" period="" />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Revenue Chart - Full Width on LG */}
        <div className="bg-background-surface rounded-lg shadow border border-gray-800 p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-white">Revenue Over Time</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/40 text-green-400 border border-green-800">
              +4.5% Growth
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dataRevenue}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#333" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#333', color: '#fff' }}
                  itemStyle={{ color: '#D4AF37' }}
                  cursor={{ stroke: '#444', strokeWidth: 1 }}
                  formatter={(value: any) => [`₹${value}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="value" stroke="#D4AF37" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders Bar Chart */}
        <div className="bg-background-surface rounded-lg shadow border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-white">Orders Count</h3>
            <div className="flex space-x-2">
              <div className="flex items-center">
                <span className="h-3 w-3 rounded-full bg-primary mr-2"></span>
                <span className="text-xs text-gray-400">Confirmed</span>
              </div>
              <div className="flex items-center">
                <span className="h-3 w-3 rounded-full bg-gray-600 mr-2"></span>
                <span className="text-xs text-gray-400">Pending</span>
              </div>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataOrders}>
                <CartesianGrid vertical={false} stroke="#333" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{fill: '#2a2a2a'}}
                  contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#333', color: '#fff' }}
                />
                <Bar dataKey="confirmed" stackId="a" fill="#D4AF37" radius={[0, 0, 0, 0]} barSize={30} />
                <Bar dataKey="pending" stackId="a" fill="#4B5563" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Pie Chart */}
        <div className="bg-background-surface rounded-lg shadow border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-white">Sales by Category</h3>
            <button className="text-gray-400 hover:text-white">
              <span className="material-icons text-sm">more_horiz</span>
            </button>
          </div>
          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataCategories}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {dataCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#333', color: '#fff' }}
                   itemStyle={{ color: '#fff' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                  formatter={(value) => <span className="text-gray-400 text-sm ml-1">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
              <span className="text-2xl font-bold text-white">1,200</span>
              <span className="text-xs text-gray-400">Products</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-background-surface shadow border border-gray-800 rounded-lg mb-8">
        <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-lg leading-6 font-medium text-white">Recent Orders</h3>
          <a href="#" className="text-sm text-primary hover:text-primary-hover font-medium">View all orders</a>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-[#252525]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-background-surface divide-y divide-gray-800 text-gray-300">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">#ORD-7352</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">Acme Corp.</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Nov 24, 2023</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200 font-medium">₹1,200.00</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-900/30 text-green-400 border border-green-800/50">Completed</span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">#ORD-7351</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">Global Tech</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Nov 24, 2023</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200 font-medium">₹850.50</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-900/30 text-yellow-500 border border-yellow-800/50">Pending</span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">#ORD-7350</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">Stark Industries</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Nov 23, 2023</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200 font-medium">₹3,400.00</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-900/30 text-blue-400 border border-blue-800/50">Processing</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;