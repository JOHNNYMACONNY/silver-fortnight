import React from 'react';

const AdminPage: React.FC = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-card shadow rounded">
          <h2 className="text-xl mb-2">User Management</h2>
          <p>Manage user accounts and permissions</p>
        </div>
        <div className="p-4 bg-card shadow rounded">
          <h2 className="text-xl mb-2">System Settings</h2>
          <p>Configure system-wide settings</p>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
