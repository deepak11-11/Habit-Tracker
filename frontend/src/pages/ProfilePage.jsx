import React from 'react';
import { ProfileComponent } from '../components/Profile';

export const ProfilePage = () => {
  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">User Account & Profile</h1>
          <p className="page-subtitle">Manage personal profile details, member badge, and active streak totals</p>
        </div>
      </div>

      <ProfileComponent />
    </div>
  );
};
