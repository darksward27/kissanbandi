import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  ClipboardList,
  Home,
  LogOut
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const menuItems = [
    { title: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { title: 'Products', icon: ShoppingBag, path: '/admin/products' },
    { title: 'Orders', icon: ClipboardList, path: '/admin/orders' },
    { title: 'Customers', icon: Users, path: '/admin/customers' }
  ];

  const handleLogout = () => {
    // Clear admin token
    localStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminToken');
    
    // Show success message
    toast.success('Logged out successfully');
    
    // Redirect to admin login
    navigate('/admin/login');
  };

  return (
    <aside className="w-64 min-h-full bg-white border-r border-gray-200 fixed left-0 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <Link to="/admin" className="text-xl font-bold text-green-700">
          Admin Panel
        </Link>
      </div>
      
      <nav className="py-4 flex-grow">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center px-6 py-3 text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors ${
              location.pathname === item.path ? 'bg-green-50 text-green-700 border-r-4 border-green-700' : ''
            }`}
          >
            <item.icon className="w-5 h-5 mr-3" />
            <span className="font-medium">{item.title}</span>
          </Link>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="border-t border-gray-200 p-4 space-y-2">
        <Link
          to="/"
          className="flex items-center px-6 py-3 text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors rounded-lg"
        >
          <Home className="w-5 h-5 mr-3" />
          <span className="font-medium">Back to Home</span>
        </Link>
        
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-6 py-3 text-red-600 hover:bg-red-50 transition-colors rounded-lg"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar; 