// pages/index.js - Complete Dashboard with System Status Card
import { useAuth } from '../lib/auth';
import { Users, UserCheck, Shield, Activity } from 'lucide-react';
import SystemStatusCard from '../components/SystemStatusCard';

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
  
  if (user.name) {
    return user.name;
  }
  
  if (user.preferred_username) {
    return user.preferred_username;
  }
  
  if (user.sub) {
    return user.sub.split('@')[0];
  }
  
  return 'User';
}

function formatLoginTime() {
  const now = new Date();
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  };
  return now.toLocaleDateString('en-US', options);
}

function WelcomeMessage({ user }) {
  const displayName = getUserDisplayName(user);
  const firstName = user?.['First Name'] || user?.given_name || user?.firstName;
  const loginTime = formatLoginTime();

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 mb-8">
      <div className="text-white">
        <h2 className="text-2xl font-bold mb-2">
          Welcome back, {firstName || displayName}! 👋
        </h2>
        <p className="text-blue-100 opacity-90">
          You're logged in at {loginTime}
        </p>
        <div className="mt-4 flex items-center text-blue-100">
          <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
          <span className="text-sm">System is running smoothly</span>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon: Icon, change, changeType = 'increase' }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Icon className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm ${changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
              {changeType === 'increase' ? '↗' : '↘'} {change}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function RecentActivity() {
  const activities = [
    { id: 1, user: 'John Doe', action: 'Created new user account', time: '2 minutes ago' },
    { id: 2, user: 'Jane Smith', action: 'Updated group permissions', time: '15 minutes ago' },
    { id: 3, user: 'Mike Johnson', action: 'Logged in from new device', time: '1 hour ago' },
    { id: 4, user: 'Sarah Wilson', action: 'Password reset requested', time: '2 hours ago' },
  ];

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {activities.map((activity) => (
          <div key={activity.id} className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                  <span className="text-xs font-medium text-gray-600">
                    {activity.user.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.user}</p>
                  <p className="text-sm text-gray-500">{activity.action}</p>
                </div>
              </div>
              <span className="text-xs text-gray-400">{activity.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Manage your identity and access infrastructure</p>
      </div>

      {/* Welcome Message */}
      <WelcomeMessage user={user} />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Users"
          value="1,284"
          icon={Users}
          change="+12 this week"
          changeType="increase"
        />
        <StatsCard
          title="Active Users"
          value="1,127"
          icon={UserCheck}
          change="+5.2%"
          changeType="increase"
        />
        <StatsCard
          title="Security Groups"
          value="64"
          icon={Shield}
          change="+3 this month"
          changeType="increase"
        />
        <StatsCard
          title="Login Activity"
          value="98.5%"
          icon={Activity}
          change="+2.1%"
          changeType="increase"
        />
      </div>

      {/* Content Grid with System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* System Status Card - Takes up 1 column */}
        <div className="lg:col-span-1">
          <SystemStatusCard />
        </div>

        {/* Recent Activity - Takes up 1 column */}
        <div className="lg:col-span-1">
          <RecentActivity />
        </div>

        {/* Quick Actions - Takes up 1 column */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-6 space-y-4">
              <button className="w-full text-left p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="font-medium text-gray-900">Add New User</div>
                <div className="text-sm text-gray-500">Create a new user account</div>
              </button>
              <button className="w-full text-left p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="font-medium text-gray-900">Create Security Group</div>
                <div className="text-sm text-gray-500">Set up a new security group</div>
              </button>
              <button className="w-full text-left p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="font-medium text-gray-900">View Audit Logs</div>
                <div className="text-sm text-gray-500">Check recent system activity</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}