import { useState, useEffect } from 'react';
import { Search, UserPlus, X } from 'lucide-react';

// Mock API for demonstration - replace with actual API calls
const mockApi = {
  getGroupMembers: async (groupName) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
      { username: 'john.doe', displayName: 'John Doe', email: 'john.doe@company.com' },
      { username: 'jane.smith', displayName: 'Jane Smith', email: 'jane.smith@company.com' }
    ];
  },
  
  getAvailableUsers: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
      { username: 'bob.wilson', displayName: 'Bob Wilson', email: 'bob.wilson@company.com' },
      { username: 'alice.brown', displayName: 'Alice Brown', email: 'alice.brown@company.com' }
    ];
  },
  
  addUserToGroup: async (groupName, username) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true };
  },
  
  removeUserFromGroup: async (groupName, username) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true };
  }
};

export function GroupMembersModal({ 
  isOpen, 
  onClose, 
  group, 
  onMemberAdded, 
  onMemberRemoved 
}) {
  const [members, setMembers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);

  useEffect(() => {
    if (isOpen && group) {
      fetchGroupMembers();
      fetchAvailableUsers();
    }
  }, [isOpen, group]);

  const fetchGroupMembers = async () => {
    try {
      const groupMembers = await mockApi.getGroupMembers(group.name || group.cn);
      setMembers(groupMembers);
    } catch (error) {
      console.error('Failed to fetch group members:', error);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const allUsers = await mockApi.getAvailableUsers();
      // Filter out users that are already members
      const nonMembers = allUsers.filter(user => 
        !members.some(member => member.username === user.username)
      );
      setAvailableUsers(nonMembers);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleAddMember = async (user) => {
    setLoading(true);
    try {
      await mockApi.addUserToGroup(group.name || group.cn, user.username);
      await fetchGroupMembers();
      await fetchAvailableUsers();
      onMemberAdded?.(group, user);
      setShowAddUser(false);
    } catch (error) {
      console.error('Failed to add member:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (member) => {
    setLoading(true);
    try {
      await mockApi.removeUserFromGroup(group.name || group.cn, member.username);
      await fetchGroupMembers();
      await fetchAvailableUsers();
      onMemberRemoved?.(group, member);
    } catch (error) {
      console.error('Failed to remove member:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = availableUsers.filter(user =>
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Manage Members - {group?.name || group?.cn}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Current Members */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-900">
                  Current Members ({members.length})
                </h4>
                <button
                  onClick={() => setShowAddUser(!showAddUser)}
                  className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  Add Member
                </button>
              </div>

              <div className="border border-gray-200 rounded-md max-h-48 overflow-y-auto">
                {members.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No members in this group
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {members.map((member) => (
                      <div key={member.username} className="flex items-center justify-between p-3">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {member.displayName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {member.username} • {member.email}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveMember(member)}
                          disabled={loading}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 transition-colors"
                          title="Remove from group"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Add New Members */}
            {showAddUser && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Add New Member
                </h4>
                
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="border border-gray-200 rounded-md max-h-48 overflow-y-auto">
                  {filteredUsers.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      {searchTerm ? 'No users found matching your search' : 'No available users to add'}
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {filteredUsers.slice(0, 20).map((user) => (
                        <div key={user.username} className="flex items-center justify-between p-3">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.displayName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {user.username} • {user.email}
                            </div>
                          </div>
                          <button
                            onClick={() => handleAddMember(user)}
                            disabled={loading}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50 transition-colors"
                            title="Add to group"
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GroupMembersModal;