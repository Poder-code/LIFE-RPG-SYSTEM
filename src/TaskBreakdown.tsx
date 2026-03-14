import React, { useState, useEffect } from 'react';
import { CalendarEvent, Subtask } from './models';
import { getCurrentUser } from './services.db';
import BackButton from './BackButton';

const TaskBreakdown: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showSubtaskForm, setShowSubtaskForm] = useState<boolean>(false);
  const [editingSubtask, setEditingSubtask] = useState<Subtask | null>(null);

  const [subtaskForm, setSubtaskForm] = useState({
    title: '',
    date: '',
    duration: 30,
  });

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

  const saveSubtasks = (userId: string, subtasks: Subtask[]) => {
    localStorage.setItem(`subtasks_${userId}`, JSON.stringify(subtasks));
  };

  const saveEvents = (userId: string, events: CalendarEvent[]) => {
    localStorage.setItem(`events_${userId}`, JSON.stringify(events));
  };

  const getSubtasksForEvent = (eventId: string): Subtask[] => {
    return subtasks.filter(subtask => subtask.parentEvent === eventId);
  };

  const calculateProgress = (eventId: string): number => {
    const eventSubtasks = getSubtasksForEvent(eventId);
    if (eventSubtasks.length === 0) return 0;
    
    const completedSubtasks = eventSubtasks.filter(subtask => subtask.completed).length;
    return Math.round((completedSubtasks / eventSubtasks.length) * 100);
  };

  const handleSubtaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = getCurrentUser();
    if (!user || !selectedEvent) return;

    if (editingSubtask) {
      // Update existing subtask
      const updatedSubtasks = subtasks.map(subtask =>
        subtask.id === editingSubtask.id
          ? {
              ...subtask,
              ...subtaskForm,
              date: new Date(subtaskForm.date),
              updatedAt: new Date(),
            }
          : subtask
      );
      setSubtasks(updatedSubtasks);
      saveSubtasks(user.id, updatedSubtasks);
    } else {
      // Create new subtask
      const newSubtask: Subtask = {
        id: `subtask_${Date.now()}`,
        userId: user.id,
        title: subtaskForm.title,
        date: new Date(subtaskForm.date),
        duration: subtaskForm.duration,
        completed: false,
        parentEvent: selectedEvent.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedSubtasks = [...subtasks, newSubtask];
      setSubtasks(updatedSubtasks);
      saveSubtasks(user.id, updatedSubtasks);

      // Update event to include the new subtask
      const updatedEvents = events.map(event =>
        event.id === selectedEvent.id
          ? { ...event, subtasks: [...event.subtasks, newSubtask.id] }
          : event
      );
      setEvents(updatedEvents);
      saveEvents(user.id, updatedEvents);
    }

    // Reset form
    setSubtaskForm({
      title: '',
      date: '',
      duration: 30,
    });
    setShowSubtaskForm(false);
    setEditingSubtask(null);
  };

  const handleEditSubtask = (subtask: Subtask) => {
    setEditingSubtask(subtask);
    setSubtaskForm({
      title: subtask.title,
      date: subtask.date.toISOString().split('T')[0],
      duration: subtask.duration,
    });
    setShowSubtaskForm(true);
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    const user = getCurrentUser();
    if (!user || !selectedEvent) return;

    // Remove subtask from subtasks array
    const updatedSubtasks = subtasks.filter(subtask => subtask.id !== subtaskId);
    setSubtasks(updatedSubtasks);
    saveSubtasks(user.id, updatedSubtasks);

    // Remove subtask ID from event
    const updatedEvents = events.map(event =>
      event.id === selectedEvent.id
        ? { ...event, subtasks: event.subtasks.filter(id => id !== subtaskId) }
        : event
    );
    setEvents(updatedEvents);
    saveEvents(user.id, updatedEvents);
  };

  const toggleSubtaskCompletion = (subtaskId: string) => {
    const user = getCurrentUser();
    if (!user) return;

    const updatedSubtasks = subtasks.map(subtask =>
      subtask.id === subtaskId
        ? { ...subtask, completed: !subtask.completed, updatedAt: new Date() }
        : subtask
    );
    setSubtasks(updatedSubtasks);
    saveSubtasks(user.id, updatedSubtasks);

    // Update event progress
    const updatedEvents = events.map(event => {
      if (event.id === selectedEvent?.id) {
        const progress = calculateProgress(event.id);
        return { ...event, progress, updatedAt: new Date() };
      }
      return event;
    });
    setEvents(updatedEvents);
    saveEvents(user.id, updatedEvents);
  };

  const getTodaySubtasks = (): Subtask[] => {
    const today = new Date().toISOString().split('T')[0];
    return subtasks.filter(subtask => 
      subtask.date.toISOString().split('T')[0] === today && !subtask.completed
    );
  };

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      loadEvents(user.id);
      loadSubtasks(user.id);
    }
  }, []);

  const assignmentEvents = events.filter(event => event.type === 'assignment');
  const todaySubtasks = getTodaySubtasks();

  return (
    <div className="task-breakdown-container">
      <BackButton />
      <div className="breakdown-header">
        <h1>Task Breakdown System</h1>
        <p>Break down assignments into manageable subtasks and track progress</p>
      </div>

      {todaySubtasks.length > 0 && (
        <div className="today-subtasks">
          <h2>Today's Subtasks</h2>
          <div className="subtasks-list">
            {todaySubtasks.map(subtask => (
              <div key={subtask.id} className="subtask-item today">
                <input
                  type="checkbox"
                  checked={subtask.completed}
                  onChange={() => toggleSubtaskCompletion(subtask.id)}
                />
                <span className="subtask-title">{subtask.title}</span>
                <span className="subtask-duration">{subtask.duration} min</span>
                <span className="subtask-date">{subtask.date.toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="assignments-section">
        <h2>Assignments</h2>
        {assignmentEvents.length > 0 ? (
          <div className="assignments-grid">
            {assignmentEvents.map(event => {
              const eventSubtasks = getSubtasksForEvent(event.id);
              const progress = calculateProgress(event.id);
              
              return (
                <div key={event.id} className="assignment-card">
                  <div className="assignment-header">
                    <h3>{event.title}</h3>
                    <div className="assignment-meta">
                      <span className={`difficulty ${event.difficulty}`}>{event.difficulty}</span>
                      <span className={`priority ${event.priority}`}>{event.priority}</span>
                    </div>
                  </div>
                  
                  {event.description && (
                    <p className="assignment-description">{event.description}</p>
                  )}
                  
                  <div className="assignment-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="progress-text">{progress}% Complete</span>
                  </div>
                  
                  <div className="assignment-subtasks">
                    <h4>Subtasks ({eventSubtasks.length})</h4>
                    {eventSubtasks.length > 0 ? (
                      <div className="subtasks-list">
                        {eventSubtasks.map(subtask => (
                          <div key={subtask.id} className={`subtask-item ${subtask.completed ? 'completed' : ''}`}>
                            <input
                              type="checkbox"
                              checked={subtask.completed}
                              onChange={() => toggleSubtaskCompletion(subtask.id)}
                            />
                            <span className="subtask-title">{subtask.title}</span>
                            <span className="subtask-duration">{subtask.duration} min</span>
                            <span className="subtask-date">{subtask.date.toLocaleDateString()}</span>
                            <div className="subtask-actions">
                              <button 
                                className="btn btn-small btn-secondary"
                                onClick={() => handleEditSubtask(subtask)}
                              >
                                Edit
                              </button>
                              <button 
                                className="btn btn-small btn-danger"
                                onClick={() => handleDeleteSubtask(subtask.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-subtasks">No subtasks created yet.</p>
                    )}
                    
                    <div className="subtask-actions">
                      <button 
                        className="btn btn-primary btn-small"
                        onClick={() => {
                          setSelectedEvent(event);
                          setSubtaskForm({
                            title: '',
                            date: event.date.toISOString().split('T')[0],
                            duration: 30,
                          });
                          setShowSubtaskForm(true);
                        }}
                      >
                        + Add Subtask
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="no-assignments">
            <p>No assignments found. Create an assignment in the calendar first.</p>
            <button 
              className="btn btn-primary"
              onClick={() => window.location.href = '/calendar'}
            >
              Go to Calendar
            </button>
          </div>
        )}
      </div>

      {showSubtaskForm && selectedEvent && (
        <div className="subtask-form-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                {editingSubtask ? 'Edit Subtask' : `Add Subtask to "${selectedEvent.title}"`}
              </h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowSubtaskForm(false);
                  setEditingSubtask(null);
                }}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubtaskSubmit} className="subtask-form">
              <div className="form-group">
                <label htmlFor="subtask-title">Subtask Title *</label>
                <input
                  id="subtask-title"
                  type="text"
                  value={subtaskForm.title}
                  onChange={(e) => setSubtaskForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="subtask-date">Date *</label>
                  <input
                    id="subtask-date"
                    type="date"
                    value={subtaskForm.date}
                    onChange={(e) => setSubtaskForm(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subtask-duration">Duration (minutes) *</label>
                  <input
                    id="subtask-duration"
                    type="number"
                    min="5"
                    max="480"
                    value={subtaskForm.duration}
                    onChange={(e) => setSubtaskForm(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingSubtask ? 'Update Subtask' : 'Create Subtask'}
                </button>
                <button 
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowSubtaskForm(false);
                    setEditingSubtask(null);
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

export default TaskBreakdown;
