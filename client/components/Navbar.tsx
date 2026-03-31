import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

const Navbar: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "border-primary text-primary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-primary after:shadow-[0_0_8px_rgba(212,175,55,0.8)]"
      : "border-transparent text-muted hover:border-gray-500 hover:text-foreground inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200";

  return (
    <nav className="sticky top-0 z-50 bg-[#181818] border-b border-border-color shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center group cursor-pointer transition-transform duration-500 hover:scale-105">
              <img src="/navbar-logo.png" alt="Be Endless Logo" className="h-10 w-auto object-contain drop-shadow-[0_0_10px_rgba(212,175,55,0.2)] group-hover:drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]" />
            </div>
            <div className="hidden sm:ml-10 sm:flex sm:space-x-8">
              <NavLink to="/dashboard" className={navLinkClass}>Dashboard</NavLink>
              <NavLink to="/customers" className={navLinkClass}>Customers</NavLink>
              <NavLink to="/orders" className={navLinkClass}>Orders</NavLink>
              <NavLink to="/raw-materials" className={navLinkClass}>Raw Materials</NavLink>
              <NavLink to="/bills" className={navLinkClass}>Bills</NavLink>
              <NavLink to="/personal-expenses" className={navLinkClass}>Personal Expenses</NavLink>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <NavLink to="/settings" className="group bg-background-surface p-2 rounded-full text-muted hover:text-primary border border-border-color hover:border-primary/50 focus:outline-none transition-all duration-300 hover:shadow-[0_0_15px_rgba(212,175,55,0.2)]" title="Settings">
              <span className="sr-only">Settings</span>
              <span className="material-icons group-hover:rotate-180 transition-transform duration-700 ease-in-out">settings</span>
            </NavLink>
            <button
              onClick={handleLogout}
              className="group bg-background-surface p-2 rounded-full text-muted hover:text-red-500 border border-border-color hover:border-red-500/50 focus:outline-none transition-all duration-300 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
            <div className="relative">
              <div className="flex items-center gap-3">
                {/* Profile section removed per user request */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;