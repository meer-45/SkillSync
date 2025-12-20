// src/pages/Dashboard.jsx (The original file you provided)

import React from 'react';
import DashboardNavbar from '../DashboardComponents/DashboardNavbar'; // Assuming DashboardNavbar is defined
import Sidebar from '../DashboardComponents/Sidebar'; // Assuming Sidebar is defined
import DashboardContent from '../DashboardComponents/DashboardContent'; // NEW IMPORT

const Dashboard = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 1. Fixed Header */}
      <DashboardNavbar />

      {/* 2. Fixed Sidebar */}
      <Sidebar />

      {/* 3. Main Content Area */}
      {/* We use pt-16 (for Navbar height) and pl-64 (for Sidebar width) */}
      <main className="pt-16 pl-64 p-8">
        
        {/* Render the new dashboard content here */}
        <DashboardContent /> 
        
        {children}
      </main>
    </div>
  );
};

export default Dashboard;