// lib/useSystemStatus.js (or wherever your file is located)
import { useState, useEffect } from 'react';

// Try one of these import paths - use the one that works:
// Option 1: If api.js is in the same folder
// import { apiClient } from './api';

// Option 2: If api.js is in lib/ folder (most common)
import { apiClient } from '../lib/api';

// Option 3: If api.js is in lib/ and you're also in lib/
// import { apiClient } from './api';

// Option 4: If you don't have apiClient, create a simple fetch
// const apiClient = {
//   getSystemStatus: () => fetch('/api/system/status').then(r => r.json()),
//   getConnections: () => fetch('/api/connections').then(r => r.json())
// };

export function useSystemStatus() {
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSystemStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Fetching system status...');

      // Fetch system status and connections in parallel
      const [statusResponse, connectionsResponse] = await Promise.allSettled([
        apiClient.getSystemStatus(),
        apiClient.getConnections()
      ]);

      // Handle system status
      let status = null;
      if (statusResponse.status === 'fulfilled') {
        status = statusResponse.value;
        console.log('✅ System status fetched:', status);
      } else {
        console.error('❌ System status fetch failed:', statusResponse.reason);
        status = {
          status: 'unknown',
          timestamp: new Date().toISOString(),
          services: {
            database: { status: 'unknown', responseTime: null },
            authentication: { status: 'unknown', responseTime: null },
            api: { status: 'unknown', responseTime: null }
          },
          metrics: {
            uptime: 'Unknown',
            totalUsers: 0,
            activeUsers: 0,
            totalGroups: 0,
            systemLoad: 0,
            memoryUsage: 0
          }
        };
      }

      // Handle connections with proper error handling
      let connections = [];
      if (connectionsResponse.status === 'fulfilled') {
        const connectionsData = connectionsResponse.value;
        console.log('📡 Raw connections data:', connectionsData);
        
        // Handle different response formats safely
        if (Array.isArray(connectionsData)) {
          connections = connectionsData;
        } else if (connectionsData && Array.isArray(connectionsData.connections)) {
          connections = connectionsData.connections;
        } else if (connectionsData && typeof connectionsData === 'object') {
          // Try to extract array from various possible structures
          const possibleArrays = [
            connectionsData.data,
            connectionsData.items,
            connectionsData.results,
            Object.values(connectionsData)
          ].filter(val => Array.isArray(val));
          
          if (possibleArrays.length > 0) {
            connections = possibleArrays[0];
          } else {
            // If it's a single connection object, wrap in array
            connections = [connectionsData];
          }
        }
        
        console.log('✅ Processed connections:', connections);
      } else {
        console.error('❌ Connections fetch failed:', connectionsResponse.reason);
        connections = [];
      }

      // Ensure connections is always an array
      if (!Array.isArray(connections)) {
        console.warn('⚠️ Connections is not an array, converting:', connections);
        connections = [];
      }

      // Calculate connection statistics safely
      const connectedCount = connections.filter(conn => 
        conn && 
        typeof conn === 'object' && 
        conn.status === 'connected'
      ).length;
      
      const totalConnections = connections.length;

      // Enhance status with connection info
      const enhancedStatus = {
        ...status,
        connections: {
          total: totalConnections,
          connected: connectedCount,
          disconnected: totalConnections - connectedCount,
          list: connections
        }
      };

      console.log('✅ Final system status:', enhancedStatus);
      setSystemStatus(enhancedStatus);

    } catch (error) {
      console.error('❌ Failed to fetch system status:', error);
      setError(error.message);
      
      // Set fallback status
      setSystemStatus({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
        services: {},
        metrics: {},
        connections: {
          total: 0,
          connected: 0,
          disconnected: 0,
          list: []
        }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemStatus();

    // Set up polling every 30 seconds
    const interval = setInterval(fetchSystemStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    systemStatus,
    loading,
    error,
    refresh: fetchSystemStatus
  };
}

export default useSystemStatus;