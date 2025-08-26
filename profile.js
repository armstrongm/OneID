// pages/profile.js - Complete Fixed Profile Page
import { useAuth } from '../lib/auth';
import { User, Mail, Calendar, Shield, Server, Copy, Check } from 'lucide-react';
import { useState } from 'react';

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

function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
      title={`Copy ${label}`}
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  );
}

function ProfileSection({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center">
          <Icon className="w-5 h-5 text-gray-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        </div>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

function ProfileField({ label, value, copyable = false }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900 flex items-center">
        <span className="break-all">{value || 'Not provided'}</span>
        {copyable && value && <CopyButton text={value} label={label} />}
      </dd>
    </div>
  );
}

function JsonViewer({ data, title }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-700">{title}</h4>
        <CopyButton text={JSON.stringify(data, null, 2)} label="JSON data" />
      </div>
      <pre className="text-xs text-gray-600 overflow-auto max-h-96 bg-white p-3 rounded border">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

export default function Profile() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile</h1>
          <p className="text-gray-600">Please sign in to view your profile.</p>
        </div>
      </div>
    );
  }

  const displayName = getUserDisplayName(user);
  const firstName = user['First Name'] || user.given_name || user.firstName;
  const lastName = user['Last Name'] || user.family_name || user.lastName;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="mt-2 text-gray-600">View your account information and PingOne details</p>
      </div>

      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-8">
          <div className="flex items-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              {user.picture ? (
                <img src={user.picture} alt="Profile" className="w-20 h-20 rounded-full" />
              ) : (
                <span className="text-2xl font-bold text-white">
                  {displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </span>
              )}
            </div>
            <div className="ml-6">
              <h2 className="text-2xl font-bold text-gray-900">{displayName}</h2>
              <p className="text-gray-600">{user.sub || 'No email provided'}</p>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <Calendar className="w-4 h-4 mr-1" />
                Last login: {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <ProfileSection title="Basic Information" icon={User}>
        <dl className="divide-y divide-gray-100">
          <ProfileField label="First Name" value={firstName} />
          <ProfileField label="Last Name" value={lastName} />
          <ProfileField label="Full Name" value={displayName} />
          <ProfileField label="Email" value={user.sub} copyable />
          <ProfileField label="Username" value={user.preferred_username || user.sub} />
        </dl>
      </ProfileSection>

      {/* PingOne Information */}
      <ProfileSection title="PingOne Account Details" icon={Shield}>
        <dl className="divide-y divide-gray-100">
          <ProfileField label="User ID" value={user['p1.userId']} copyable />
          <ProfileField label="Subject ID" value={user.sub} copyable />
          <ProfileField label="Environment ID" value={user.env} copyable />
          <ProfileField label="Organization ID" value={user.org} copyable />
          <ProfileField label="Region" value={user['p1.region']} />
        </dl>
      </ProfileSection>

      {/* Technical Information */}
      <ProfileSection title="Technical Details" icon={Server}>
        <dl className="divide-y divide-gray-100">
          {Object.entries(user)
            .filter(([key]) => !['First Name', 'Last Name', 'sub', 'p1.userId', 'env', 'org', 'p1.region'].includes(key))
            .map(([key, value]) => (
              <ProfileField 
                key={key} 
                label={key} 
                value={typeof value === 'object' ? JSON.stringify(value) : String(value)} 
                copyable 
              />
            ))
          }
        </dl>
      </ProfileSection>

      {/* Raw Data */}
      <ProfileSection title="Raw PingOne Response" icon={Server}>
        <JsonViewer data={user} title="Complete User Data from PingOne" />
      </ProfileSection>

      {/* Token Information */}
      <ProfileSection title="Session Information" icon={Shield}>
        <dl className="divide-y divide-gray-100">
          <ProfileField 
            label="Access Token" 
            value={typeof window !== 'undefined' && localStorage.getItem('pingone_access_token') ? 'Present (click to copy)' : 'Not available'} 
            copyable={typeof window !== 'undefined' && !!localStorage.getItem('pingone_access_token')}
          />
          <ProfileField 
            label="ID Token" 
            value={typeof window !== 'undefined' && localStorage.getItem('pingone_id_token') ? 'Present (click to copy)' : 'Not available'} 
            copyable={typeof window !== 'undefined' && !!localStorage.getItem('pingone_id_token')}
          />
          <ProfileField 
            label="Login Time" 
            value={new Date().toLocaleString()} 
          />
        </dl>
      </ProfileSection>
    </div>
  );
}