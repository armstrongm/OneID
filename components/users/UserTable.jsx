import { Edit, Trash2, User } from 'lucide-react';

// Status badge component
function StatusBadge({ status, type = 'status' }) {
  const getStatusStyles = () => {
    if (type === 'enabled') {
      return status 
        ? 'bg-green-100 text-green-800 border-green-200'
        : 'bg-red-100 text-red-800 border-red-200';
    }
    
    if (type === 'locked') {
      return status 
        ? 'bg-red-100 text-red-800 border-red-200'
        : 'bg-green-100 text-green-800 border-green-200';
    }

    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusText = () => {
    if (type === 'enabled') {
      return status ? 'Enabled' : 'Disabled';
    }
    
    if (type === 'locked') {
      return status ? 'Locked' : 'Unlocked';
    }

    return status?.toString() || 'Unknown';
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyles()}`}>
      {getStatusText()}
    </span>
  );
}

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

// Main UserTable component
export function UserTable({ 
  users = [], 
  loading = false, 
  sortConfig, 
  onSort, 
  onEdit, 
  onDelete 
}) {
  
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading users...</span>
        </div>
      </div>
    );
  }

  // Empty state
  if (!users || users.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
        <p className="mt-1 text-sm text-gray-500">
          No users match your current filters.
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
              sortKey="username" 
              sortConfig={sortConfig} 
              onSort={onSort}
            >
              Username
            </TableHeader>
            <TableHeader 
              sortable 
              sortKey="displayName" 
              sortConfig={sortConfig} 
              onSort={onSort}
            >
              Display Name
            </TableHeader>
            <TableHeader 
              sortable 
              sortKey="email" 
              sortConfig={sortConfig} 
              onSort={onSort}
            >
              Email
            </TableHeader>
            <TableHeader 
              sortable 
              sortKey="department" 
              sortConfig={sortConfig} 
              onSort={onSort}
            >
              Department
            </TableHeader>
            <TableHeader 
              sortable 
              sortKey="title" 
              sortConfig={sortConfig} 
              onSort={onSort}
            >
              Title
            </TableHeader>
            <TableHeader>
              Status
            </TableHeader>
            <TableHeader>
              Actions
            </TableHeader>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {users.map((user, index) => {
            // Handle different user data formats
            const username = user.username || user.sAMAccountName || 'N/A';
            const displayName = user.displayName || 
              `${user.firstName || user.givenName || ''} ${user.lastName || user.sn || ''}`.trim() || 
              'N/A';
            const email = user.email || user.mail || 'N/A';
            const department = user.department || 'N/A';
            const title = user.title || 'N/A';
            const isEnabled = user.enabled !== undefined ? user.enabled : user.isEnabled;
            const isLocked = user.locked || user.isLocked;

            return (
              <tr key={user.id || username || index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {username}
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {displayName}
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {email}
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {department}
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {title}
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <StatusBadge 
                      status={isEnabled} 
                      type="enabled" 
                    />
                    {isLocked && (
                      <StatusBadge 
                        status={isLocked} 
                        type="locked" 
                      />
                    )}
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEdit && onEdit(user)}
                      className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded hover:bg-blue-50"
                      title="Edit user"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete && onDelete(user)}
                      className="text-red-600 hover:text-red-900 transition-colors p-1 rounded hover:bg-red-50"
                      title="Delete user"
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

export default UserTable;