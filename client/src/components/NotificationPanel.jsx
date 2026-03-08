import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { deleteNotification, markOneRead, markAllRead } from '../app/notificationSlice';
import {
  IoClose,
  IoAlertCircle,
  IoAlertCircleOutline,
  IoFlag,
  IoTime,
  IoTrophy,
  IoBarChart,
  IoClipboard,
  IoCash,
  IoRefresh,
  IoWallet,
  IoSave,
  IoInformationCircle,
  IoShieldCheckmark,
  IoNotificationsOutline,
  IoCheckmarkDone,
} from 'react-icons/io5';

const TYPE_CONFIG = {
  budget_alert:      { Icon: IoAlertCircleOutline, color: '#f59e0b', bg: '#fffbeb', label: 'Budget Alert' },
  budget_exceeded:   { Icon: IoAlertCircle,        color: '#ef4444', bg: '#fef2f2', label: 'Budget Exceeded' },
  goal_milestone:    { Icon: IoFlag,               color: '#3b82f6', bg: '#eff6ff', label: 'Goal Milestone' },
  goal_deadline:     { Icon: IoTime,               color: '#f97316', bg: '#fff7ed', label: 'Deadline' },
  goal_completed:    { Icon: IoTrophy,             color: '#10b981', bg: '#ecfdf5', label: 'Goal Completed' },
  monthly_report:    { Icon: IoBarChart,           color: '#6366f1', bg: '#eef2ff', label: 'Monthly Report' },
  weekly_report:     { Icon: IoClipboard,          color: '#8b5cf6', bg: '#f5f3ff', label: 'Weekly Report' },
  large_expense:     { Icon: IoCash,               color: '#ef4444', bg: '#fef2f2', label: 'Large Expense' },
  recurring_payment: { Icon: IoRefresh,            color: '#06b6d4', bg: '#ecfeff', label: 'Recurring' },
  low_balance:       { Icon: IoWallet,             color: '#f59e0b', bg: '#fffbeb', label: 'Low Balance' },
  savings_reminder:  { Icon: IoSave,           color: '#10b981', bg: '#ecfdf5', label: 'Savings' },
  system_update:     { Icon: IoInformationCircle,  color: '#6b7280', bg: '#f9fafb', label: 'System' },
  security_alert:    { Icon: IoShieldCheckmark,    color: '#ef4444', bg: '#fef2f2', label: 'Security' },
};

const DEFAULT_CONFIG = { Icon: IoInformationCircle, color: '#6b7280', bg: '#f9fafb', label: 'Info' };

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function NotificationItem({ notification, onDelete, onRead }) {
  const config = TYPE_CONFIG[notification.type] || DEFAULT_CONFIG;
  const { Icon, color, bg } = config;
  const isUnread = !notification.isRead;

  return (
    <div
      onClick={() => isUnread && onRead(notification._id)}
      style={{
        display: 'flex',
        gap: 12,
        padding: '12px 16px',
        borderBottom: '1px solid #f1f5f9',
        background: isUnread ? '#f8faff' : '#fff',
        cursor: isUnread ? 'pointer' : 'default',
        transition: 'background 0.15s',
        position: 'relative',
      }}
      onMouseEnter={e => { if (!isUnread) e.currentTarget.style.background = '#fafafa'; }}
      onMouseLeave={e => { if (!isUnread) e.currentTarget.style.background = '#fff'; }}
    >
      {/* Unread stripe */}
      {isUnread && (
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: 3, background: color, borderRadius: '0 2px 2px 0',
        }} />
      )}

      {/* Icon bubble */}
      <div style={{
        flexShrink: 0,
        width: 36,
        height: 36,
        borderRadius: 10,
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Icon size={18} color={color} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <p style={{
            margin: 0,
            fontSize: 13,
            fontWeight: isUnread ? 600 : 500,
            color: '#111827',
            lineHeight: 1.4,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {notification.title}
          </p>
          <button
            onClick={e => { e.stopPropagation(); onDelete(notification._id); }}
            title="Dismiss"
            style={{
              flexShrink: 0,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 2,
              borderRadius: 4,
              color: '#9ca3af',
              display: 'flex',
              alignItems: 'center',
              lineHeight: 1,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fef2f2'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.background = 'none'; }}
          >
            <IoClose size={14} />
          </button>
        </div>
        <p style={{
          margin: '2px 0 4px',
          fontSize: 12,
          color: '#6b7280',
          lineHeight: 1.45,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {notification.message}
        </p>
        <span style={{ fontSize: 11, color: '#9ca3af' }}>
          {timeAgo(notification.createdAt)}
        </span>
      </div>
    </div>
  );
}

export default function NotificationPanel() {
  const dispatch = useDispatch();
  const { items, loading } = useSelector(state => state.notifications);

  const unreadItems = items.filter(n => !n.isRead);
  const handleDelete = (id) => dispatch(deleteNotification(id));
  const handleRead   = (id) => dispatch(markOneRead(id));
  const handleMarkAll = () => dispatch(markAllRead());

  return (
    <div style={{
      position: 'fixed',
      top: 'calc(5.3rem + 8px)',
      right: 8,
      width: 'clamp(280px, 360px, calc(100vw - 16px))',
      maxHeight: '70vh',
      background: '#fff',
      borderRadius: 14,
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 10px 30px -5px rgba(0,0,0,0.12)',
      border: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      zIndex: 1300,
    }}>

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 16px 12px',
        borderBottom: '1px solid #f1f5f9',
        background: '#fff',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Notifications</span>
          {unreadItems.length > 0 && (
            <span style={{
              background: '#eff6ff',
              color: '#2563eb',
              fontSize: 11,
              fontWeight: 600,
              borderRadius: 20,
              padding: '1px 8px',
            }}>
              {unreadItems.length} new
            </span>
          )}
        </div>
        {unreadItems.length > 0 && (
          <button
            onClick={handleMarkAll}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              color: '#2563eb',
              fontWeight: 500,
              padding: '4px 6px',
              borderRadius: 6,
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <IoCheckmarkDone size={14} />
            Mark all read
          </button>
        )}
      </div>

      {/* Body */}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 120 }}>
            <div className="spinner-border spinner-border-sm text-primary" role="status" />
          </div>
        ) : items.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
            gap: 10,
            color: '#9ca3af',
          }}>
            <IoNotificationsOutline size={36} color="#d1d5db" />
            <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: '#6b7280' }}>You're all caught up</p>
            <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>No notifications yet</p>
          </div>
        ) : (
          items.map(n => (
            <NotificationItem
              key={n._id}
              notification={n}
              onDelete={handleDelete}
              onRead={handleRead}
            />
          ))
        )}
      </div>

      {/* Footer */}
      {items.length > 0 && (
        <div style={{
          padding: '10px 16px',
          borderTop: '1px solid #f1f5f9',
          background: '#fafafa',
          flexShrink: 0,
          textAlign: 'center',
        }}>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>
            {items.length} notification{items.length !== 1 ? 's' : ''} · Dismissed ones are permanently removed
          </span>
        </div>
      )}
    </div>
  );
}