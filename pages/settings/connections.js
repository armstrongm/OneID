// pages/settings/connections.js - Fixed version with safe array handling
import { useState, useEffect } from 'react';
import { Plus, RefreshCw, Settings, Trash2, TestTube } from 'lucide-react';

export default function ConnectionsPage() {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/connections');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch connections: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Connections API response:', data);
      
      // Handle different response formats safely
      let connectionsArray = [];
      
      if (Array.isArray(data)) {
        connectionsArray = data;
      } else if (data && Array.isArray(data.connections)) {
        connectionsArray = data.connections;
      } else if (data && Array.isArray(data.data)) {
        connectionsArray = data.data;
      } else if (data && typeof data === 'object') {
        // Try to extract connections from various possible structures
        const possibleArrays = [
          data.items,
          data.results,
          Object.values(data)
        ].filter(val => Array.isArray(val));
        
        if (possibleArrays.length > 0) {
          connectionsArray = possibleArrays[0];
        } else {
          // If it's a single connection object, wrap in array
          connectionsArray = [data];
        }
      }
      
      // Ensure we always have an array
      if (!Array.isArray(connectionsArray)) {
        console.warn('Connections data is not an array, using empty array:', connectionsArray);
        connectionsArray = [];
      }
      
      console.log('Processed connections:', connectionsArray);
      setConnections(connectionsArray);
      
    } catch (error) {
      console.error('Failed to fetch connections:', error);
      setError(error.message);
      setConnections([]); // Ensure connections is always an array
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleRefresh = () => {
    fetchConnections();
  };

  const handleTest = async (connectionId) => {
    try {
      const response = await fetch(`/api/connections/${connectionId}/test`, {
        method: 'POST',
      });
      
      if (response.ok) {
        // Refresh connections to get updated status
        fetchConnections();
      }
    } catch (error) {
      console.error('Failed to test connection:', error);
    }
  };

  const handleDelete = async (connectionId) => {
    if (!confirm('Are you sure you want to delete this connection?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/connections/${connectionId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Remove from local state
        setConnections(prev => prev.filter(conn => conn.id !== connectionId));
      }
    } catch (error) {
      console.error('Failed to delete connection:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Connections</h1>
          <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Connections</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">Failed to load connections: {error}</p>
          <button
            onClick={handleRefresh}
            className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Connections</h1>
          <p className="mt-2 text-gray-600">
            Manage your Active Directory, LDAP, and database connections
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Connection
          </button>
        </div>
      </div>

      {/* Ensure connections is always an array before mapping */}
      {!Array.isArray(connections) || connections.length === 0 ? (
        <div className="text-center py-12">
          <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No connections found</h3>
          <p className="text-gray-600 mb-4">
            Get started by adding your first connection.
          </p>
          <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Connection
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {connections.map((connection) => (
            <ConnectionCard
              key={connection.id}
              connection={connection}
              onTest={handleTest}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ConnectionCard({ connection, onTest, onDelete }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'testing':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'AD':
        return '🏢';
      case 'LDAP':
        return '📁';
      case 'DATABASE':
        return '🗄️';
      default:
        return '🔗';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <span className="text-2xl mr-3">{getTypeIcon(connection.type)}</span>
          <div>
            <h3 className="text-lg font-medium text-gray-900">{connection.name}</h3>
            <p className="text-sm text-gray-500">{connection.type}</p>
          </div>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(connection.status)}`}>
          {connection.status}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="text-sm">
          <span className="text-gray-500">Server:</span>
          <span className="text-gray-900 ml-1">{connection.serverName}</span>
        </div>
        {connection.domain && (
          <div className="text-sm">
            <span className="text-gray-500">Domain:</span>
            <span className="text-gray-900 ml-1">{connection.domain}</span>
          </div>
        )}
        {connection.baseDN && (
          <div className="text-sm">
            <span className="text-gray-500">Base DN:</span>
            <span className="text-gray-900 ml-1 font-mono text-xs">{connection.baseDN}</span>
          </div>
        )}
        {connection.lastTested && (
          <div className="text-sm">
            <span className="text-gray-500">Last tested:</span>
            <span className="text-gray-900 ml-1">
              {new Date(connection.lastTested).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <button
          onClick={() => onTest(connection.id)}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
        >
          <TestTube className="w-4 h-4 mr-1" />
          Test
        </button>
        <div className="flex items-center space-x-2">
          <button className="inline-flex items-center px-3 py-1.5 text-blue-600 hover:text-blue-800 text-sm">
            <Settings className="w-4 h-4 mr-1" />
            Edit
          </button>
          <button
            onClick={() => onDelete(connection.id)}
            className="inline-flex items-center px-3 py-1.5 text-red-600 hover:text-red-800 text-sm"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}