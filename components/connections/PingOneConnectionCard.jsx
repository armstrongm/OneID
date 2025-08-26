// components/connections/PingOneConnectionCard.jsx - Fixed button alignment
import { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Download, 
  Users, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Settings,
  Trash2,
  Eye,
  Calendar,
  Activity
} from 'lucide-react';

export default function PingOneConnectionCard({ 
  connection, 
  onTest, 
  onDelete, 
  onEdit,
  onImport 
}) {
  const [realTimeStatus, setRealTimeStatus] = useState(connection.status);
  const [importing, setImporting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [lastCheck, setLastCheck] = useState(new Date());
  const [importStats, setImportStats] = useState(connection.import_stats);

  // Real-time status checking
  useEffect(() => {
    if (connection.type !== 'PINGONE') return;

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/connections/${connection.id}/status`);
        if (response.ok) {
          const data = await response.json();
          setRealTimeStatus(data.status);
          setLastCheck(new Date());
          
          if (data.importStats) {
            setImportStats(data.importStats);
          }
        }
      } catch (error) {
        console.error('Status check failed:', error);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [connection.id, connection.type]);

  // Handle connection test with proper state management
  const handleTest = async () => {
    if (testing) return;
    
    setTesting(true);
    setRealTimeStatus('testing');
    
    try {
      await onTest(connection.id);
      
      setTimeout(async () => {
        try {
          const response = await fetch(`/api/connections/${connection.id}/status`);
          if (response.ok) {
            const data = await response.json();
            setRealTimeStatus(data.status);
          }
        } catch (error) {
          console.error('Failed to get updated status:', error);
          setRealTimeStatus('error');
        }
      }, 1000);
      
    } catch (error) {
      console.error('Test failed:', error);
      setRealTimeStatus('error');
    } finally {
      setTesting(false);
    }
  };

  const handleImport = async (options = {}) => {
    setImporting(true);
    try {
      const response = await fetch(`/api/connections/${connection.id}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          importUsers: true,
          importGroups: true,
          dryRun: options.dryRun || false,
          ...options
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Import completed:', result);
        setImportStats(result.stats);
        
        if (onImport) {
          onImport(result);
        }
      } else {
        const error = await response.json();
        console.error('Import failed:', error);
      }
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setImporting(false);
    }
  };

  const getStatusIcon = (status) => {
    if (testing) {
      return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
    }
    
    switch (status) {
      case 'connected': 
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': 
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'testing': 
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'syncing':
        return <RefreshCw className="w-5 h-5 text-yellow-500 animate-spin" />;
      default: 
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    if (testing) {
      return 'bg-blue-100 text-blue-800';
    }
    
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'testing':
      case 'syncing':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const config = connection.connection_config || {};
  const syncStatus = connection.sync_status || 'idle';
  const displayStatus = testing ? 'testing' : realTimeStatus;

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <span className="text-2xl mr-3">🔐</span>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{connection.name}</h3>
              <p className="text-sm text-gray-500">PingOne Identity Cloud</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(displayStatus)}
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(displayStatus)}`}>
              {testing ? 'Testing' : displayStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Connection Details */}
      <div className="p-6 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500">Environment:</span>
            <span className="text-gray-900 ml-1 font-mono text-xs">
              {config.environmentId ? `${config.environmentId.substring(0, 8)}...` : '...'}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Region:</span>
            <span className="text-gray-900 ml-1">{config.region || 'Not set'}</span>
          </div>
          <div>
            <span className="text-gray-500">Last checked:</span>
            <span className="text-gray-900 ml-1">{lastCheck.toLocaleTimeString()}</span>
          </div>
          <div>
            <span className="text-gray-500">Auto Sync:</span>
            <span className={`ml-1 ${config.syncEnabled ? 'text-green-600' : 'text-gray-600'}`}>
              {config.syncEnabled ? `Every ${config.syncInterval}m` : 'Disabled'}
            </span>
          </div>
        </div>

        {/* Last Sync Stats */}
        {importStats && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Last Import</span>
              <span className="text-xs text-gray-500">
                {connection.last_sync_at && new Date(connection.last_sync_at).toLocaleDateString()}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Users:</div>
                <div className="text-gray-900">
                  <span className="text-green-600">+{importStats.usersCreated || 0}</span>
                  {importStats.usersUpdated > 0 && (
                    <span className="text-blue-600 ml-1">~{importStats.usersUpdated}</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Groups:</div>
                <div className="text-gray-900">
                  <span className="text-green-600">+{importStats.groupsCreated || 0}</span>
                  {importStats.groupsUpdated > 0 && (
                    <span className="text-blue-600 ml-1">~{importStats.groupsUpdated}</span>
                  )}
                </div>
              </div>
            </div>
            {importStats.errors && importStats.errors.length > 0 && (
              <div className="mt-2 text-xs text-red-600 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {importStats.errors.length} error(s) in last sync
              </div>
            )}
          </div>
        )}

        {/* Sync Status */}
        {syncStatus !== 'idle' && (
          <div className={`mt-3 p-2 rounded text-sm flex items-center ${
            syncStatus === 'running' ? 'bg-yellow-50 text-yellow-800' :
            syncStatus === 'error' ? 'bg-red-50 text-red-800' :
            'bg-green-50 text-green-800'
          }`}>
            {syncStatus === 'running' && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
            {syncStatus === 'error' && <XCircle className="w-4 h-4 mr-2" />}
            {syncStatus === 'completed' && <CheckCircle className="w-4 h-4 mr-2" />}
            <span className="capitalize">{syncStatus.replace('_', ' ')}</span>
          </div>
        )}
      </div>

      {/* Actions Section - FIXED ALIGNMENT */}
      <div className="bg-gray-50 border-t border-gray-200">
        {/* Top Row - Primary Actions */}
        <div className="px-6 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {/* Left side - Test button */}
            <button
              onClick={handleTest}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={testing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
              {testing ? 'Testing...' : 'Test'}
            </button>

            {/* Right side - Import actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleImport({ dryRun: true })}
                className="inline-flex items-center px-3 py-2 border border-blue-300 rounded-md text-sm text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                disabled={importing || displayStatus !== 'connected'}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </button>

              <button
                onClick={() => handleImport()}
                className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                disabled={importing || displayStatus !== 'connected'}
              >
                <Download className={`w-4 h-4 mr-2 ${importing ? 'animate-pulse' : ''}`} />
                {importing ? 'Importing...' : 'Import Now'}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Row - Management Actions - FIXED ALIGNMENT */}
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left side - Status indicator */}
            <div className="flex items-center space-x-2">
              {config.syncEnabled && (
                <div className="inline-flex items-center text-green-600 text-sm" title="Auto-sync enabled">
                  <Activity className="w-4 h-4 mr-1" />
                  <Calendar className="w-3 h-3" />
                  <span className="ml-1 text-xs">Auto Sync</span>
                </div>
              )}
            </div>

            {/* Right side - Edit and Delete buttons - PROPERLY ALIGNED */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => onEdit && onEdit(connection)}
                className="inline-flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <Settings className="w-4 h-4 mr-2" />
                Edit
              </button>
              
              <button
                onClick={() => onDelete && onDelete(connection.id)}
                className="inline-flex items-center px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}