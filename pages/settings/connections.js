// pages/settings/connections.js - Fixed version with correct imports
import { useState, useEffect } from 'react';
import { Plus, RefreshCw, Settings, Trash2, TestTube } from 'lucide-react';

// Import your components with correct syntax
import ConnectionForm from '../../components/connections/ConnectionForm';
import PingOneConnectionCard from '../../components/connections/PingOneConnectionCard';
import { CONNECTION_TYPES } from '../../lib/constants/connectionTypes';

export default function ConnectionsPage() {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [selectedConnectionType, setSelectedConnectionType] = useState('PINGONE'); // Start with PingOne
  const [actionLoading, setActionLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);

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
      } else {
        console.warn('Unexpected connections data format:', data);
        connectionsArray = [];
      }
      
      console.log('Processed connections:', connectionsArray);
      setConnections(connectionsArray);
      
    } catch (error) {
      console.error('Failed to fetch connections:', error);
      setError(error.message);
      setConnections([]);
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

  // FIXED TEST HANDLER
  const handleTest = async (connectionId) => {
    console.log('=== FRONTEND TEST START ===');
    console.log('Connection ID:', connectionId);

    try {
      // Find the connection data
      const connection = connections.find(c => c.id === connectionId);
      if (!connection) {
        console.error('Connection not found:', connectionId);
        return;
      }

      console.log('Connection found:', connection.name);
      console.log('Connection type:', connection.type);

      // Set loading state
      setActionLoading(true);
      setTestResult(null);

      // For PingOne connections, test the configuration
      if (connection.type === 'PINGONE') {
        console.log('Testing PingOne connection...');
        
        // Get config from connection
        const config = connection.connection_config || {};
        console.log('Config keys:', Object.keys(config));

        const testData = {
          type: 'PINGONE',
          environmentId: config.environmentId,
          region: config.region,
          clientId: config.clientId,
          clientSecret: config.clientSecret,
          scopes: config.scopes
        };

        console.log('Sending test data:', {
          type: testData.type,
          environmentId: testData.environmentId ? `${testData.environmentId.substring(0, 8)}...` : 'MISSING',
          region: testData.region,
          clientId: testData.clientId ? `${testData.clientId.substring(0, 8)}...` : 'MISSING',
          clientSecret: testData.clientSecret ? 'PROVIDED' : 'MISSING'
        });

        const response = await fetch('/api/connections/test-config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testData),
        });

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        const result = await response.json();
        console.log('Test result:', result);

        setTestResult(result);

        if (response.ok && result.success) {
          console.log('✅ Test successful');
          // Update connection status
          setTimeout(fetchConnections, 1000);
        } else {
          console.error('❌ Test failed:', result.message || result.error);
        }
      } else {
        // For other connection types
        setTestResult({
          success: false,
          message: `Testing not yet implemented for ${connection.type} connections`,
          tests: []
        });
      }

    } catch (error) {
      console.error('=== FRONTEND TEST ERROR ===');
      console.error('Error:', error.message);

      setTestResult({
        success: false,
        message: 'Test request failed',
        error: error.message,
        tests: [{
          name: 'Request Error',
          success: false,
          message: error.message,
          details: { errorType: error.constructor.name }
        }]
      });
    } finally {
      console.log('=== FRONTEND TEST END ===');
      setActionLoading(false);
    }
  };

  const handleDelete = async (connectionId) => {
    if (!confirm('Are you sure you want to delete this connection?')) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`/api/connections/${connectionId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        fetchConnections();
      } else {
        const error = await response.json();
        console.error('Failed to delete connection:', error);
      }
    } catch (error) {
      console.error('Failed to delete connection:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateConnection = async (connectionData) => {
    try {
      setActionLoading(true);
      
      const response = await fetch('/api/connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(connectionData),
      });
      
      if (response.ok) {
        setShowCreateModal(false);
        fetchConnections();
        setTestResult(null);
      } else {
        const error = await response.json();
        console.error('Failed to create connection:', error);
      }
    } catch (error) {
      console.error('Failed to create connection:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditConnection = async (connectionData) => {
    try {
      setActionLoading(true);
      
      const response = await fetch(`/api/connections/${selectedConnection.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(connectionData),
      });
      
      if (response.ok) {
        setShowEditModal(false);
        setSelectedConnection(null);
        fetchConnections();
        setTestResult(null);
      } else {
        const error = await response.json();
        console.error('Failed to update connection:', error);
      }
    } catch (error) {
      console.error('Failed to update connection:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTestConfig = async (connectionData) => {
    try {
      setTestResult({ testing: true, message: 'Testing connection...' });
      
      const response = await fetch('/api/connections/test-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(connectionData),
      });
      
      const result = await response.json();
      setTestResult(result);
      
      return result;
    } catch (error) {
      const errorResult = {
        success: false,
        message: 'Test failed',
        error: error.message
      };
      setTestResult(errorResult);
      return errorResult;
    }
  };

  const handleEdit = (connection) => {
    setSelectedConnection(connection);
    setSelectedConnectionType(connection.type);
    setShowEditModal(true);
    setTestResult(null);
  };

  const handleImport = (result) => {
    console.log('Import completed:', result);
    fetchConnections();
  };

  const renderConnectionCard = (connection) => {
    if (connection.type === 'PINGONE') {
      return (
        <PingOneConnectionCard
          key={connection.id}
          connection={connection}
          onTest={handleTest}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onImport={handleImport}
        />
      );
    } else {
      // Standard connection card for non-PingOne connections
      return (
        <StandardConnectionCard
          key={connection.id}
          connection={connection}
          onTest={handleTest}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      );
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Connection Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage identity source connections and synchronization
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleRefresh}
            className={`inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              loading ? 'animate-pulse' : ''
            }`}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Connection
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading connections</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Connections Grid */}
      {!Array.isArray(connections) || connections.length === 0 ? (
        <div className="text-center py-12">
          <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No connections found</h3>
          <p className="text-gray-600 mb-4">
            Get started by adding your first identity source connection.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Connection
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {connections.map(renderConnectionCard)}
        </div>
      )}

      {/* Create Connection Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Connection</h3>
              
              {/* Connection Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Connection Type
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(CONNECTION_TYPES).map(([type, config]) => (
                    <button
                      key={type}
                      onClick={() => setSelectedConnectionType(type)}
                      className={`p-3 border rounded-lg text-center hover:bg-gray-50 ${
                        selectedConnectionType === type
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{config.icon}</div>
                      <div className="text-xs font-medium">{config.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <ConnectionForm
                connectionType={selectedConnectionType}
                onSubmit={handleCreateConnection}
                onCancel={() => {
                  setShowCreateModal(false);
                  setTestResult(null);
                }}
                onTest={handleTestConfig}
                loading={actionLoading}
                testResult={testResult}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Connection Modal */}
      {showEditModal && selectedConnection && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <ConnectionForm
              connection={selectedConnection}
              connectionType={selectedConnection.type}
              onSubmit={handleEditConnection}
              onCancel={() => {
                setShowEditModal(false);
                setSelectedConnection(null);
                setTestResult(null);
              }}
              onTest={handleTestConfig}
              loading={actionLoading}
              testResult={testResult}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Standard connection card for non-PingOne connections
function StandardConnectionCard({ connection, onTest, onDelete, onEdit }) {
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
      case 'PINGONE':
        return '🔐';
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
          <span className="text-gray-900 ml-1">{connection.serverName || connection.server_name || 'N/A'}</span>
        </div>
        {connection.domain && (
          <div className="text-sm">
            <span className="text-gray-500">Domain:</span>
            <span className="text-gray-900 ml-1">{connection.domain}</span>
          </div>
        )}
        {(connection.lastTested || connection.last_tested) && (
          <div className="text-sm">
            <span className="text-gray-500">Last tested:</span>
            <span className="text-gray-900 ml-1">
              {new Date(connection.lastTested || connection.last_tested).toLocaleString()}
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
          <button
            onClick={() => onEdit(connection)}
            className="inline-flex items-center px-3 py-1.5 text-blue-600 hover:text-blue-800 text-sm"
          >
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