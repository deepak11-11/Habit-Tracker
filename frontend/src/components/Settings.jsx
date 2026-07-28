import React, { useRef } from 'react';
import { Moon, Sun, Download, Upload, Trash2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useHabits } from '../context/HabitContext';

export const SettingsComponent = () => {
  const { theme, toggleTheme } = useAuth();
  const { resetData, exportJSON, importJSON } = useHabits();
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        importJSON(parsed);
      } catch (err) {
        alert('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="settings-wrapper">
      {/* Theme Settings Card */}
      <div className="glass-panel settings-card">
        <div className="settings-header">
          <div>
            <h3>Appearance & Theme</h3>
            <p>Customize the app's visual look and mode</p>
          </div>
          <button className="btn btn-secondary" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            <span>Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
          </button>
        </div>
      </div>

      {/* Data Management Card */}
      <div className="glass-panel settings-card">
        <div className="settings-header">
          <div>
            <h3>Data Export & Backup</h3>
            <p>Backup or restore your habit tracker database as JSON</p>
          </div>
          <div className="settings-btn-group">
            <button className="btn btn-primary" onClick={exportJSON}>
              <Download size={18} />
              <span>Export Habits JSON</span>
            </button>

            <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
              <Upload size={18} />
              <span>Import Habits JSON</span>
            </button>

            <input 
              type="file" 
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".json"
              onChange={handleFileUpload}
            />
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass-panel settings-card danger-card">
        <div className="settings-header">
          <div>
            <h3 className="danger-title">
              <ShieldAlert size={18} /> Danger Zone
            </h3>
            <p>Permanently remove all habit entries and streak tracking history</p>
          </div>
          <button 
            className="btn btn-danger"
            onClick={() => {
              if (window.confirm('Are you sure you want to reset all habit data? This action cannot be undone.')) {
                resetData();
              }
            }}
          >
            <Trash2 size={18} />
            <span>Reset All Data</span>
          </button>
        </div>
      </div>

      <style>{`
        .settings-wrapper {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .settings-card {
          padding: 1.75rem;
        }

        .settings-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
        }

        .settings-header h3 {
          font-size: 1.15rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }

        .settings-header p {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .settings-btn-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .danger-card {
          border-color: rgba(239, 68, 68, 0.3);
          background: rgba(239, 68, 68, 0.03);
        }

        .danger-title {
          color: var(--accent-red);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        @media (max-width: 768px) {
          .settings-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .settings-btn-group {
            flex-direction: column;
            width: 100%;
          }
          .settings-btn-group button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
