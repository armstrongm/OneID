import { useState, useEffect, useCallback } from 'react';

// Mock API client - replace with your actual API
const mockGroupApiClient = {
  getGroups: async (params = {}) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock data
    return {
      groups: [
        {
          name: 'IT_Admins',
          description: 'IT Administrator group with full system access',
          type: 'Security',
          scope: 'Global',
          memberCount: 5
        },
        {
          name: 'HR_Team',
          description: 'Human Resources team members',
          type: 'Security',
          scope: 'Global',
          memberCount: 3
        },
        {
          name: 'Marketing_List',
          description: 'Marketing distribution list',
          type: 'Distribution',
          scope: 'Universal',
          memberCount: 12
        }
      ],
      total: 3
    };
  },
  
  createGroup: async (groupData) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true };
  },
  
  updateGroup: async (groupName, groupData) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true };
  },
  
  deleteGroup: async (groupName) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true };
  }
};

export function useGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    name: '',
    description: '',
    type: '',
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'name',
    direction: 'asc',
  });

  const fetchGroups = useCallback(async () => {
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

      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      const response = await mockGroupApiClient.getGroups(params);
      
      setGroups(response.groups || []);
      setPagination(prev => ({
        ...prev,
        total: response.total || 0,
        totalPages: Math.ceil((response.total || 0) / prev.limit),
      }));
    } catch (err) {
      setError(err.message);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit, sortConfig]);

  const createGroup = async (groupData) => {
    setLoading(true);
    try {
      const result = await mockGroupApiClient.createGroup(groupData);
      await fetchGroups();
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateGroup = async (groupName, groupData) => {
    setLoading(true);
    try {
      const result = await mockGroupApiClient.updateGroup(groupName, groupData);
      await fetchGroups();
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteGroup = async (groupName) => {
    setLoading(true);
    try {
      const result = await mockGroupApiClient.deleteGroup(groupName);
      await fetchGroups();
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
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      name: '',
      description: '',
      type: '',
    });
  };

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return {
    groups,
    loading,
    error,
    pagination,
    filters,
    sortConfig,
    fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    handleSort,
    handlePageChange,
    handleLimitChange,
    handleFilterChange,
    clearFilters,
  };
}