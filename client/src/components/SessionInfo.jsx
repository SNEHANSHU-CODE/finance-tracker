import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import sessionManager from '../utils/sessionManager';
import { formatTime } from '../utils/formatters';

export default function SessionInfo() {
  const user = useSelector((state) => state.auth?.user);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      const duration = sessionManager.getSessionDuration();
      const remaining = sessionManager.getTimeUntilExpiry();
      
      setSessionDuration(duration);
      setTimeRemaining(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [user]);

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  if (!user) return null;

  const isExpiringSoon = timeRemaining < 5 * 60; // 5 minutes

  return (
    <div className="session-info ms-2">
      <small className="text-muted d-block">
        Session: {formatDuration(sessionDuration)}
      </small>
      <small className={isExpiringSoon ? 'text-danger' : 'text-muted'}>
        Expires: {formatDuration(timeRemaining)}
      </small>
    </div>
  );
}
