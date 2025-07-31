import { LayoutDashboard, Package, ShoppingCart, Users, BarChart2, Coupon, LogOut } from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Customers', href: '/admin/customers', icon: Users },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart2 },
  { name: 'Blogs', href: '/admin/blogs', icon: LayoutDashboard },
  { name: 'Coupons', href: '/admin/coupons', icon: Coupon }
];a