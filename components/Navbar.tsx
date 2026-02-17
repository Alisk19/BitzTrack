import React from 'react';
import { NavLink } from 'react-router-dom';

const Navbar: React.FC = () => {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "border-primary text-primary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
      : "border-transparent text-gray-400 hover:border-gray-600 hover:text-gray-200 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200";

  return (
    <nav className="sticky top-0 z-50 bg-[#181818] border-b border-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 rounded bg-primary flex items-center justify-center mr-3">
                <span className="material-icons text-black text-lg">analytics</span>
              </div>
              <span className="font-bold text-xl tracking-tight text-white">BizTrack <span className="text-primary text-xs uppercase tracking-widest ml-1 font-medium">Gold</span></span>
            </div>
            <div className="hidden sm:ml-10 sm:flex sm:space-x-8">
              <NavLink to="/" className={navLinkClass}>Dashboard</NavLink>
              <NavLink to="/orders" className={navLinkClass}>Orders</NavLink>
              <NavLink to="/customers" className={navLinkClass}>Customers</NavLink>
              <NavLink to="/raw-materials" className={navLinkClass}>Raw Materials</NavLink>
              <NavLink to="/personal-expenses" className={navLinkClass}>Personal Expenses</NavLink>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="bg-[#181818] p-1 rounded-full text-gray-400 hover:text-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-primary transition-colors">
              <span className="sr-only">View notifications</span>
              <span className="material-icons">notifications</span>
            </button>
            <div className="relative">
              <div className="flex items-center gap-3">
                 <div className="text-right hidden md:block">
                    <p className="text-sm font-medium text-white">Admin User</p>
                    <p className="text-xs text-gray-400">Operations Manager</p>
                 </div>
                 <button className="max-w-xs bg-[#181818] flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-primary">
                  <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border border-primary/30">AU</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;