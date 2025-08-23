// hooks/useConnections.js
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/api';

export function useConnections() {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchConnections = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getConnections();
      setConnections(response.data || response || []);
    } catch (err) {
      setError(err.message);
      setConnections([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createConnection = async (connectionData) => {
    setLoading(true);
    try {
      const response = await apiClient.createConnection(connectionData);
      await fetchConnections(); // Refresh the list
      return { success: true, data: response };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateConnection = async (connectionId, connectionData) => {
    setLoading(true);
    try {
      const response = await apiClient.updateConnection(connectionId, connectionData);
      await fetchConnections(); // Refresh the list
      return { success: true, data: response };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteConnection = async (connectionId) => {
    setLoading(true);
    try {
      await apiClient.deleteConnection(connectionId);
      await fetchConnections(); // Refresh the list
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async (connectionId) => {
    try {
      const response = await apiClient.testConnection(connectionId);
      return { success: true, data: response };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const testConnectionConfig = async (connectionData) => {
    try {
      const response = await apiClient.testConnectionConfig(connectionData);
      return { success: true, data: response };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  return {
    connections,
    loading,
    error,
    fetchConnections,
    createConnection,
    updateConnection,
    deleteConnection,
    testConnection,
    testConnectionConfig,
  };
}