import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import { 
 LayoutDashboard, 
 PackageSearch, 
 Building2, 
 Container, 
 ClipboardCheck, 
 FileText, 
 Users,
 Truck,
 LogOut,
 LineChart,
 UserCog,
 PackagePlus,
 Clock,
 PackageCheck,
 Bell,
 Menu,
 X
} from 'lucide-react';
import clsx from 'clsx';
import { useStore } from '../../store/useStore';
import { ConfirmModal } from '../ui/ConfirmModal';

export const Layout = () => {
 const user = useStore(state => state.user);
 const logout = useStore(state => state.logout);
 const notifications = useStore(state => state.notifications);
 const navigate = useNavigate();
 const location = useLocation();
 const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
 const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

 // Close mobile menu on route change
 React.useEffect(() => {
 setIsMobileMenuOpen(false);
 }, [location.pathname]);

 const handleLogout = () => {
 logout();
 navigate('/login');
 };

 const unreadCount = notifications.filter(n => n.staffId === user?.id && !n.read).length;

 const navItems = [
 { name: 'Analytics Dashboard', path: '/', icon: LineChart, roles: ['admin'] },
 
 // Staff Flow
 { name: 'Dashboard', path: '/staff/dashboard', icon: LayoutDashboard, roles: ['staff'] },
 { name: 'Orders', path: '/orders', icon: PackagePlus, roles: ['admin', 'staff'] },
 { name: 'My Orders', path: '/staff/orders', icon: FileText, roles: ['staff'] },
 { name: 'Pending Items', path: '/staff/pending', icon: Clock, roles: ['staff'] },
 { name: 'Received Items', path: '/staff/received', icon: PackageCheck, roles: ['staff'] },
 { name: 'Product Database', path: '/database', icon: PackageSearch, roles: ['admin', 'staff'] },
 { name: 'Request Product', path: '/staff/request-product', icon: PackagePlus, roles: ['staff'] },
 
 // Admin Flow
 { name: 'Company View', path: '/companies', icon: Building2, roles: ['admin'] },
 { name: 'Container Planner', path: '/planner', icon: Container, roles: ['admin'] },
 { name: 'Container Distribution', path: '/distribution', icon: Truck, roles: ['admin'] },
 { name: 'Approvals', path: '/approvals', icon: ClipboardCheck, roles: ['admin'] },
 { name: 'Audit History', path: '/audit-history', icon: Clock, roles: ['admin'] },
 { name: 'Export Data', path: '/export', icon: FileText, roles: ['admin'] },
 { name: 'Manage Staff', path: '/manage-staff', icon: UserCog, roles: ['admin'] },
 ];

 const filteredNavItems = navItems.filter(item => item.roles.includes(user?.role));

 const mobileStaffLinks = [
 { name: 'Home', path: '/staff/dashboard', icon: LayoutDashboard },
 { name: 'Order', path: '/orders', icon: PackagePlus },
 { name: 'My Orders', path: '/staff/orders', icon: FileText },
 { name: 'Pending', path: '/staff/pending', icon: Clock },
 { name: 'Menu', action: () => setIsMobileMenuOpen(true), icon: Menu }
 ];

 const mobileAdminLinks = [
 { name: 'Analytics', path: '/', icon: LineChart },
 { name: 'Orders', path: '/orders', icon: PackagePlus },
 { name: 'Planner', path: '/planner', icon: Container },
 { name: 'Approvals', path: '/approvals', icon: ClipboardCheck },
 { name: 'Menu', action: () => setIsMobileMenuOpen(true), icon: Menu }
 ];

 const mobileNavItems = user?.role === 'staff' ? mobileStaffLinks : mobileAdminLinks;

 return (
 <div className="flex h-[100dvh] w-screen bg-gray-50 overflow-x-auto overflow-hidden">
 {/* Desktop Sidebar */}
 <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0 hidden md:flex flex-col">
 <div className="h-16 flex items-center px-6 border-b border-gray-200">
 <PackageSearch className="w-6 h-6 text-indigo-600 mr-3" />
 <span className="text-xl font-semibold text-gray-900">OMS System</span>
 </div>
 
 <div className="flex-1 overflow-y-auto py-5 px-3 space-y-1">
 {filteredNavItems.map((item) => (
 <NavLink 
 key={item.path} 
 to={item.path}
 className={({ isActive }) => 
 clsx(
 "flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
 isActive 
 ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/50" 
 : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
 )
 }
 >
 {({ isActive }) => (
 <>
 <item.icon className={clsx("w-5 h-5 mr-3", isActive ? "text-indigo-200" : "text-gray-400")} />
 {item.name}
 </>
 )}
 </NavLink>
 ))}
 {user?.role === 'staff' && (
 <NavLink 
 to="/notifications"
 className={({ isActive }) => 
 clsx(
 "flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
 isActive 
 ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/50" 
 : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
 )
 }
 >
 {({ isActive }) => (
 <>
 <div className="flex items-center">
 <Bell className={clsx("w-5 h-5 mr-3", isActive ? "text-indigo-200" : "text-gray-400")} />
 Notifications
 </div>
 {unreadCount > 0 && (
 <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>
 )}
 </>
 )}
 </NavLink>
 )}
 </div>

 <div className="p-4 border-t border-gray-200 bg-gray-50">
 <div className="flex items-center justify-between">
 <Link to="/profile" className="flex items-center space-x-3 hover:bg-gray-200 p-2 -ml-2 rounded-md transition-colors flex-1 overflow-x-auto overflow-hidden">
 <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm shadow-sm flex-shrink-0">
 {user?.name?.charAt(0) || 'U'}
 </div>
 <div className="overflow-x-auto overflow-hidden">
 <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
 <p className="text-xs text-gray-500 truncate capitalize">{user?.role}</p>
 </div>
 </Link>
 <button 
 onClick={() => setShowLogoutConfirm(true)}
 className="p-2 rounded-md hover:bg-gray-200 text-gray-500 hover:text-red-600 transition-colors ml-1 flex-shrink-0"
 title="Logout"
 >
 <LogOut className="w-5 h-5" />
 </button>
 </div>
 </div>
 </div>

 {/* Mobile Header */}
 <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-40 flex items-center justify-between px-4 shadow-sm">
 <div className="flex items-center">
 <PackageSearch className="w-5 h-5 text-indigo-600 mr-2" />
 <span className="font-semibold text-gray-900">OMS</span>
 </div>
 <div className="flex items-center space-x-3">
 {user?.role === 'staff' && (
 <Link to="/notifications" className="relative p-2 text-gray-500 hover:text-gray-700">
 <Bell className="w-5 h-5" />
 {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>}
 </Link>
 )}
 <Link to="/profile" className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center font-semibold text-indigo-700 text-xs shadow-sm">
 {user?.name?.charAt(0) || 'U'}
 </Link>
 </div>
 </div>

 {/* Main Content */}
 <div className="flex-1 flex flex-col h-full overflow-x-auto overflow-hidden relative mt-14 md:mt-0">
 <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
 <Outlet />
 </div>
 </div>

 {/* Mobile Bottom Navigation */}
 <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-2 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40">
 {mobileNavItems.map((item, idx) => (
 item.path ? (
 <NavLink 
 key={idx} 
 to={item.path}
 className={({ isActive }) => 
 clsx(
 "flex flex-col items-center p-2 rounded-lg text-xs font-medium transition-colors",
 isActive 
 ? "text-indigo-600 bg-indigo-50" 
 : "text-gray-500 hover:text-gray-900"
 )
 }
 >
 <item.icon className="w-6 h-6 mb-1" />
 <span className="truncate w-full text-center">{item.name}</span>
 </NavLink>
 ) : (
 <button 
 key={idx}
 onClick={item.action}
 className="flex flex-col items-center p-2 rounded-lg text-xs font-medium transition-colors text-gray-500 hover:text-gray-900 hover:bg-gray-50"
 >
 <item.icon className="w-6 h-6 mb-1" />
 <span className="truncate w-full text-center">{item.name}</span>
 </button>
 )
 ))}
 </div>

 {/* Mobile Slide-Over Menu */}
 {isMobileMenuOpen && (
 <div className="md:hidden fixed inset-0 z-50 flex">
 <div 
 className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" 
 onClick={() => setIsMobileMenuOpen(false)}
 ></div>
 <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-xl animate-in slide-in-from-left duration-200">
 <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
 <div className="flex items-center">
 <PackageSearch className="w-6 h-6 text-indigo-600 mr-3" />
 <span className="text-xl font-semibold text-gray-900">OMS Menu</span>
 </div>
 <button 
 onClick={() => setIsMobileMenuOpen(false)}
 className="text-gray-400 hover:text-gray-600 p-2 -mr-2"
 >
 <X className="w-6 h-6" />
 </button>
 </div>
 
 <div className="flex-1 overflow-y-auto py-5 px-4 space-y-1">
 {filteredNavItems.map((item) => (
 <NavLink 
 key={item.path} 
 to={item.path}
 className={({ isActive }) => 
 clsx(
 "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
 isActive 
 ? "bg-indigo-50 text-indigo-700" 
 : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
 )
 }
 >
 {({ isActive }) => (
 <>
 <item.icon className={clsx("w-5 h-5 mr-4", isActive ? "text-indigo-600" : "text-gray-400")} />
 {item.name}
 </>
 )}
 </NavLink>
 ))}
 </div>

 <div className="p-4 border-t border-gray-100">
 <button 
 onClick={() => {
 setIsMobileMenuOpen(false);
 setShowLogoutConfirm(true);
 }}
 className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
 >
 <LogOut className="w-5 h-5 mr-4" />
 Logout
 </button>
 </div>
 </div>
 </div>
 )}

 <ConfirmModal 
 isOpen={showLogoutConfirm}
 onClose={() => setShowLogoutConfirm(false)}
 onConfirm={handleLogout}
 title="Logout Confirmation"
 message="Are you sure you want to log out of your account?"
 confirmText="Logout"
 type="danger"
 />
 </div>
 );
};
