import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useSecureAuth } from '../auth/SecureAuthProvider';

const SettingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { clearSecurityState } = useSecureAuth();
  const [notifications, setNotifications] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const handleToggleNotifications = () => {
    setNotifications(!notifications);
  };

  const handleToggleTwoFactor = () => {
    setTwoFactorEnabled(!twoFactorEnabled);
  };

  const handleSecurityReset = () => {
    clearSecurityState();
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="space-y-6">
        {/* Account Settings */}
        <section className="bg-card shadow rounded p-6">
          <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground">Email</label>
              <div className="mt-1">
                <p className="px-3 py-2 bg-muted rounded">{currentUser?.email}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Security Settings */}
        <section className="bg-card shadow rounded p-6">
          <h2 className="text-xl font-semibold mb-4">Security Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-foreground">Two-Factor Authentication</h3>
                <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
              </div>
              <button
                onClick={handleToggleTwoFactor}
                className={`${
                  twoFactorEnabled ? 'bg-primary' : 'bg-muted'
                } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none`}
              >
                <span className={`${
                  twoFactorEnabled ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow transform ring-0 transition ease-in-out duration-200`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-foreground">Email Notifications</h3>
                <p className="text-sm text-muted-foreground">Receive security alerts and updates</p>
              </div>
              <button
                onClick={handleToggleNotifications}
                className={`${
                  notifications ? 'bg-primary' : 'bg-muted'
                } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none`}
              >
                <span className={`${
                  notifications ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow transform ring-0 transition ease-in-out duration-200`} />
              </button>
            </div>

            <div className="pt-4 border-t border-border">
              <button
                onClick={handleSecurityReset}
                className="px-4 py-2 border border-destructive text-destructive rounded hover:bg-destructive/10 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                Reset Security State
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;
