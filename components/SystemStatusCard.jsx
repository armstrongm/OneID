// components/SystemStatusCard.jsx - Fixed version with React import
import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  RefreshCw,
  Server,
  Database,
  Shield,
  Wifi
} from 'lucide-react';

// Simple fallback if you don't have the hook
const useSystemStatus = () => {
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSystemStatus = async () => {
      try {
        setLoading(true);
        setError(null);

        const [statusResponse, connectionsResponse] = await Promise.allSettled([
          fetch('/api/system/status').then(r => r.json()),
          fetch('/api/connections').then(r => r.json())
        ]);

        let status = null;
        if (statusResponse.status === 'fulfilled') {
          status = statusResponse.value;
        } else {
          status = {
            status: 'unknown',
            timestamp: new Date().toISOString(),
            services: {},
            metrics: {}
          };
        }

        let connections = [];
        if (connectionsResponse.status === 'fulfilled') {
          const connectionsData = connectionsResponse.value;
          if (Array.isArray(connectionsData)) {
            connections = connectionsData;
          } else if (connectionsData && Array.isArray(connectionsData.connections)) {
            connections = connectionsData.connections;
          } else {
            connections = [];
          }
        }

        const connectedCount = connections.filter(conn => 
          conn && conn.status === 'connected'
        ).length;

        const enhancedStatus = {
          ...status,
          connections: {
            total: connections.length,
            connected: connectedCount,
            disconnected: connections.length - connectedCount,
            list: connections
          }
        };

        setSystemStatus(enhancedStatus);
      } catch (error) {
        console.error('Failed to fetch system status:', error);
        setError(error.message);
        setSystemStatus({
          status: 'error',
          error: error.message,
          services: {},
          metrics: {},
          connections: { total: 0, connected: 0, disconnected: 0, list: [] }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSystemStatus();
    const interval = setInterval(fetchSystemStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return { systemStatus, loading, error };
};

// Status color functions
const getStatusColor = (status) => {
  switch (status) {
    case 'operational':
      return 'text-green-600';
    case 'degraded':
      return 'text-yellow-600';
    case 'down':
    case 'error':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'operational':
      return CheckCircle;
    case 'degraded':
      return AlertCircle;
    case 'down':
    case 'error':
      return XCircle;
    default:
      return Activity;
  }
};

const getOverallStatusColor = (systemStatus) => {
  if (!systemStatus) return 'text-gray-600';
  
  const status = systemStatus.status;
  switch (status) {
    case 'operational':
      return 'text-green-600 bg-green-100';
    case 'degraded':
      return 'text-yellow-600 bg-yellow-100';
    case 'down':
    case 'error':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

const getOverallStatusText = (systemStatus) => {
  if (!systemStatus) return 'Unknown';
  
  const status = systemStatus.status;
  switch (status) {
    case 'operational':
      return 'All Systems Operational';
    case 'degraded':
      return 'Some Issues Detected';
    case 'down':
      return 'System Outage';
    case 'error':
      return 'Status Check Failed';
    default:
      return 'Unknown Status';
  }
};

export default function SystemStatusCard() {
  const { systemStatus, loading, error } = useSystemStatus();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">System Status</h3>
          <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">System Status</h3>
          <XCircle className="w-5 h-5 text-red-500" />
        </div>
        <div className="text-sm text-red-600">
          Failed to load system status: {error}
        </div>
      </div>
    );
  }

  const overallStatusColor = getOverallStatusColor(systemStatus);
  const overallStatusText = getOverallStatusText(systemStatus);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">System Status</h3>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${overallStatusColor}`}>
            {overallStatusText}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Overall System Health */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <Server className="w-5 h-5 text-gray-500 mr-3" />
            <span className="text-sm font-medium text-gray-900">Overall System</span>
          </div>
          <div className="flex items-center">
            {(() => {
              const StatusIcon = getStatusIcon(systemStatus?.status);
              return <StatusIcon className={`w-4 h-4 mr-2 ${getStatusColor(systemStatus?.status)}`} />;
            })()}
            <span className={`text-sm font-medium ${getStatusColor(systemStatus?.status)}`}>
              {systemStatus?.status || 'Unknown'}
            </span>
          </div>
        </div>

        {/* Individual Services */}
        {systemStatus?.services && Object.entries(systemStatus.services).map(([serviceName, service]) => {
          let ServiceIcon = Server; // Default icon
          
          if (serviceName === 'database') ServiceIcon = Database;
          else if (serviceName === 'authentication') ServiceIcon = Shield;
          else if (serviceName === 'api') ServiceIcon = Activity;
          else if (serviceName === 'pingone') ServiceIcon = Wifi;
          
          const StatusIcon = getStatusIcon(service?.status);
          
          return (
            <div key={serviceName} className="flex items-center justify-between">
              <div className="flex items-center">
                <ServiceIcon className="w-4 h-4 text-gray-500 mr-3" />
                <span className="text-sm text-gray-700 capitalize">
                  {serviceName.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              </div>
              <div className="flex items-center">
                <StatusIcon className={`w-4 h-4 mr-2 ${getStatusColor(service?.status)}`} />
                <span className={`text-sm ${getStatusColor(service?.status)}`}>
                  {service?.status || 'Unknown'}
                </span>
                {service?.responseTime && (
                  <span className="text-xs text-gray-500 ml-2">
                    ({service.responseTime}ms)
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Connections Status */}
        {systemStatus?.connections && (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Wifi className="w-4 h-4 text-gray-500 mr-3" />
              <span className="text-sm text-gray-700">Connections</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-600">
                {systemStatus.connections.connected}/{systemStatus.connections.total} Connected
              </span>
            </div>
          </div>
        )}

        {/* Metrics */}
        {systemStatus?.metrics && (
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">System Metrics</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {systemStatus.metrics.totalUsers && (
                <div>
                  <span className="text-gray-500">Users:</span>
                  <span className="font-medium text-gray-900 ml-1">
                    {systemStatus.metrics.totalUsers}
                  </span>
                </div>
              )}
              {systemStatus.metrics.uptime && (
                <div>
                  <span className="text-gray-500">Uptime:</span>
                  <span className="font-medium text-gray-900 ml-1">
                    {systemStatus.metrics.uptime}
                  </span>
                </div>
              )}
              {systemStatus.metrics.systemLoad !== undefined && (
                <div>
                  <span className="text-gray-500">Load:</span>
                  <span className="font-medium text-gray-900 ml-1">
                    {systemStatus.metrics.systemLoad}%
                  </span>
                </div>
              )}
              {systemStatus.metrics.memoryUsage !== undefined && (
                <div>
                  <span className="text-gray-500">Memory:</span>
                  <span className="font-medium text-gray-900 ml-1">
                    {systemStatus.metrics.memoryUsage}%
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Last Updated */}
        {systemStatus?.timestamp && (
          <div className="pt-2 text-xs text-gray-500 text-center">
            Last updated: {new Date(systemStatus.timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}