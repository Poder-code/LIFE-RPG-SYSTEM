import React, { useState, useEffect } from 'react';
import { CalendarEvent, EventType, Subtask } from './models';
import { getCurrentUser } from './services.db';
import BackButton from './BackButton';

const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventForm, setShowEventForm] = useState<boolean>(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);

  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    type: 'personal' as EventType,
    date: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    priority: 'medium' as 'low' | 'medium' | 'high',
  });

  const eventTypeColors: Record<EventType, string> = {
    exam: '#ef4444',
    assignment: '#f59e0b',
    study: '#3b82f6',
    reminder: '#10b981',
    personal: '#8b5cf6',
  };

  const eventTypeIcons: Record<EventType, string> = {
    exam: '📝',
    assignment: '📚',
    study: '📖',
    reminder: '⏰',
    personal: '👤',
  };

  const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    // Add empty cells for days before month starts
    const startDayOfWeek = firstDay.getDay();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const emptyDay = new Date(year, month, -i);
      days.push(emptyDay);
    }

    // Add all days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const formatDateString = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const dateString = formatDateString(date);
    return events.filter(event => 
      formatDateString(new Date(event.date)) === dateString
    );
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setEventForm(prev => ({ ...prev, date: formatDateString(date) }));
  };

  const handleEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = getCurrentUser();
    if (!user) return;

    if (editingEvent) {
      // Update existing event
      const updatedEvents = events.map(event =>
        event.id === editingEvent.id
          ? {
              ...event,
              ...eventForm,
              date: new Date(eventForm.date),
              updatedAt: new Date(),
            }
          : event
      );
      setEvents(updatedEvents);
      saveEvents(user.id, updatedEvents);
    } else {
      // Create new event
      const newEvent: CalendarEvent = {
        id: `event_${Date.now()}`,
        userId: user.id,
        title: eventForm.title,
        description: eventForm.description,
        type: eventForm.type,
        date: new Date(eventForm.date),
        difficulty: eventForm.difficulty,
        priority: eventForm.priority,
        progress: 0,
        subtasks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedEvents = [...events, newEvent];
      setEvents(updatedEvents);
      saveEvents(user.id, updatedEvents);
    }

    // Reset form
    setEventForm({
      title: '',
      description: '',
      type: 'personal',
      date: '',
      difficulty: 'medium',
      priority: 'medium',
    });
    setShowEventForm(false);
    setEditingEvent(null);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description,
      type: event.type,
      date: formatDateString(new Date(event.date)),
      difficulty: event.difficulty,
      priority: event.priority,
    });
    setShowEventForm(true);
  };

  const handleDeleteEvent = (eventId: string) => {
    const user = getCurrentUser();
    if (!user) return;

    const updatedEvents = events.filter(event => event.id !== eventId);
    setEvents(updatedEvents);
    saveEvents(user.id, updatedEvents);
  };

  const saveEvents = (userId: string, events: CalendarEvent[]) => {
    localStorage.setItem(`events_${userId}`, JSON.stringify(events));
  };

  const loadEvents = (userId: string) => {
    const savedEvents = localStorage.getItem(`events_${userId}`);
    if (savedEvents) {
      const parsedEvents = JSON.parse(savedEvents).map((event: any) => ({
        ...event,
        date: new Date(event.date),
        createdAt: new Date(event.createdAt),
        updatedAt: new Date(event.updatedAt),
      }));
      setEvents(parsedEvents);
    }
  };

  const loadSubtasks = (userId: string) => {
    const savedSubtasks = localStorage.getItem(`subtasks_${userId}`);
    if (savedSubtasks) {
      const parsedSubtasks = JSON.parse(savedSubtasks).map((subtask: any) => ({
        ...subtask,
        date: new Date(subtask.date),
        createdAt: new Date(subtask.createdAt),
        updatedAt: new Date(subtask.updatedAt),
      }));
      setSubtasks(parsedSubtasks);
    }
  };

  const calculateProgress = (event: CalendarEvent): number => {
    const eventSubtasks = subtasks.filter(subtask => subtask.parentEvent === event.id);
    if (eventSubtasks.length === 0) return event.progress;
    
    const completedSubtasks = eventSubtasks.filter(subtask => subtask.completed).length;
    return Math.round((completedSubtasks / eventSubtasks.length) * 100);
  };

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      loadEvents(user.id);
      loadSubtasks(user.id);
    }
  }, []);

  const monthYear = currentDate.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  const days = getDaysInMonth(currentDate);

  return (
    <div className="calendar-container">
      <BackButton />
      <div className="calendar-header">
        <h1>Academic Calendar</h1>
        <p>Manage your assignments, exams, and study schedule</p>
      </div>

      <div className="calendar-navigation">
        <button 
          className="btn btn-secondary"
          onClick={() => navigateMonth(-1)}
        >
          ← Previous
        </button>
        <h2>{monthYear}</h2>
        <button 
          className="btn btn-secondary"
          onClick={() => navigateMonth(1)}
        >
          Next →
        </button>
        <button 
          className="btn btn-primary"
          onClick={() => setShowEventForm(true)}
        >
          + Add Event
        </button>
      </div>

      <div className="calendar-grid">
        <div className="calendar-weekdays">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="weekday-header">
              {day}
            </div>
          ))}
        </div>

        <div className="calendar-days">
          {days.map((day, index) => {
            const dayEvents = getEventsForDate(day);
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = formatDateString(day) === formatDateString(new Date());
            const isSelected = selectedDate && formatDateString(day) === formatDateString(selectedDate);

            return (
              <div
                key={index}
                className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                onClick={() => handleDateClick(day)}
              >
                <div className="day-number">{day.getDate()}</div>
                <div className="day-events">
                  {dayEvents.slice(0, 3).map((event, eventIndex) => (
                    <div
                      key={eventIndex}
                      className="event-indicator"
                      style={{ backgroundColor: eventTypeColors[event.type] }}
                      title={event.title}
                    >
                      <span className="event-icon">{eventTypeIcons[event.type]}</span>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="more-events">
                      +{dayEvents.length - 3}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="selected-date-events">
          <h3>Events for {selectedDate.toLocaleDateString()}</h3>
          <div className="events-list">
            {getEventsForDate(selectedDate).length > 0 ? (
              getEventsForDate(selectedDate).map(event => {
                const progress = calculateProgress(event);
                return (
                  <div key={event.id} className="event-card">
                    <div className="event-header">
                      <div className="event-title-row">
                        <span className="event-icon">{eventTypeIcons[event.type]}</span>
                        <h4>{event.title}</h4>
                        <span 
                          className="event-type-badge"
                          style={{ backgroundColor: eventTypeColors[event.type] }}
                        >
                          {event.type}
                        </span>
                      </div>
                      <div className="event-actions">
                        <button 
                          className="btn btn-small btn-secondary"
                          onClick={() => handleEditEvent(event)}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn btn-small btn-danger"
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    {event.description && (
                      <p className="event-description">{event.description}</p>
                    )}
                    
                    <div className="event-meta">
                      <span className="event-difficulty">Difficulty: {event.difficulty}</span>
                      <span className="event-priority">Priority: {event.priority}</span>
                    </div>
                    
                    <div className="event-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="progress-text">{progress}%</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p>No events scheduled for this date.</p>
            )}
          </div>
        </div>
      )}

      {showEventForm && (
        <div className="event-form-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingEvent ? 'Edit Event' : 'Add New Event'}</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowEventForm(false);
                  setEditingEvent(null);
                }}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleEventSubmit} className="event-form">
              <div className="form-group">
                <label htmlFor="title">Title *</label>
                <input
                  id="title"
                  type="text"
                  value={eventForm.title}
                  onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={eventForm.description}
                  onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="type">Type</label>
                  <select
                    id="type"
                    value={eventForm.type}
                    onChange={(e) => setEventForm(prev => ({ ...prev, type: e.target.value as EventType }))}
                  >
                    <option value="personal">Personal</option>
                    <option value="exam">Exam</option>
                    <option value="assignment">Assignment</option>
                    <option value="study">Study</option>
                    <option value="reminder">Reminder</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="date">Date *</label>
                  <input
                    id="date"
                    type="date"
                    value={eventForm.date}
                    onChange={(e) => setEventForm(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="difficulty">Difficulty</label>
                  <select
                    id="difficulty"
                    value={eventForm.difficulty}
                    onChange={(e) => setEventForm(prev => ({ ...prev, difficulty: e.target.value as 'easy' | 'medium' | 'hard' }))}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="priority">Priority</label>
                  <select
                    id="priority"
                    value={eventForm.priority}
                    onChange={(e) => setEventForm(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </button>
                <button 
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowEventForm(false);
                    setEditingEvent(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
