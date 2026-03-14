import React, { useState, useEffect } from 'react';

interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

interface DailyChecklist {
  userId: string;
  date: string;
  items: ChecklistItem[];
}

// eslint-disable-next-line @typescript-eslint/no-redeclare
const DailyChecklist: React.FC = () => {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newItemTitle, setNewItemTitle] = useState('');

  // Load checklist for today
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const stored = localStorage.getItem(`daily-checklist-${today}`);
    
    if (stored) {
      const checklist: DailyChecklist = JSON.parse(stored);
      setItems(checklist.items);
    } else {
      // Initialize with default items if none exist
      const defaultItems: ChecklistItem[] = [
        {
          id: 'default-1',
          title: 'Make bed',
          completed: false,
          createdAt: new Date()
        },
        {
          id: 'default-2',
          title: 'Meditate',
          completed: false,
          createdAt: new Date()
        },
        {
          id: 'default-3',
          title: 'Pre-workout meal',
          completed: false,
          createdAt: new Date()
        },
        {
          id: 'default-4',
          title: 'Prepare things to go out',
          completed: false,
          createdAt: new Date()
        }
      ];
      setItems(defaultItems);
      saveChecklist(defaultItems);
    }
  }, []);

  const saveChecklist = (checklistItems: ChecklistItem[]) => {
    const today = new Date().toISOString().slice(0, 10);
    const userId = 'current-user'; // In a real app, this would come from auth
    const checklist: DailyChecklist = {
      userId,
      date: today,
      items: checklistItems
    };
    localStorage.setItem(`daily-checklist-${today}`, JSON.stringify(checklist));
  };

  const addItem = () => {
    if (!newItemTitle.trim()) return;
    
    const newItem: ChecklistItem = {
      id: `item-${Date.now()}`,
      title: newItemTitle.trim(),
      completed: false,
      createdAt: new Date()
    };
    
    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    saveChecklist(updatedItems);
    setNewItemTitle('');
  };

  const toggleItem = (id: string) => {
    const updatedItems = items.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setItems(updatedItems);
    saveChecklist(updatedItems);
  };

  const deleteItem = (id: string) => {
    const updatedItems = items.filter(item => item.id !== id);
    setItems(updatedItems);
    saveChecklist(updatedItems);
  };

  const completedCount = items.filter(item => item.completed).length;
  const totalCount = items.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="daily-checklist">
      <div className="checklist-header">
        <h3>Daily Checklist</h3>
        <div className="checklist-progress">
          <span className="progress-text">{completedCount} / {totalCount} tasks completed</span>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="checklist-content">
        {/* Add new item form */}
        <div className="add-item-form">
          <input
            type="text"
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            placeholder="Add new task..."
            className="add-item-input"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addItem();
              }
            }}
          />
          <button 
            onClick={addItem}
            className="btn btn-primary add-item-btn"
            disabled={!newItemTitle.trim()}
          >
            Add
          </button>
        </div>

        {/* Checklist items */}
        <div className="checklist-items">
          {items.length === 0 ? (
            <div className="empty-checklist">
              <p>No tasks yet. Add your first task above!</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="checklist-item">
                <label className="checklist-item-label">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => toggleItem(item.id)}
                    className="checklist-checkbox"
                  />
                  <span className={`checklist-text ${item.completed ? 'completed' : ''}`}>
                    {item.title}
                  </span>
                </label>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="delete-item-btn"
                  aria-label="Delete task"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyChecklist;
