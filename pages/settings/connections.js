// pages/settings/connections.js - COMPLETE FIXED VERSION
import { useState, useEffect } from 'react';
import { Plus, RefreshCw, Settings, Trash2, TestTube } from 'lucide-react';

// Import your components
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
  const [selectedConnectionType, setSelectedConnectionType] = useState('PINGONE');
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

  const handleTest = async (connectionId) => {
  console.log('=== FRONTEND TEST START ===');
  console.log('Connection ID:', connectionId);
 // ADD THESE DEBUG LINES
  console.log('🐛 ALL CONNECTIONS:', connections);
  console.log('🐛 CONNECTIONS LENGTH:', connections.length);
  try {
    const connection = connections.find(c => c.id === connectionId);

    // ADD MORE DEBUG
    console.log('🐛 FOUND CONNECTION:', connection);
    console.log('🔑 Client Secret:', connection?.clientSecret);
    console.log('🆔 Client ID:', connection?.clientId);
    console.log('🌍 Environment ID:', connection?.environmentId);
    if (!connection) {
      console.error('Connection not found:', connectionId);
      return;
    }

    console.log('Connection found:', connection.name);
    console.log('Connection type:', connection.type);
    console.log('Full connection data:', connection);

    setActionLoading(true);
    setTestResult(null);

    // FIXED: Prepare test data based on connection type with proper field mapping
    let testData;
    
    if (connection.type === 'PINGONE') {
      console.log('Preparing PingOne test data...');
      
      // CRITICAL FIX: Handle both connection formats
      // Check for data in connection_config first, then direct properties
      const config = connection.connection_config || {};
      
      testData = {
        type: 'PINGONE',
        // Try connection_config first, then direct properties
        clientId: config.clientId || connection.clientId,
        clientSecret: config.clientSecret || connection.clientSecret,
        environmentId: config.environmentId || connection.environmentId,
        region: config.region || connection.region,
        scopes: config.scopes || connection.scopes
      };

      console.log('Test data prepared:', {
        type: testData.type,
        clientId: testData.clientId ? `${testData.clientId.substring(0, 8)}...` : 'MISSING',
        clientSecret: testData.clientSecret ? 'PROVIDED' : 'MISSING',
        environmentId: testData.environmentId ? `${testData.environmentId.substring(0, 8)}...` : 'MISSING',
        region: testData.region || 'MISSING'
      });

      // Validate required fields
      if (!testData.clientId || !testData.clientSecret || !testData.environmentId) {
        console.error('❌ Missing required PingOne credentials:', {
          clientId: !!testData.clientId,
          clientSecret: !!testData.clientSecret,
          environmentId: !!testData.environmentId
        });
        
        setTestResult({
          success: false,
          message: 'Missing required PingOne credentials',
          error: 'invalid_client',
          details: {
            clientId: testData.clientId ? 'PROVIDED' : 'MISSING',
            clientSecret: testData.clientSecret ? 'PROVIDED' : 'MISSING', 
            environmentId: testData.environmentId ? 'PROVIDED' : 'MISSING'
          }
        });
        return;
      }

    } else {
      // Traditional connection types
      testData = {
        name: connection.name,
        type: connection.type,
        serverName: connection.serverName || connection.server,
        domain: connection.domain,
        baseDN: connection.baseDN,
        username: connection.username,
        password: connection.password
      };
    }

    console.log('Sending test request...');

    const response = await fetch('/api/connections/test-config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    console.log('Test response status:', response.status);
    
    const result = await response.json();
    console.log('Test result:', result);

    setTestResult(result);

    // Update connection status if test is successful
    if (response.ok && result.success) {
      console.log('✅ Test successful - updating connection status...');
      
      try {
        const updateResponse = await fetch(`/api/connections/${connectionId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'connected',
            lastTested: new Date().toISOString()
          }),
        });

        if (updateResponse.ok) {
          console.log('✅ Connection status updated to connected');
          setTimeout(fetchConnections, 1000);
        } else {
          console.error('❌ Failed to update connection status');
        }
      } catch (updateError) {
        console.error('❌ Error updating connection status:', updateError);
      }
    } else {
      console.error('❌ Test failed:', result.message || result.error);
    }

  } catch (error) {
    console.error('=== FRONTEND TEST ERROR ===', error);
    setTestResult({
      success: false,
      message: 'Test request failed',
      error: error.message
    });
  } finally {
    setActionLoading(false);
    console.log('=== FRONTEND TEST END ===');
  }
};

// ALSO - Debug your connection data by adding this test function:

const debugConnectionData = (connectionId) => {
  const connection = connections.find(c => c.id === connectionId);
  console.log('=== CONNECTION DEBUG ===');
  console.log('Connection ID:', connectionId);
  console.log('Full connection object:', connection);
  console.log('Connection keys:', Object.keys(connection || {}));
  console.log('Has connection_config?', !!connection?.connection_config);
  console.log('Connection_config keys:', Object.keys(connection?.connection_config || {}));
  console.log('Direct clientId:', connection?.clientId);
  console.log('Config clientId:', connection?.connection_config?.clientId);
  console.log('Direct clientSecret:', connection?.clientSecret ? 'PROVIDED' : 'MISSING');
  console.log('Config clientSecret:', connection?.connection_config?.clientSecret ? 'PROVIDED' : 'MISSING');
  console.log('=== END DEBUG ===');
};

// Add a debug button to your connection card temporarily:
// <button onClick={() => debugConnectionData(connection.id)}>Debug</button>




// The issue is that getAllConnections() was removing the actual clientSecret 
// and replacing it with '[SAVED]', so when the test runs, it gets '[SAVED]' 
// instead of the real client secret.

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

  const handleEdit = (connection) => {
    console.log('Editing connection:', connection);
    setSelectedConnection(connection);
    setSelectedConnectionType(connection.type);
    setShowEditModal(true);
    setTestResult(null);
  };

  const handleImport = (result) => {
    console.log('Import completed:', result);
    fetchConnections();
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

  // FIXED: Safe renderConnectionCard function with all handlers in scope
  const renderConnectionCard = (connection) => {
    // Safety check - ensure connection exists and has required properties
    if (!connection || !connection.id || !connection.type) {
      console.error('Invalid connection data:', connection);
      return (
        <div key={connection?.id || Math.random()} className="p-4 border border-red-200 rounded-lg bg-red-50">
          <div className="text-red-800 font-medium">Invalid Connection Data</div>
          <div className="text-red-600 text-sm">Connection data is missing or corrupted</div>
        </div>
      );
    }

    try {
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
          <div key={connection.id} className="bg-white rounded-lg shadow border border-gray-200 p-6">
            {/* Connection Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Settings className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{connection.name}</h3>
                  <p className="text-sm text-gray-500">{connection.type}</p>
                </div>
              </div>
              
              {/* Status Badge */}
              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                connection.status === 'connected' 
                  ? 'bg-green-100 text-green-800'
                  : connection.status === 'error'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {connection.status || 'created'}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => handleTest(connection.id)}
                disabled={actionLoading}
                className="flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50"
              >
                <TestTube className="w-4 h-4 mr-1" />
                Test
              </button>
              
              <button
                onClick={() => handleEdit(connection)}
                className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100"
              >
                Edit
              </button>
              
              <button
                onClick={() => handleDelete(connection.id)}
                disabled={actionLoading}
                className="flex items-center px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </button>
            </div>
          </div>
        );
      }
    } catch (error) {
      console.error('Error rendering connection card:', error, connection);
      return (
        <div key={connection.id} className="p-4 border border-red-200 rounded-lg bg-red-50">
          <div className="text-red-800 font-medium">Render Error</div>
          <div className="text-red-600 text-sm">
            Failed to render connection: {connection.name}
          </div>
          <div className="text-red-500 text-xs mt-1">
            {error.message}
          </div>
        </div>
      );
    }
  };

  // Safety check for connections array
  const safeConnections = Array.isArray(connections) ? connections : [];

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
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Connection
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="text-red-800 font-medium">Error loading connections</div>
          <div className="text-red-600 text-sm">{error}</div>
        </div>
      )}

      {/* Connections Grid */}
      {safeConnections.length === 0 ? (
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
          {safeConnections.map(renderConnectionCard)}
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