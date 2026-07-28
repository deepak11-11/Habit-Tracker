import React, { useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Calendar, 
  Flame, 
  CheckCircle2, 
  Edit3, 
  Award, 
  Upload, 
  Trash2, 
  Key, 
  Sparkles, 
  Clock, 
  Activity,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useHabits } from '../context/HabitContext';

export const ProfileComponent = () => {
  const { user, updateProfile, updateAvatar, removeAvatar } = useAuth();
  const { habits, completedHistory, stats } = useHabits();
  const [searchParams] = useSearchParams();

  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true');
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Form states
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const fileInputRef = useRef(null);

  // Handle Image Upload & Base64 Conversion with Preview
  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate image format
    const validFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validFormats.includes(file.type)) {
      alert('Supported formats: JPG, JPEG, PNG, WEBP');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      setTimeout(() => {
        const base64Data = event.target.result;
        setPreviewImage(base64Data);
        setIsUploading(false);
      }, 500); // Simulate smooth loading animation
    };
    reader.readAsDataURL(file);
  };

  const handleSavePreviewImage = () => {
    if (previewImage) {
      updateAvatar(previewImage);
      setPreviewImage(null);
    }
  };

  const handleRemoveImage = () => {
    if (window.confirm('Are you sure you want to remove your profile picture?')) {
      removeAvatar();
      setPreviewImage(null);
    }
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateProfile({ name, email });
    setIsEditing(false);
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match!');
      return;
    }
    alert('Password updated successfully!');
    setIsChangePasswordOpen(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // Recent Activity log from completed history
  const recentActivities = [...completedHistory]
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    .slice(0, 5);

  return (
    <div className="profile-page-wrapper">
      {/* Top Banner Profile Card */}
      <div className="glass-panel profile-hero-card">
        <div className="profile-hero-content">
          {/* Avatar Upload Container */}
          <div className="profile-avatar-container">
            <div className="avatar-preview-box">
              <img 
                src={previewImage || user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"} 
                alt={user?.name} 
                className="profile-hero-avatar"
              />
              {isUploading && (
                <div className="avatar-loading-overlay">
                  <div className="spinner" />
                </div>
              )}
            </div>

            <div className="avatar-actions-row">
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={14} />
                <span>Change Image</span>
              </button>

              {user?.avatar && user.avatar.startsWith('data:') && (
                <button 
                  type="button" 
                  className="btn btn-danger btn-sm"
                  onClick={handleRemoveImage}
                  title="Remove Profile Image"
                >
                  <Trash2 size={14} />
                </button>
              )}

              <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/jpeg, image/png, image/webp" 
                style={{ display: 'none' }}
                onChange={handleImageFileChange}
              />
            </div>

            {previewImage && (
              <div className="preview-confirm-bar animate-fadeIn">
                <span className="preview-text">Previewing new image</span>
                <div className="preview-btn-group">
                  <button className="btn btn-primary btn-sm" onClick={handleSavePreviewImage}>
                    <Check size={14} /> Save
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setPreviewImage(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Meta Information */}
          <div className="profile-hero-info">
            <div className="name-badge-wrapper">
              <h2 className="user-hero-name">{user?.name || 'Habit Tracker Master'}</h2>
              <span className="badge badge-purple">
                <Award size={13} /> PRO MEMBER
              </span>
            </div>
            <p className="user-hero-email">
              <Mail size={15} /> {user?.email || 'user@example.com'}
            </p>
            <p className="user-hero-joined">
              <Calendar size={15} /> Joined {user?.joinedDate || '2026-01-15'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="profile-action-buttons">
            <button className="btn btn-secondary" onClick={() => setIsEditing(!isEditing)}>
              <Edit3 size={16} />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
            </button>
            <button className="btn btn-secondary" onClick={() => setIsChangePasswordOpen(true)}>
              <Key size={16} />
              <span>Change Password</span>
            </button>
          </div>
        </div>
      </div>

      {/* Edit Profile Panel */}
      {isEditing && (
        <div className="glass-panel profile-edit-card animate-fadeIn">
          <h3>Edit Profile Information</h3>
          <form onSubmit={handleSaveProfile} className="profile-form-grid">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-actions-row">
              <button type="submit" className="btn btn-primary">Save Profile Details</button>
            </div>
          </form>
        </div>
      )}

      {/* Key Stats Overview Grid */}
      <div className="profile-stats-grid">
        <div className="glass-panel profile-stat-card">
          <CheckCircle2 size={26} color="var(--accent-purple)" />
          <div>
            <h3>{stats.totalHabitsCount}</h3>
            <p>Active Habits</p>
          </div>
        </div>

        <div className="glass-panel profile-stat-card">
          <Activity size={26} color="var(--accent-blue)" />
          <div>
            <h3>{stats.totalCompletedAllTime}</h3>
            <p>Completed History Records</p>
          </div>
        </div>

        <div className="glass-panel profile-stat-card">
          <Flame size={26} color="var(--accent-yellow)" />
          <div>
            <h3>{stats.globalCurrentStreak} Days</h3>
            <p>Current Streak</p>
          </div>
        </div>

        <div className="glass-panel profile-stat-card">
          <Award size={26} color="var(--accent-pink)" />
          <div>
            <h3>{stats.globalLongestStreak} Days</h3>
            <p>Longest Streak Record</p>
          </div>
        </div>
      </div>

      {/* Recent Activity Feed & Achievements */}
      <div className="profile-columns-grid">
        <div className="glass-panel activity-card">
          <div className="column-card-header">
            <Clock size={18} color="var(--accent-purple)" />
            <h3>Recent Completion Activity</h3>
          </div>
          <div className="activity-feed">
            {recentActivities.length === 0 ? (
              <p className="text-muted">No completion logs recorded yet.</p>
            ) : (
              recentActivities.map(act => (
                <div key={act.id} className="activity-item">
                  <div className="activity-dot" style={{ backgroundColor: act.color || 'var(--accent-purple)' }} />
                  <div className="activity-info">
                    <span className="activity-title">{act.title}</span>
                    <span className="activity-date">{act.completedAt}</span>
                  </div>
                  <span className="badge badge-purple">{act.category}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass-panel achievements-card">
          <div className="column-card-header">
            <Sparkles size={18} color="var(--accent-yellow)" />
            <h3>Achievements & Badges</h3>
          </div>
          <div className="achievements-grid">
            <div className="achievement-badge active">
              <Flame size={22} color="var(--accent-yellow)" />
              <span>7 Day Streak</span>
            </div>
            <div className="achievement-badge active">
              <CheckCircle2 size={22} color="var(--accent-green)" />
              <span>100 Completions</span>
            </div>
            <div className="achievement-badge active">
              <Award size={22} color="var(--accent-purple)" />
              <span>Habit Pioneer</span>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {isChangePasswordOpen && (
        <div className="modal-overlay" onClick={() => setIsChangePasswordOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Change Account Password</h3>
              <button className="close-btn" onClick={() => setIsChangePasswordOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleChangePassword} className="modal-form">
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input 
                  type="password" 
                  className="form-input"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input 
                  type="password" 
                  className="form-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input 
                  type="password" 
                  className="form-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsChangePasswordOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .profile-page-wrapper {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .profile-hero-card {
          padding: 2rem;
        }

        .profile-hero-content {
          display: flex;
          align-items: center;
          gap: 2rem;
          position: relative;
        }

        .profile-avatar-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }

        .avatar-preview-box {
          position: relative;
          width: 100px;
          height: 100px;
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .profile-hero-avatar {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border: 3px solid var(--accent-purple);
          border-radius: var(--radius-full);
          box-shadow: var(--shadow-glow);
        }

        .avatar-loading-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .avatar-actions-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-sm {
          padding: 0.35rem 0.75rem;
          font-size: 0.78rem;
        }

        .preview-confirm-bar {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.35rem;
          background: var(--bg-input);
          padding: 0.5rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--accent-purple);
        }

        .preview-text {
          font-size: 0.72rem;
          color: var(--accent-purple);
          font-weight: 700;
        }

        .preview-btn-group {
          display: flex;
          gap: 0.35rem;
        }

        .profile-hero-info {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          flex: 1;
        }

        .name-badge-wrapper {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .user-hero-name {
          font-size: 1.6rem;
          font-weight: 800;
        }

        .user-hero-email, .user-hero-joined {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.88rem;
          color: var(--text-secondary);
        }

        .profile-action-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }

        .profile-edit-card {
          padding: 1.5rem;
        }

        .profile-edit-card h3 {
          margin-bottom: 1rem;
          font-size: 1.1rem;
        }

        .profile-form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .form-actions-row {
          grid-column: 1 / -1;
          display: flex;
          justify-content: flex-end;
        }

        .profile-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.25rem;
        }

        .profile-stat-card {
          padding: 1.35rem;
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }

        .profile-stat-card h3 {
          font-size: 1.45rem;
          font-weight: 800;
        }

        .profile-stat-card p {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .profile-columns-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .activity-card, .achievements-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .column-card-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .column-card-header h3 {
          font-size: 1.05rem;
          font-weight: 700;
        }

        .activity-feed {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .activity-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.6rem;
          background: var(--bg-input);
          border-radius: var(--radius-md);
        }

        .activity-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .activity-info {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .activity-title {
          font-size: 0.88rem;
          font-weight: 700;
        }

        .activity-date {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .achievements-grid {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .achievement-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          background: var(--bg-input);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          font-size: 0.8rem;
          font-weight: 700;
          flex: 1;
          min-width: 100px;
          text-align: center;
        }

        @media (max-width: 900px) {
          .profile-hero-content {
            flex-direction: column;
            align-items: flex-start;
          }
          .profile-action-buttons {
            flex-direction: row;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
