import React, { useState } from 'react';
import { useSecureAuth } from '../../auth/SecureAuthProvider';

interface UserRow {
  id: string;
  email: string;
  role: string;
  lastLogin: string;
  status: 'active' | 'blocked' | 'suspended';
}

const mockUsers: UserRow[] = [
  {
    id: '1',
    email: 'admin@example.com',
    role: 'admin',
    lastLogin: '2025-05-21',
    status: 'active'
  },
  {
    id: '2',
    email: 'user@example.com',
    role: 'user',
    lastLogin: '2025-05-20',
    status: 'active'
  },
  {
    id: '3',
    email: 'blocked@example.com',
    role: 'user',
    lastLogin: '2025-05-19',
    status: 'blocked'
  }
];

const UsersPage: React.FC = () => {
  const { validateSession } = useSecureAuth();
  const [users] = useState<UserRow[]>(mockUsers);

  const handleAction = async (userId: string, action: string) => {
    // Validate session before performing admin actions
    const isValid = await validateSession();
    if (!isValid) {
      return;
    }

    console.log(`Performing ${action} on user ${userId}`);
    // Implement user management actions here
  };

  const getStatusBadgeColor = (status: UserRow['status']) => {
    switch (status) {
      case 'active':
        return 'bg-success-100 text-success-800';
      case 'blocked':
        return 'bg-error-100 text-error-800';
      case 'suspended':
        return 'bg-warning-100 text-warning-800';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      
      <div className="bg-card shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                User
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Role
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Last Login
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-muted/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-card-foreground">{user.email}</div>
                  <div className="text-sm text-muted-foreground">{user.id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-card-foreground">{user.role}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-card-foreground">{user.lastLogin}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(user.status)}`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  <button
                    onClick={() => handleAction(user.id, 'block')}
                    className="text-error-600 hover:text-error-900 mr-4"
                  >
                    Block
                  </button>
                  <button
                    onClick={() => handleAction(user.id, 'reset')}
                    className="text-primary-600 hover:text-primary-900"
                  >
                    Reset Security
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersPage;
