import { Edit, Trash2, UserPlus, Users } from 'lucide-react';

// Table header component with sorting
function TableHeader({ children, sortable, sortKey, sortConfig, onSort, className = '' }) {
  const handleSort = () => {
    if (sortable && onSort) {
      onSort(sortKey);
    }
  };

  const getSortIcon = () => {
    if (!sortable) return null;
    
    if (sortConfig?.key === sortKey) {
      return sortConfig.direction === 'asc' ? '↑' : '↓';
    }
    return '↕';
  };

  return (
    <th
      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
        sortable ? 'cursor-pointer hover:bg-gray-100 select-none' : ''
      } ${className}`}
      onClick={handleSort}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortable && (
          <span className="text-gray-400 text-sm">
            {getSortIcon()}
          </span>
        )}
      </div>
    </th>
  );
}

// Main GroupTable component
export function GroupTable({ 
  groups = [], 
  loading = false, 
  sortConfig, 
  onSort, 
  onEdit, 
  onDelete,
  onManageMembers 
}) {
  
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading groups...</span>
        </div>
      </div>
    );
  }

  // Empty state
  if (!groups || groups.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No groups found</h3>
        <p className="mt-1 text-sm text-gray-500">
          No groups match your current filters.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <TableHeader 
              sortable 
              sortKey="name" 
              sortConfig={sortConfig} 
              onSort={onSort}
            >
              Group Name
            </TableHeader>
            <TableHeader 
              sortable 
              sortKey="description" 
              sortConfig={sortConfig} 
              onSort={onSort}
            >
              Description
            </TableHeader>
            <TableHeader 
              sortable 
              sortKey="type" 
              sortConfig={sortConfig} 
              onSort={onSort}
            >
              Type
            </TableHeader>
            <TableHeader 
              sortable 
              sortKey="scope" 
              sortConfig={sortConfig} 
              onSort={onSort}
            >
              Scope
            </TableHeader>
            <TableHeader>
              Members
            </TableHeader>
            <TableHeader>
              Actions
            </TableHeader>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {groups.map((group, index) => {
            // Handle different group data formats
            const groupName = group.name || group.cn || 'N/A';
            const description = group.description || 'N/A';
            const groupType = group.type || group.groupType || 'Security';
            const groupScope = group.scope || group.groupScope || 'Global';
            const memberCount = group.memberCount || group.members?.length || 0;

            return (
              <tr key={group.id || groupName || index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {groupName}
                  </div>
                </td>
                
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs truncate" title={description}>
                    {description}
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    groupType === 'Security' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {groupType}
                  </span>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {groupScope}
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-600">
                    {memberCount} members
                  </span>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onManageMembers && onManageMembers(group)}
                      className="text-green-600 hover:text-green-900 transition-colors p-1 rounded hover:bg-green-50"
                      title="Manage members"
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit && onEdit(group)}
                      className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded hover:bg-blue-50"
                      title="Edit group"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete && onDelete(group)}
                      className="text-red-600 hover:text-red-900 transition-colors p-1 rounded hover:bg-red-50"
                      title="Delete group"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default GroupTable;