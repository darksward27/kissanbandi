import React from 'react';
import { useLocation } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar';

/**
 * AdminLayout Component
 * Wraps admin pages with the main layout and adds admin-specific sidebar
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render
 */
const AdminLayout = ({ children }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="flex min-h-screen bg-gray-50">
      {isAdminRoute && <AdminSidebar />}
      <div className="flex-1 ml-64">
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout; 