import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { FaSpinner } from 'react-icons/fa';

import { createReminder, fetchReminders, googleConnect } from '../app/reminderSlice';
import './styles/reminders.css';

export default function Reminders() {
  const dispatch = useDispatch();
  const { loading, events, error } = useSelector(state => state.reminder);

  const [selectedDate, setSelectedDate] = useState(null);
  const [reminderText, setReminderText] = useState('');
  const [time, setTime] = useState('');
  const [ampm, setAmpm] = useState('AM');
  const [showModal, setShowModal] = useState(false);

  //get all reminder on page load
  useEffect(() => {
    dispatch(fetchReminders());

    const params = new URLSearchParams(window.location.search);
    if (params.get('googleConnected') === 'true') {
      alert('✅ Google Calendar connected successfully!');
    } else if (params.get('googleConnected') === 'false') {
      alert('❌ Failed to connect Google Calendar.');
    }
  }, [dispatch]);

  const handleDateClick = (info) => {
    const clickedDate = new Date(info.dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (clickedDate < today) {
      alert('Cannot set reminders for past dates.');
      return;
    }

    setSelectedDate(info.dateStr);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!reminderText.trim()) return;

    let [hour, minute] = time.split(':').map(Number);
    if (ampm === 'PM' && hour < 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;

    const dateTime = new Date(selectedDate);
    dateTime.setHours(hour);
    dateTime.setMinutes(minute || 0);

    dispatch(createReminder({
      title: reminderText,
      date: dateTime.toISOString()
    }));

    // Reset
    setReminderText('');
    setTime('');
    setAmpm('AM');
    setShowModal(false);
  };

  const handleGoogleConnect = (e) => {
    e.preventDefault();
    dispatch(googleConnect());
  }

  return (
    <div className="container-fluid p-0 reminder-page">
      <div className="header border-bottom px-3 py-3 d-flex justify-content-between align-items-center">
        <div>
          <h4 className="mb-1">Reminders</h4>
          <p className="text-muted mb-0">Click a date to add a reminder</p>
        </div>
        <div>
          <button
            className="btn btn-outline-primary"
            onClick={handleGoogleConnect}
          >
            Connect Google Calendar
          </button>
        </div>
      </div>

      <div className="p-3">
        {error && (
          <div className="alert alert-danger">{error}</div>
        )}

        {loading && (
          <div className="text-center py-5">
            <FaSpinner className="fa-spin" size={48} />
            <p className="mt-3 text-muted">Loading reminders...</p>
          </div>
        )}

        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          dateClick={handleDateClick}
          events={events}
          height="auto"
        />
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal fade show d-block custom-modal-bg">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-3 shadow">
              <div className="modal-header border-0">
                <h5 className="modal-title">Add Reminder</h5>
                <button className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body">
                <p className="text-muted">For: {new Date(selectedDate).toDateString()}</p>
                <div className="mb-3">
                  <label className="form-label">Reminder Title</label>
                  <input
                    type="text"
                    className="form-control"
                    value={reminderText}
                    onChange={(e) => setReminderText(e.target.value)}
                    placeholder="e.g. Pay electricity bill"
                  />
                </div>
                <div className="d-flex gap-2">
                  <div className="flex-grow-1">
                    <label className="form-label">Time</label>
                    <input
                      type="time"
                      className="form-control"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">AM/PM</label>
                    <select
                      className="form-select"
                      value={ampm}
                      onChange={(e) => setAmpm(e.target.value)}
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>

              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                  {loading && <FaSpinner className="fa-spin me-2" />}
                  Save Reminder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
