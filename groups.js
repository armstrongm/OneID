import { useState, useEffect } from 'react';
import { PlusIcon } from 'lucide-react';
import { useGroups } from '../hooks/useGroups';
import { GroupTable } from '../components/groups/GroupTable';
import { GroupForm } from '../components/groups/GroupForm';
import { GroupMembersModal } from '../components/groups/GroupMembersModal';
import { SearchFilter } from '../components/ui/SearchFilter';
import { Pagination } from '../components/ui/Pagination';
import { Modal } from '../components/ui/Modal';

// Client-only wrapper component
function ClientOnly({ children, fallback = null }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return fallback;
  }

  return children;
}

// Loading skeleton component
function GroupsLoadingSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="h-8 bg-gray-300 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-80"></div>
        </div>
        <div className="h-10 bg-gray-300 rounded w-32"></div>
      </div>

      {/* Search filter skeleton */}
      <div className="bg-white p-4 border border-gray-200 rounded-lg mb-4">
        <div className="h-6 bg-gray-300 rounded w-40 mb-3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
              <div className="h-10 bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Table skeleton */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4">
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex space-x-4">
                <div className="h-4 bg-gray-200 rounded flex-1"></div>
                <div className="h-4 bg-gray-200 rounded flex-1"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Error boundary component for groups
function GroupsErrorBoundary({ error, onRetry }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <div className="text-red-800">
        <h3 className="text-lg font-medium mb-2">Failed to load groups</h3>
        <p className="text-sm mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Retry Loading Groups
        </button>
      </div>
    </div>
  );
}

