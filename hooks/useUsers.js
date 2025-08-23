import { useState, useEffect, useCallback } from 'react';

// Mock API client - replace with your actual API
const mockApiClient = {
  getUsers: async (params = {}) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock data
    return {
      users: [
        {
          username: 'john.doe',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@company.com',
          department: 'IT',
          title: 'Developer',
          enabled: true,
          locked: false
        },
        {
          username: 'jane.smith',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@company.com',
          department: 'HR',
          title: 'Manager',
          enabled: true,
          locked: false
        }
      ],
      total: 2
    };
  },
  
  createUser: async (userData) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true };
  },
  
  updateUser: async (username, userData) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true };
  },
  
  deleteUser: async (username) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true };
  }
};

export function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    department: '',
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'username',
    direction: 'asc',
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
      };

      // Remove empty filter values
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      const response = await mockApiClient.getUsers(params);
      
      setUsers(response.users || []);
      setPagination(prev => ({
        ...prev,
        total: response.total || 0,
        totalPages: Math.ceil((response.total || 0) / prev.limit),
      }));
    } catch (err) {
      setError(err.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit, sortConfig]);

  const createUser = async (userData) => {
    setLoading(true);
    try {
      const result = await mockApiClient.createUser(userData);
      await fetchUsers(); // Refresh the list
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (username, userData) => {
    setLoading(true);
    try {
      const result = await mockApiClient.updateUser(username, userData);
      await fetchUsers(); // Refresh the list
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (username) => {
    setLoading(true);
    try {
      const result = await mockApiClient.deleteUser(username);
      await fetchUsers(); // Refresh the list
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleLimitChange = (limit) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }));
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const clearFilters = () => {
    setFilters({
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      department: '',
    });
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    pagination,
    filters,
    sortConfig,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    handleSort,
    handlePageChange,
    handleLimitChange,
    handleFilterChange,
    clearFilters,
  };
}