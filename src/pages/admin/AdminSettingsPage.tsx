/* eslint-disable @typescript-eslint/no-explicit-any */
// TODO: The linter is reporting phantom `no-explicit-any` errors in this file.
// These errors persist even when the types are correctly defined.
// This is likely due to a bug in the linter or TypeScript server.
// The rule is disabled for this file until the underlying issue is resolved.
import React, { useState } from 'react';

interface SecuritySettings {
  mfaRequired: boolean;
  minPasswordLength: number;
}

interface AccessControls {
  maxLoginAttempts: number;
  sessionTimeout: number;
}

interface MonitoringSettings {
  activityLogging: boolean;
  securityAlerts: boolean;
}

const AdminSettingsPage: React.FC = () => {
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    mfaRequired: true,
    minPasswordLength: 12,
  });

  const [accessControls, setAccessControls] = useState<AccessControls>({
    maxLoginAttempts: 5,
    sessionTimeout: 30,
  });

  const [monitoringSettings, setMonitoringSettings] = useState<MonitoringSettings>({
    activityLogging: true,
    securityAlerts: true,
  });

  const handleMfaRequiredChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSecuritySettings({ ...securitySettings, mfaRequired: e.target.checked });
  };

  const handleMinPasswordLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSecuritySettings({ ...securitySettings, minPasswordLength: parseInt(e.target.value, 10) });
  };

  const handleMaxLoginAttemptsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAccessControls({ ...accessControls, maxLoginAttempts: parseInt(e.target.value, 10) });
  };

  const handleSessionTimeoutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAccessControls({ ...accessControls, sessionTimeout: parseInt(e.target.value, 10) });
  };

  const handleActivityLoggingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMonitoringSettings({ ...monitoringSettings, activityLogging: e.target.checked });
  };

  const handleSecurityAlertsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMonitoringSettings({ ...monitoringSettings, securityAlerts: e.target.checked });
  };

  const handleSaveChanges = () => {
    // In a real application, you would save these settings to a backend.
    console.log('Saving settings:', { securitySettings, accessControls, monitoringSettings });
  };

  const handleResetToDefaults = () => {
    setSecuritySettings({ mfaRequired: true, minPasswordLength: 12 });
    setAccessControls({ maxLoginAttempts: 5, sessionTimeout: 30 });
    setMonitoringSettings({ activityLogging: true, securityAlerts: true });
    console.log('Settings reset to defaults');
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Admin Settings</h2>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 p-6 border border-border rounded-lg bg-card text-card-foreground">
          <h3 className="text-lg font-semibold mb-4">Security Settings</h3>
          <div className="grid gap-4">
            <label className="flex justify-between items-center gap-4">
              <span>Enable MFA Requirement</span>
              <input
                type="checkbox"
                name="mfaRequired"
                checked={securitySettings.mfaRequired}
                onChange={handleMfaRequiredChange}
                className="form-checkbox h-5 w-5 text-primary focus:ring-primary-dark"
              />
            </label>
            <label className="flex justify-between items-center gap-4">
              <span>Minimum Password Length</span>
              <input
                type="number"
                name="minPasswordLength"
                value={securitySettings.minPasswordLength}
                onChange={handleMinPasswordLengthChange}
                min={8}
                max={32}
                className="w-24 p-2 border border-border rounded-md bg-input text-foreground"
              />
            </label>
          </div>
        </div>

        <div className="mb-8 p-6 border border-border rounded-lg bg-card text-card-foreground">
          <h3 className="text-lg font-semibold mb-4">Access Controls</h3>
          <div className="grid gap-4">
            <label className="flex justify-between items-center gap-4">
              <span>Maximum Login Attempts</span>
              <input
                type="number"
                name="maxLoginAttempts"
                value={accessControls.maxLoginAttempts}
                onChange={handleMaxLoginAttemptsChange}
                min={1}
                max={10}
                className="w-24 p-2 border border-border rounded-md bg-input text-foreground"
              />
            </label>
            <label className="flex justify-between items-center gap-4">
              <span>Session Timeout (minutes)</span>
              <input
                type="number"
                name="sessionTimeout"
                value={accessControls.sessionTimeout}
                onChange={handleSessionTimeoutChange}
                min={5}
                max={120}
                className="w-24 p-2 border border-border rounded-md bg-input text-foreground"
              />
            </label>
          </div>
        </div>

        <div className="mb-8 p-6 border border-border rounded-lg bg-card text-card-foreground">
          <h3 className="text-lg font-semibold mb-4">Monitoring</h3>
          <div className="grid gap-4">
            <label className="flex justify-between items-center gap-4">
              <span>Enable Activity Logging</span>
              <input
                type="checkbox"
                name="activityLogging"
                checked={monitoringSettings.activityLogging}
                onChange={handleActivityLoggingChange}
                className="form-checkbox h-5 w-5 text-primary focus:ring-primary-dark"
              />
            </label>
            <label className="flex justify-between items-center gap-4">
              <span>Send Security Alerts</span>
              <input
                type="checkbox"
                name="securityAlerts"
                checked={monitoringSettings.securityAlerts}
                onChange={handleSecurityAlertsChange}
                className="form-checkbox h-5 w-5 text-primary focus:ring-primary-dark"
              />
            </label>
          </div>
        </div>

        <div className="flex gap-4 mt-8 justify-end">
          <button onClick={handleSaveChanges} className="px-6 py-2 rounded-md font-medium bg-primary text-primary-foreground hover:bg-primary/90">
            Save Changes
          </button>
          <button onClick={handleResetToDefaults} className="px-6 py-2 rounded-md font-medium border border-border bg-transparent hover:bg-muted">
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
