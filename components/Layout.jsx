// components/Layout.jsx - Complete Layout with Proper Navbar and OneID Logo
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth';
import { 
  Users, 
  Menu, 
  X,
  Home,
  Settings,
  Bell,
  Search,
  User,
  LogOut,
  ChevronDown
} from 'lucide-react';

// OneID Logo Component - Updated with proper logo
function OneIDLogo({ className = "w-8 h-8" }) {
  return (
    <div className={`${className} relative`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="48" height="48" fill="#2563eb" rx="4" />
        <rect x="52" y="0" width="48" height="48" fill="#f97316" rx="4" />
        <rect x="0" y="52" width="48" height="48" fill="#059669" rx="4" />
      </svg>
    </div>
  );
}

// Helper function to get user display name
function getUserDisplayName(user) {
  if (!user) return 'User';
  
  const firstName = user['First Name'] || user.given_name || user.firstName;
  const lastName = user['Last Name'] || user.family_name || user.lastName;
  
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }
  
  if (firstName) {
    return firstName;
  }
  
  return 'User';
}

// Profile dropdown component
function ProfileDropdown({ user, onSignOut }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const displayName = getUserDisplayName(user);
  const userEmail = user?.sub || '';
  const firstName = user?.['First Name'] || user?.given_name || user?.firstName;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
          {user?.picture ? (
            <img src={user.picture} alt="Profile" className="w-8 h-8 rounded-full" />
          ) : (
            getInitials(displayName)
          )}
        </div>
        <div className="hidden md:block text-left">
          <div className="text-sm font-medium text-gray-900">{displayName}</div>
          <div className="text-xs text-gray-500">{userEmail}</div>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            <div className="px-4 py-4 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                  {getInitials(displayName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{displayName}</div>
                  <div className="text-xs text-gray-500 truncate">{userEmail}</div>
                  {user?.['p1.userId'] && (
                    <div className="text-xs text-gray-400 truncate">
                      ID: {user['p1.userId'].slice(0, 8)}...
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-4 py-3 border-b border-gray-100">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Account Details
              </div>
              <div className="space-y-1 text-xs text-gray-600">
                {firstName && (
                  <div className="flex justify-between">
                    <span>First Name:</span>
                    <span className="font-medium">{firstName}</span>
                  </div>
                )}
                {user?.['Last Name'] && (
                  <div className="flex justify-between">
                    <span>Last Name:</span>
                    <span className="font-medium">{user['Last Name']}</span>
                  </div>
                )}
                {user?.env && (
                  <div className="flex justify-between">
                    <span>Environment:</span>
                    <span className="font-medium">{user.env.slice(0, 8)}...</span>
                  </div>
                )}
                {user?.['p1.region'] && (
                  <div className="flex justify-between">
                    <span>Region:</span>
                    <span className="font-medium">{user['p1.region']}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="py-1">
              <Link
                href="/profile"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                <User className="w-4 h-4 mr-3" />
                <div>
                  <div className="font-medium">View Full Profile</div>
                  <div className="text-xs text-gray-500">See all PingOne data & scopes</div>
                </div>
              </Link>
              
              <Link
                href="/settings"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                <Settings className="w-4 h-4 mr-3" />
                Settings
              </Link>
              
              <button
                onClick={() => {
                  setIsOpen(false);
                  onSignOut();
                }}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-t border-gray-100"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Navigation items
const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Groups', href: '/groups', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications] = useState([
    { id: 1, message: 'New user registration pending approval', time: '5 min ago', unread: true },
    { id: 2, message: 'System maintenance scheduled for tonight', time: '1 hour ago', unread: false },
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const router = useRouter();
  const { user, signOut } = useAuth();

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-75" 
            onClick={() => setSidebarOpen(false)} 
          />
          <div className="relative flex flex-col w-80 h-full bg-white shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center">
                <OneIDLogo className="w-12 h-12" />
                <h2 className="ml-3 text-xl font-semibold">OneID Manager</h2>
              </div>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex-1 px-6 py-4 space-y-2">
              {navigation.map((item) => {
                const isActive = router.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-80 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-1 bg-white border-r border-gray-200">
          {/* Sidebar Header */}
          <div className="flex items-center px-6 py-4 border-b border-gray-200">
            <OneIDLogo className="w-12 h-12 flex-shrink-0" />
            <h2 className="ml-3 text-xl font-semibold text-gray-900">OneID Manager</h2>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-6 py-4 space-y-2">
            {navigation.map((item) => {
              const isActive = router.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          
          {/* Footer */}
          <div className="border-t border-gray-200 p-4 text-center text-xs text-gray-500">
            OneID Manager v1.0
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="lg:pl-80">
        {/* Mobile header */}
        <div className="sticky top-0 z-10 bg-white border-b lg:hidden">
          <div className="flex items-center justify-between px-4 py-2">
            <button onClick={() => setSidebarOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center">
              <OneIDLogo className="w-8 h-8" />
              <h1 className="ml-2 text-lg font-semibold">OneID Manager</h1>
            </div>
            <div className="flex items-center space-x-2">
              <button className="relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Desktop header */}
        <div className="hidden lg:block bg-white border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Search bar */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users, groups..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Right side - notifications and profile */}
              <div className="flex items-center space-x-4">
                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                      <div className="py-2">
                        <div className="px-4 py-2 text-sm font-medium text-gray-900 border-b">
                          Notifications
                        </div>
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`px-4 py-3 hover:bg-gray-50 ${
                              notification.unread ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="text-sm text-gray-900">{notification.message}</div>
                            <div className="text-xs text-gray-500 mt-1">{notification.time}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Dropdown */}
                <ProfileDropdown user={user} onSignOut={signOut} />
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main>{children}</main>
      </div>
    </div>
  );
}