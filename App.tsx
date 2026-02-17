import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Customers from './pages/Customers';
import RawMaterials from './pages/RawMaterials';
import PersonalExpenses from './pages/PersonalExpenses';

const App: React.FC = () => {
  return (
    <HashRouter>
      <div className="bg-[#121212] font-display text-gray-300 min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 bg-[#121212]">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/raw-materials" element={<RawMaterials />} />
            <Route path="/personal-expenses" element={<PersonalExpenses />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;