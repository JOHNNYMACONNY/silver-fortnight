import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import {
  getAllUsers,
  getAllTrades,
  getAllCollaborations,
  updateUserRole,
  deleteUser,
  getSystemStats,
  User,
  Trade,
  Collaboration,
} from '../../services/firestore-exports';
import { useToast } from '../../contexts/ToastContext';
import {
  Users,
  ShoppingBag,
  Briefcase,
  MessageSquare,
  BarChart,
  // Shield,
  UserCog
} from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';
import { getProfileImageUrl } from '../../utils/imageUtils';

// Define tab types
type TabType = 'dashboard' | 'users' | 'trades' | 'collaborations';

const AdminDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const { addToast } = useToast();

  // State
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data based on active tab
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        switch (activeTab) {
          case 'dashboard': {
            const { data: systemStats, error: statsError } = await getSystemStats();
            if (statsError) throw new Error(statsError.message);
            setStats(systemStats);
            break;
          }

          case 'users': {
            const { data: usersList, error: usersError } = await getAllUsers();
            if (usersError) throw new Error(usersError.message);
            setUsers(usersList?.items || []);
            break;
          }

          case 'trades': {
            const { data: tradesList, error: tradesError } = await getAllTrades();
            if (tradesError) throw new Error(tradesError.message);
            setTrades(tradesList?.items || []);
            break;
          }

          case 'collaborations': {
            const { data: collaborationsList, error: collaborationsError } = await getAllCollaborations();
            if (collaborationsError) throw new Error(collaborationsError.message);
            setCollaborations(collaborationsList?.items || []);
            break;
          }
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred');
        addToast('error', err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, addToast]);

  // Handle role change
  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin' | 'moderator') => {
    try {
      const { error: updateError } = await updateUserRole(userId, newRole);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Update local state
      setUsers(users.map(user =>
        user.id === userId ? { ...user, role: newRole } : user
      ));

      addToast('success', `User role updated to ${newRole}`);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to update user role');
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (userId: string, userEmail: string) => {
    // Confirm deletion
    const isConfirmed = window.confirm(
      `Are you sure you want to delete user "${userEmail}"?\n\nThis action cannot be undone and will permanently remove all user data.`
    );

    if (!isConfirmed) return;

    try {
      const { error: deleteError } = await deleteUser(userId);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      // Update local state
      setUsers(users.filter(user => user.id !== userId));

      addToast('success', `User "${userEmail}" has been deleted`);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to delete user');
    }
  };

  // Render dashboard stats
  const renderDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats && (
        <>
          <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <Users className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <h3 className="text-2xl font-bold text-foreground">{stats.totalUsers}</h3>
              </div>
            </div>
          </div>

          <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-success/10 text-success">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Trades</p>
                <h3 className="text-2xl font-bold text-foreground">{stats.totalTrades}</h3>
              </div>
            </div>
          </div>

          <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-secondary/10 text-secondary">
                <Briefcase className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Collaborations</p>
                <h3 className="text-2xl font-bold text-foreground">{stats.totalCollaborations}</h3>
              </div>
            </div>
          </div>

          <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-accent/10 text-accent">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Messages</p>
                <h3 className="text-2xl font-bold text-foreground">{stats.totalMessages}</h3>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="md:col-span-2 lg:col-span-4 bg-card p-6 rounded-lg shadow-sm border border-border">
        <h3 className="text-lg font-medium text-foreground mb-4">Recent Activity</h3>
        <p className="text-muted-foreground">
          Welcome to the admin dashboard. Use the tabs above to manage users, trades, and collaborations.
        </p>
      </div>
    </div>
  );

  // Render users table
  const renderUsers = () => (
    <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-lg font-medium text-foreground">Users</h3>
        <p className="text-sm text-muted-foreground">Manage user accounts and roles</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                User
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Email
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Role & Actions
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Joined
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <img className="h-10 w-10 rounded-full" src={getProfileImageUrl(user.photoURL ?? null, 40)} alt={user.displayName || user.email || ''} />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-foreground">{user.displayName || 'No Name'}</div>
                      <div className="text-sm text-muted-foreground">ID: {user.id.substring(0, 8)}...</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-foreground">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.role === 'admin'
                      ? 'bg-destructive/10 text-destructive'
                      : user.role === 'moderator'
                        ? 'bg-accent/10 text-accent'
                        : 'bg-success/10 text-success'
                  }`}>
                    {user.role || 'user'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {user.createdAt ? formatDate(user.createdAt) : 'Unknown'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <select
                      value={user.role || 'user'}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as 'user' | 'admin' | 'moderator')}
                      className="block w-full pl-3 pr-10 py-2 text-base border-border focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-background text-foreground"
                      disabled={user.id === userProfile?.uid}
                    >
                      <option value="user">User</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Admin</option>
                    </select>
                    {user.id !== userProfile?.uid && (
                      <button
                        onClick={() => handleDeleteUser(user.id, user.email || '')}
                        className="text-destructive hover:text-destructive/80"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render trades table
  const renderTrades = () => (
    <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-lg font-medium text-foreground">Trades</h3>
        <p className="text-sm text-muted-foreground">Manage trade listings</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Title
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Category
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                User
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {trades.map((trade) => (
              <tr key={trade.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{trade.offeredSkills.map((s: any) => s.skill).join(', ')}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{trade.requestedSkills.map((s: any) => s.skill).join(', ')}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{trade.creatorId}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    trade.status === 'open'
                      ? 'bg-success/10 text-success'
                      : trade.status === 'in-progress'
                        ? 'bg-accent/10 text-accent'
                        : trade.status === 'pending_confirmation'
                          ? 'bg-secondary/10 text-secondary'
                          : trade.status === 'completed'
                            ? 'bg-primary/10 text-primary'
                            : trade.status === 'disputed'
                              ? 'bg-warning/10 text-warning'
                              : 'bg-destructive/10 text-destructive'
                  }`}>
                    {trade.status === 'open' ? 'open' : trade.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {trade.createdAt ? formatDate(trade.createdAt) : 'Unknown'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render collaborations table
  const renderCollaborations = () => (
    <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-lg font-medium text-foreground">Collaborations</h3>
        <p className="text-sm text-muted-foreground">Manage collaboration listings</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Title
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Category
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Owner
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {collaborations.map((collaboration) => (
              <tr key={collaboration.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{collaboration.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{collaboration.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{collaboration.ownerId}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    collaboration.status === 'open'
                      ? 'bg-success/10 text-success'
                      : collaboration.status === 'in-progress'
                        ? 'bg-accent/10 text-accent'
                        : collaboration.status === 'completed'
                          ? 'bg-secondary/10 text-secondary'
                          : 'bg-destructive/10 text-destructive'
                  }`}>
                    {collaboration.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {collaboration.createdAt ? formatDate(collaboration.createdAt) : 'Unknown'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render content based on active tab
  const renderContent = () => {
    if (loading) {
      return (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
      );
    }

    if (error) {
      return (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
          {error}
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'users':
        return renderUsers();
      case 'trades':
        return renderTrades();
      case 'collaborations':
        return renderCollaborations();
      default:
        return null;
    }
  };

  if (!userProfile || userProfile.role !== 'admin') {
    return (
      <div className="flex-grow flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground">Access Denied</h1>
          <p className="mt-4 text-muted-foreground">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6">
          <h2 className="text-xl font-bold text-foreground">Admin Panel</h2>
        </div>
        <nav className="flex-1 px-4 py-2 space-y-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center w-full px-4 py-2 text-sm font-medium rounded-md ${
              activeTab === 'dashboard' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <BarChart className="mr-3 h-6 w-6" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center w-full px-4 py-2 text-sm font-medium rounded-md ${
              activeTab === 'users' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <Users className="mr-3 h-6 w-6" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('trades')}
            className={`flex items-center w-full px-4 py-2 text-sm font-medium rounded-md ${
              activeTab === 'trades' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <ShoppingBag className="mr-3 h-6 w-6" />
            Trades
          </button>
          <button
            onClick={() => setActiveTab('collaborations')}
            className={`flex items-center w-full px-4 py-2 text-sm font-medium rounded-md ${
              activeTab === 'collaborations' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <Briefcase className="mr-3 h-6 w-6" />
            Collaborations
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-grow p-8">
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;
