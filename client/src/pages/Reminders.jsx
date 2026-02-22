import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { FaSpinner, FaEdit, FaTrash, FaPlus } from 'react-icons/fa';

import { createReminder, fetchReminders, googleConnect, updateReminder, deleteReminder } from '../app/reminderSlice';
import { usePreferences } from '../hooks/usePreferences';

export default function Reminders() {
  const dispatch = useDispatch();
  const { loading, events, error } = useSelector(state => state.reminder);
  const { t, formatDate: formatDatePref, formatTime: formatTimePref } = usePreferences();

  const [selectedDate, setSelectedDate] = useState(null);
  const [reminderText, setReminderText] = useState('');
  const [time, setTime] = useState('');
  const [ampm, setAmpm] = useState('AM');
  const [showModal, setShowModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  //get all reminder on page load
  useEffect(() => {
    dispatch(fetchReminders());

    const params = new URLSearchParams(window.location.search);
    const googleConnected = params.get('googleConnected');
    const errorParam = params.get('error');
    
    if (googleConnected === 'true') {
      alert(t('google_connected_success'));
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (googleConnected === 'false') {
      const errorMessage = errorParam 
        ? `${t('google_connected_failed')}: ${errorParam}`
        : t('google_connected_failed');
      alert(errorMessage);
      console.error('Google connection failed:', errorParam);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [dispatch, t]);

  const handleDateClick = (info) => {
    const clickedDate = new Date(info.dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (clickedDate < today) {
      alert(t('cannot_set_past_dates'));
      return;
    }

    setSelectedDate(info.dateStr);
    setEditingReminder(null);
    setReminderText('');
    setTime('');
    setAmpm('AM');
    setShowModal(true);
  };

  const handleEventClick = (info) => {
    const event = info.event;
    setSelectedEvent({
      id: event.id,
      title: event.title,
      date: event.start,
      dateStr: event.startStr
    });
    setShowEventModal(true);
  };

  const handleEditReminder = () => {
    const eventDate = new Date(selectedEvent.date);
    const hours = eventDate.getHours();
    const minutes = eventDate.getMinutes();
    
    // Convert to 12-hour format
    let displayHour = hours;
    let period = 'AM';
    
    if (hours === 0) {
      displayHour = 12;
    } else if (hours > 12) {
      displayHour = hours - 12;
      period = 'PM';
    } else if (hours === 12) {
      period = 'PM';
    }

    const timeString = `${displayHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    setEditingReminder(selectedEvent);
    setSelectedDate(selectedEvent.dateStr.split('T')[0]);
    setReminderText(selectedEvent.title);
    setTime(timeString);
    setAmpm(period);
    setShowEventModal(false);
    setShowModal(true);
  };

  const handleDeleteReminder = () => {
    setConfirmDelete(selectedEvent);
    setShowEventModal(false);
  };

  const confirmDeleteReminder = () => {
    if (confirmDelete) {
      dispatch(deleteReminder(confirmDelete.id));
      setConfirmDelete(null);
      setSelectedEvent(null);
    }
  };

  const handleSave = () => {
    if (!reminderText.trim()) return;

    let [hour, minute] = time.split(':').map(Number);
    if (ampm === 'PM' && hour < 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;

    const dateTime = new Date(selectedDate);
    dateTime.setHours(hour);
    dateTime.setMinutes(minute || 0);

    const reminderData = {
      title: reminderText,
      date: dateTime.toISOString()
    };

    if (editingReminder) {
      // Update existing reminder
      dispatch(updateReminder({
        id: editingReminder.id,
        ...reminderData
      }));
    } else {
      // Create new reminder
      dispatch(createReminder(reminderData));
    }

    // Reset
    setReminderText('');
    setTime('');
    setAmpm('AM');
    setShowModal(false);
    setEditingReminder(null);
  };

  const handleGoogleConnect = async (e) => {
    e.preventDefault();
    console.log('🔐 Google Connect button clicked');
    
    try {
      // Dispatch the action and wait for it
      const result = await dispatch(googleConnect()).unwrap();
      console.log('✅ Google connect result:', result);
    } catch (err) {
      console.error('❌ Google connect error:', err);
      alert(`Failed to connect Google Calendar: ${err.message || 'Unknown error'}`);
    }
  };

  const closeAllModals = () => {
    setShowModal(false);
    setShowEventModal(false);
    setConfirmDelete(null);
    setEditingReminder(null);
    setSelectedEvent(null);
  };

  return (
    <div className="container-fluid p-0">
      <div className="border-bottom px-3 py-3 d-flex justify-content-between align-items-center">
        <div>
          <h4 className="mb-1">{t('reminders')}</h4>
          <p className="text-muted mb-0">{t('reminders_subtitle')}</p>
        </div>
        <div>
          <button
            className="btn btn-outline-primary"
            onClick={handleGoogleConnect}
            disabled={loading}
          >
            {loading && <FaSpinner className="fa-spin me-2" />}
            {t('connect_google_calendar')}
          </button>
        </div>
      </div>

      <div className="p-3">
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button type="button" className="btn-close" onClick={() => dispatch({ type: 'reminder/clearReminderError' })}></button>
          </div>
        )}

        {loading && (
          <div className="text-center py-5">
            <FaSpinner className="fa-spin" size={48} />
            <p className="mt-3 text-muted">{t('loading_reminders')}</p>
          </div>
        )}

        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          events={events}
          height="auto"
          eventDisplay="block"
          dayMaxEvents={3}
          moreLinkClick="popover"
        />
      </div>

      {/* Add/Edit Reminder Modal */}
      {showModal && (
        <div 
          className="modal fade show d-block" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-3 shadow">
              <div className="modal-header border-0">
                <h5 className="modal-title">
                  <FaPlus className="me-2" />
                  {editingReminder ? t('edit_reminder') : t('add_reminder')}
                </h5>
                <button className="btn-close" onClick={closeAllModals} />
              </div>
              <div className="modal-body">
                <p className="text-muted">{t('for_label')} {formatDatePref(selectedDate)}</p>
                <div className="mb-3">
                  <label className="form-label">{t('reminder_title')}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={reminderText}
                    onChange={(e) => setReminderText(e.target.value)}
                    placeholder={t('reminder_title_placeholder')}
                    autoFocus
                  />
                </div>
                <div className="d-flex gap-2">
                  <div className="flex-grow-1">
                    <label className="form-label">{t('time')}</label>
                    <input
                      type="time"
                      className="form-control"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">{t('am_pm')}</label>
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
                <button className="btn btn-secondary" onClick={closeAllModals}>
                  {t('cancel')}
                </button>
                <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                  {loading && <FaSpinner className="fa-spin me-2" />}
                  {editingReminder ? t('update_reminder') : t('save_reminder')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <div 
          className="modal fade show d-block" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-3 shadow">
              <div className="modal-header border-0">
                <h5 className="modal-title">{t('reminder_details')}</h5>
                <button className="btn-close" onClick={closeAllModals} />
              </div>
              <div className="modal-body">
                <div>
                  <h6 className="mb-3">{selectedEvent.title}</h6>
                  <p className="text-muted mb-2">
                    <strong>{t('date_label')}</strong> {formatDatePref(selectedEvent.date)}
                  </p>
                  <p className="text-muted mb-0">
                    <strong>{t('time_label')}</strong> {formatTimePref(selectedEvent.date)}
                  </p>
                </div>
              </div>
              <div className="modal-footer border-0 d-flex justify-content-between">
                <button className="btn btn-outline-danger" onClick={handleDeleteReminder}>
                  <FaTrash className="me-2" />
                  {t('delete')}
                </button>
                <div>
                  <button className="btn btn-secondary me-2" onClick={closeAllModals}>
                    {t('close')}
                  </button>
                  <button className="btn btn-primary" onClick={handleEditReminder}>
                    <FaEdit className="me-2" />
                    {t('edit')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div 
          className="modal fade show d-block" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content rounded-3 shadow">
              <div className="modal-header border-0 bg-danger text-white">
                <h5 className="modal-title">
                  <FaTrash className="me-2" />
                  {t('confirm_delete')}
                </h5>
                <button className="btn-close btn-close-white" onClick={() => setConfirmDelete(null)} />
              </div>
              <div className="modal-body text-center">
                <p className="mb-3">{t('delete_reminder_confirm')}</p>
                <div className="alert alert-light border">
                  <strong>{confirmDelete.title}</strong><br />
                  <small className="text-muted">
                    {formatDatePref(confirmDelete.date)} {formatTimePref(confirmDelete.date)}
                  </small>
                </div>
                <p className="text-muted small">{t('cannot_undo')}</p>
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>
                  {t('cancel')}
                </button>
                <button className="btn btn-danger" onClick={confirmDeleteReminder} disabled={loading}>
                  {loading && <FaSpinner className="fa-spin me-2" />}
                  {t('delete_reminder')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}