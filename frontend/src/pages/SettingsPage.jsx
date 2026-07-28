import React from 'react';
import { SettingsComponent } from '../components/Settings';

export const SettingsPage = () => {
  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Application Settings</h1>
          <p className="page-subtitle">Configure theme preferences, export database, or clear application cache</p>
        </div>
      </div>

      <SettingsComponent />
    </div>
  );
};
