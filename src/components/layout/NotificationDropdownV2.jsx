import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Bell, 
  X, 
  AlertTriangle, 
  Package, 
  Calendar, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Plus, 
  Edit, 
  ShoppingCart, 
  Info, 
  XCircle,
  MoreHorizontal,
  Eye,
  EyeOff,
  Trash2
} from 'lucide-react';
import notificationSystem from '../../services/NotificationSystem';

const ICON_MAP = {
  AlertTriangle,
  Package,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Plus,
  Edit,
  ShoppingCart,
  Info,
  XCircle,
  Bell,
};

/**
 * Professional Notification Dropdown Component
 * Accessible, performant, and user-friendly
 */
export function NotificationDropdown({ 
  isOpen, 
  onClose, 
  onNotificationClick,
  onNotificationCountChange 
}) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread, critical
  const [showActions, setShowActions] = useState(null);

  // Memoized filtered notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;
    
    switch (filter) {
      case 'unread':
        filtered = notifications.filter(n => !n.isRead);
        break;
      case 'critical':
        filtered = notifications.filter(n => n.priority <= 2);
        break;
      default:
        filtered = notifications;
    }
    
    return filtered;
  }, [notifications, filter]);

  // Calculate relative time
  const getRelativeTime = useCallback((timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'Now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }, []);

  // Load notifications
  const loadNotifications = useCallback(() => {
    try {
      const allNotifications = notificationSystem.getNotifications();
      setNotifications(allNotifications);
      
      // Update unread count for parent
      const unreadCount = allNotifications.filter(n => !n.isRead).length;
      onNotificationCountChange?.(unreadCount);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }, [onNotificationCountChange]);

  // Subscribe to notification system changes
  useEffect(() => {
    const unsubscribe = notificationSystem.subscribe(({ event, notification }) => {
      loadNotifications();
      
      // Handle real-time updates
      if (event === 'added' && notification) {
        console.log('🔔 New notification:', notification.title);
      }
    });

    return unsubscribe;
  }, [loadNotifications]);

  // Initialize notification system and load notifications
  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        await notificationSystem.initialize();
        loadNotifications();
      } catch (error) {
        console.error('Failed to initialize notification system:', error);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [loadNotifications]);

  // Handle notification click
  const handleNotificationClick = useCallback((notification) => {
    // Mark as read
    notificationSystem.markAsRead(notification.id);
    
    // Execute action if available
    if (notification.metadata?.action) {
      const { action } = notification.metadata;
      if (action.url) {
        window.location.href = action.url;
      }
    }
    
    // Notify parent
    onNotificationClick?.(notification);
    
    // Close dropdown on mobile
    if (window.innerWidth < 768) {
      onClose();
    }
  }, [onNotificationClick, onClose]);

  // Handle notification dismissal
  const handleDismiss = useCallback((notificationId, event) => {
    event.stopPropagation();
    notificationSystem.dismiss(notificationId);
  }, []);

  // Handle mark as read/unread
  const handleToggleRead = useCallback((notificationId, isRead, event) => {
    event.stopPropagation();
    if (isRead) {
      // For unread action, we'd need to implement markAsUnread
      console.log('Mark as unread not implemented yet');
    } else {
      notificationSystem.markAsRead(notificationId);
    }
  }, []);

  // Handle bulk actions
  const handleMarkAllRead = useCallback(async () => {
    try {
      await notificationSystem.markAllAsRead();
      console.log('✅ All notifications marked as read');
    } catch (error) {
      console.error('❌ Failed to mark all as read:', error);
    }
  }, []);

  const handleClearAll = useCallback(async () => {
    try {
      await notificationSystem.clearAll();
      console.log('✅ All notifications cleared');
    } catch (error) {
      console.error('❌ Failed to clear notifications:', error);
    }
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback((event, notification) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        handleNotificationClick(notification);
        break;
      case 'Delete':
      case 'Backspace':
        event.preventDefault();
        handleDismiss(notification.id, event);
        break;
      default:
        break;
    }
  }, [handleNotificationClick, handleDismiss]);

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
          {filteredNotifications.length > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
              {filteredNotifications.length}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Filter dropdown */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Filter notifications"
          >
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="critical">Critical</option>
          </select>
          
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1"
            aria-label="Close notifications"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Actions */}
      {filteredNotifications.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
          <div className="flex space-x-2">
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            >
              Mark All Read
            </button>
            <button
              onClick={handleClearAll}
              className="text-xs text-red-600 hover:text-red-800 font-medium focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-2 py-1"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Notification List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Bell className="mx-auto h-8 w-8 text-gray-300 mb-2" />
            <p className="text-sm">No notifications</p>
          </div>
        ) : (
          <div role="list" aria-label="Notifications">
            {filteredNotifications.map((notification) => {
              const IconComponent = ICON_MAP[notification.metadata?.icon] || Bell;
              
              return (
                <div
                  key={notification.id}
                  role="listitem"
                  tabIndex={0}
                  className={`
                    relative p-4 border-b border-gray-100 cursor-pointer transition-all duration-200
                    hover:bg-gray-50 focus:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500
                    ${!notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}
                  `}
                  onClick={() => handleNotificationClick(notification)}
                  onKeyDown={(e) => handleKeyDown(e, notification)}
                  aria-describedby={`notification-${notification.id}-description`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${notification.metadata?.color || 'bg-gray-100 text-gray-600'}`}>
                      <IconComponent size={16} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </p>
                          <p 
                            id={`notification-${notification.id}-description`}
                            className="text-sm text-gray-600 mt-1 line-clamp-2"
                          >
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {getRelativeTime(notification.timestamp)}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-1 ml-2">
                          {/* Priority indicator */}
                          {notification.priority <= 2 && (
                            <div 
                              className="w-2 h-2 rounded-full bg-red-500"
                              aria-label="High priority"
                            />
                          )}
                          
                          {/* More actions */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowActions(showActions === notification.id ? null : notification.id);
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              aria-label="More actions"
                            >
                              <MoreHorizontal size={14} />
                            </button>

                            {showActions === notification.id && (
                              <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                                <button
                                  onClick={(e) => handleToggleRead(notification.id, notification.isRead, e)}
                                  className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                >
                                  {notification.isRead ? <EyeOff size={12} /> : <Eye size={12} />}
                                  <span>{notification.isRead ? 'Mark Unread' : 'Mark Read'}</span>
                                </button>
                                <button
                                  onClick={(e) => handleDismiss(notification.id, e)}
                                  className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center space-x-2"
                                >
                                  <Trash2 size={12} />
                                  <span>Dismiss</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action button */}
                      {notification.metadata?.action && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = notification.metadata.action.url;
                          }}
                          className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 bg-blue-50 hover:bg-blue-100"
                        >
                          {notification.metadata.action.label}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationDropdown;