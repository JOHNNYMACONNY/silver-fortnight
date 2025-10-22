import React from 'react';
import { Outlet } from 'react-router-dom';

const AdminPage: React.FC = () => {
  return (
    <div className="admin-page">
      <h1>Admin Dashboard</h1>
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminPage;
