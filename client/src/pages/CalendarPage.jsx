import React from 'react';
import { CalendarComponent } from '../components/Calendar';

export const CalendarPage = () => {
  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Monthly Calendar View</h1>
          <p className="page-subtitle">Visual month history with color-coded day completion status</p>
        </div>
      </div>

      <CalendarComponent />
    </div>
  );
};