// Main Groups Page Component
export default function GroupsPage() {
  const [mounted, setMounted] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const {
    groups,
    loading,
    error,
    pagination,
    filters,
    sortConfig,
    createGroup,
    updateGroup,
    deleteGroup,
    handleSort,
    handlePageChange,
    handleLimitChange,
    handleFilterChange,
    clearFilters,
    fetchGroups,
  } = useGroups();

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Search filter field configuration
  const searchFields = [
    { key: 'name', label: 'Group Name', placeholder: 'Search by group name...' },
    { key: 'description', label: 'Description', placeholder: 'Search by description...' },
    { key: 'type', label: 'Type', placeholder: 'Search by type...' },
  ];

  // Event handlers
  const handleCreateGroup = async (groupData) => {
    setActionLoading(true);
    try {
      const result = await createGroup(groupData);
      if (result.success) {
        setShowCreateModal(false);
        console.log('Group created successfully');
      } else {
        console.error('Failed to create group:', result.error);
      }
    } catch (err) {
      console.error('Error creating group:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateGroup = async (groupData) => {
    if (!selectedGroup) return;
    
    setActionLoading(true);
    try {
      const result = await updateGroup(selectedGroup.name || selectedGroup.cn, groupData);
      if (result.success) {
        setShowEditModal(false);
        setSelectedGroup(null);
        console.log('Group updated successfully');
      } else {
        console.error('Failed to update group:', result.error);
      }
    } catch (err) {
      console.error('Error updating group:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup) return;
    
    setActionLoading(true);
    try {
      const result = await deleteGroup(selectedGroup.name || selectedGroup.cn);
      if (result.success) {
        setShowDeleteModal(false);
        setSelectedGroup(null);
        console.log('Group deleted successfully');
      } else {
        console.error('Failed to delete group:', result.error);
      }
    } catch (err) {
      console.error('Error deleting group:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (group) => {
    setSelectedGroup(group);
    setShowEditModal(true);
  };

  const handleDelete = (group) => {
    setSelectedGroup(group);
    setShowDeleteModal(true);
  };

  const handleManageMembers = (group) => {
    setSelectedGroup(group);
    setShowMembersModal(true);
  };

  const handleRetry = () => {
    fetchGroups();
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedGroup(null);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedGroup(null);
  };

  const handleCloseMembersModal = () => {
    setShowMembersModal(false);
    setSelectedGroup(null);
  };

  // Show loading skeleton during initial mount
  if (!mounted) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <GroupsLoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Group Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage Active Directory groups and memberships
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Create Group
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6">
          <GroupsErrorBoundary error={error} onRetry={handleRetry} />
        </div>
      )}

      {/* Search and Filters - Only show when not in error state */}
      {!error && (
        <ClientOnly fallback={<div className="h-32 bg-gray-100 animate-pulse rounded-lg mb-4"></div>}>
          <SearchFilter
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={clearFilters}
            fields={searchFields}
          />
        </ClientOnly>
      )}

      {/* Groups Table and Pagination - Only show when not in error state */}
      {!error && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <ClientOnly 
            fallback={
              <div className="p-8">
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex space-x-4">
                      <div className="h-4 bg-gray-200 rounded flex-1"></div>
                      <div className="h-4 bg-gray-200 rounded flex-1"></div>
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                    </div>
                  ))}
                </div>
              </div>
            }
          >
            <GroupTable
              groups={groups}
              loading={loading}
              sortConfig={sortConfig}
              onSort={handleSort}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onManageMembers={handleManageMembers}
            />
            
            {groups.length > 0 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                itemsPerPage={pagination.limit}
                totalItems={pagination.total}
                onItemsPerPageChange={handleLimitChange}
              />
            )}
          </ClientOnly>
        </div>
      )}

      {/* Create Group Modal */}
      <ClientOnly>
        <Modal
          isOpen={showCreateModal}
          onClose={handleCloseCreateModal}
          title="Create New Group"
          size="lg"
        >
          <GroupForm
            onSubmit={handleCreateGroup}
            onCancel={handleCloseCreateModal}
            loading={actionLoading}
          />
        </Modal>
      </ClientOnly>

      {/* Edit Group Modal */}
      <ClientOnly>
        <Modal
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          title="Edit Group"
          size="lg"
        >
          <GroupForm
            group={selectedGroup}
            onSubmit={handleUpdateGroup}
            onCancel={handleCloseEditModal}
            loading={actionLoading}
          />
        </Modal>
      </ClientOnly>

      {/* Delete Confirmation Modal */}
      <ClientOnly>
        <Modal
          isOpen={showDeleteModal}
          onClose={handleCloseDeleteModal}
          title="Delete Group"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete the group{' '}
              <strong className="text-gray-900">
                {selectedGroup?.name || selectedGroup?.cn}
              </strong>
              ? This action cannot be undone and will remove all group memberships.
            </p>
            
            {selectedGroup && (
              <div className="bg-gray-50 rounded-md p-3">
                <div className="text-xs text-gray-500 mb-1">Group Details:</div>
                <div className="text-sm">
                  <div><strong>Name:</strong> {selectedGroup.name || selectedGroup.cn}</div>
                  <div><strong>Type:</strong> {selectedGroup.type || selectedGroup.groupType || 'Security'}</div>
                  <div><strong>Scope:</strong> {selectedGroup.scope || selectedGroup.groupScope || 'Global'}</div>
                  <div><strong>Description:</strong> {selectedGroup.description || 'N/A'}</div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={handleCloseDeleteModal}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteGroup}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </span>
                ) : (
                  'Delete Group'
                )}
              </button>
            </div>
          </div>
        </Modal>
      </ClientOnly>

      {/* Group Members Modal */}
      <ClientOnly>
        <GroupMembersModal
          isOpen={showMembersModal}
          onClose={handleCloseMembersModal}
          group={selectedGroup}
          onMemberAdded={() => {
            // Refresh groups list if needed
            fetchGroups();
          }}
          onMemberRemoved={() => {
            // Refresh groups list if needed
            fetchGroups();
          }}
        />
      </ClientOnly>
    </div>
  );
}

GroupsPage.displayName = 'GroupsPage';