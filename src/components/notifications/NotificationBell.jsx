/**
 * ============================================================================
 * NotificationBell - Real-time Notification Bell Icon Component
 * ============================================================================
 * 
 * A React component that displays:
 * - Bell icon in the navigation bar
 * - Unread notification count badge
 * - Real-time updates via Supabase subscriptions
 * - Click to open NotificationPanel
 * 
 * Usage:
 *   <NotificationBell userId={currentUser.id} />
 * 
 * @version 1.0.0
 * @date 2025-10-05
 */

import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { notificationService } from '../../services/notifications/NotificationService.js';
import NotificationPanel from './NotificationPanel.jsx';

const NotificationBell = ({ userId }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const bellRef = useRef(null);
  const panelRef = useRef(null);

  // Load initial unread count
  useEffect(() => {
    if (!userId) return;

    const loadUnreadCount = async () => {
      const count = await notificationService.getUnreadCount(userId);
      setUnreadCount(count);
    };

    loadUnreadCount();
  }, [userId]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = notificationService.subscribeToNotifications(
      userId,
      async () => {
        // Refetch unread count on any notification change
        const count = await notificationService.getUnreadCount(userId);
        setUnreadCount(count);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userId]);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isPanelOpen &&
        bellRef.current &&
        panelRef.current &&
        !bellRef.current.contains(event.target) &&
        !panelRef.current.contains(event.target)
      ) {
        setIsPanelOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPanelOpen]);

  const handleBellClick = () => {
    setIsPanelOpen(!isPanelOpen);
  };

  return (
    <div className="notification-bell-container" style={{ position: 'relative' }}>
      {/* Bell Icon Button */}
      <button
        ref={bellRef}
        onClick={handleBellClick}
        className="notification-bell-button"
        aria-label="Notifications"
        style={{
          position: 'relative',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '8px',
          transition: 'background-color 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <Bell
          size={20}
          color={unreadCount > 0 ? '#2563eb' : '#6b7280'}
          strokeWidth={2}
          style={{
            transition: 'color 0.2s'
          }}
        />
        
        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span
            className="notification-badge"
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              backgroundColor: '#ef4444',
              color: 'white',
              fontSize: '11px',
              fontWeight: 'bold',
              borderRadius: '10px',
              minWidth: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              animation: unreadCount > 0 ? 'pulse-badge 2s infinite' : 'none'
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isPanelOpen && (
        <div ref={panelRef}>
          <NotificationPanel
            userId={userId}
            onClose={() => setIsPanelOpen(false)}
          />
        </div>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes pulse-badge {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }

        .notification-bell-button:focus {
          outline: 2px solid #2563eb;
          outline-offset: 2px;
        }

        .notification-bell-button:active {
          transform: scale(0.95);
        }
      `}</style>
    </div>
  );
};

export default NotificationBell;
