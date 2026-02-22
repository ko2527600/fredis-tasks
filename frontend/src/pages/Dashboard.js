import React, { useState, useEffect } from 'react';
import { getTasks, createTask, updateTask, deleteTask } from '../api';

function Dashboard({ onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [newReminderTime, setNewReminderTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPriority, setEditPriority] = useState('medium');
  const [editDueDate, setEditDueDate] = useState('');
  const [editReminderTime, setEditReminderTime] = useState('');
  const [filter, setFilter] = useState('all');
  const [firedReminders, setFiredReminders] = useState(new Set());
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const fredricaImages = [
    '/fredrica1.jpeg',
    '/frefrica2.jpeg',
    '/fredrica3.jpeg',
    '/fredrica4.jpeg'
  ];

  useEffect(() => {
    fetchTasks();
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % fredricaImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      checkReminders(tasks);
    }, 5000);
    return () => clearInterval(interval);
  }, [tasks, firedReminders]);

  const checkReminders = (taskList) => {
    const now = new Date();
    taskList.forEach(task => {
      if (task.reminder_time && !task.completed && !firedReminders.has(task.id)) {
        const reminderTime = new Date(task.reminder_time);
        const timeDiff = Math.abs(reminderTime - now);
        
        if (timeDiff < 60000) {
          showNotification(task.title);
          setFiredReminders(prev => new Set([...prev, task.id]));
        }
      }
    });
  };

  const playAlarmSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      const alarmDuration = 3;
      const startTime = audioContext.currentTime;
      
      for (let i = 0; i < alarmDuration * 4; i++) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = i % 2 === 0 ? 1000 : 1200;
        oscillator.type = 'square';
        
        const time = startTime + (i * 0.25);
        gainNode.gain.setValueAtTime(0.3, time);
        gainNode.gain.setValueAtTime(0, time + 0.25);
        
        oscillator.start(time);
        oscillator.stop(time + 0.25);
      }
    } catch (e) {
      console.log('Audio context error:', e);
    }
  };

  const showNotification = (taskTitle) => {
    playAlarmSound();
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('⏰ Task Reminder', {
        body: `Time for: ${taskTitle}`,
        icon: '📝',
        tag: 'task-reminder'
      });
    }
    alert(`⏰ REMINDER: ${taskTitle}`);
  };

  const fetchTasks = async () => {
    try {
      const response = await getTasks();
      setTasks(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) {
      setError('Task title cannot be empty');
      return;
    }

    try {
      await createTask(newTask, newPriority, newDueDate, newReminderTime);
      setNewTask('');
      setNewPriority('medium');
      setNewDueDate('');
      setNewReminderTime('');
      setError('');
      fetchTasks();
    } catch (err) {
      setError('Failed to create task');
    }
  };

  const handleToggleTask = async (task) => {
    try {
      await updateTask(task.id, task.title, !task.completed, task.priority, task.due_date, task.reminder_time);
      fetchTasks();
    } catch (err) {
      setError('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(taskId);
        fetchTasks();
      } catch (err) {
        setError('Failed to delete task');
      }
    }
  };

  const handleEditStart = (task) => {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditPriority(task.priority);
    setEditDueDate(task.due_date || '');
    setEditReminderTime(task.reminder_time || '');
  };

  const handleEditSave = async (taskId) => {
    if (!editTitle.trim()) {
      setError('Task title cannot be empty');
      return;
    }

    try {
      await updateTask(taskId, editTitle, false, editPriority, editDueDate, editReminderTime);
      setEditingId(null);
      fetchTasks();
    } catch (err) {
      setError('Failed to update task');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'secondary';
    }
  };

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return '';
    const date = new Date(dateTimeStr);
    return date.toLocaleString();
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'completed') return task.completed;
    if (filter === 'pending') return !task.completed;
    return true;
  });

  return (
    <div style={{
      minHeight: '100vh',
      backgroundImage: `url(${fredricaImages[currentImageIndex]})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      transition: 'background-image 1s ease-in-out',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Dark overlay */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        zIndex: 0,
        pointerEvents: 'none'
      }}></div>

      <div className="container mt-5" style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        <div className="row justify-content-center">
          <div className="col-md-10">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h1 style={{ color: '#ff69b4', fontWeight: 'bold', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>💕 Fredrica's Tasks 💕</h1>
              <button className="btn btn-danger" onClick={() => {
                if (window.confirm('Are you sure you want to logout?')) {
                  localStorage.removeItem('token');
                  onLogout();
                }
              }}>
                Logout
              </button>
            </div>

            {error && (
              <div className="alert alert-danger alert-dismissible fade show">
                {error}
                <button type="button" className="btn-close" onClick={() => setError('')}></button>
              </div>
            )}

            <div className="card mb-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}>
              <div className="card-body">
                <h5 className="card-title">Add New Task</h5>
                <form onSubmit={handleAddTask}>
                  <div className="row g-2">
                    <div className="col-md-4">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Task title..."
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        maxLength="200"
                      />
                    </div>
                    <div className="col-md-2">
                      <select
                        className="form-select"
                        value={newPriority}
                        onChange={(e) => setNewPriority(e.target.value)}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div className="col-md-2">
                      <input
                        type="date"
                        className="form-control"
                        value={newDueDate}
                        onChange={(e) => setNewDueDate(e.target.value)}
                      />
                    </div>
                    <div className="col-md-2">
                      <input
                        type="datetime-local"
                        className="form-control"
                        title="Reminder time"
                        value={newReminderTime}
                        onChange={(e) => setNewReminderTime(e.target.value)}
                      />
                    </div>
                    <div className="col-md-2">
                      <button className="btn btn-primary w-100" type="submit">
                        Add
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            <div className="mb-3">
              <div className="btn-group" role="group">
                <button
                  type="button"
                  className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setFilter('all')}
                >
                  All ({tasks.length})
                </button>
                <button
                  type="button"
                  className={`btn ${filter === 'pending' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setFilter('pending')}
                >
                  Pending ({tasks.filter(t => !t.completed).length})
                </button>
                <button
                  type="button"
                  className={`btn ${filter === 'completed' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setFilter('completed')}
                >
                  Completed ({tasks.filter(t => t.completed).length})
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="alert alert-info">
                {filter === 'all' ? 'No tasks yet. Create one!' : `No ${filter} tasks.`}
              </div>
            ) : (
              <ul className="list-group">
                {filteredTasks.map((task) => (
                  <li key={task.id} className="list-group-item" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}>
                    {editingId === task.id ? (
                      <div className="row g-2">
                        <div className="col-md-3">
                          <input
                            type="text"
                            className="form-control"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            maxLength="200"
                          />
                        </div>
                        <div className="col-md-2">
                          <select
                            className="form-select"
                            value={editPriority}
                            onChange={(e) => setEditPriority(e.target.value)}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </div>
                        <div className="col-md-2">
                          <input
                            type="date"
                            className="form-control"
                            value={editDueDate}
                            onChange={(e) => setEditDueDate(e.target.value)}
                          />
                        </div>
                        <div className="col-md-2">
                          <input
                            type="datetime-local"
                            className="form-control"
                            value={editReminderTime}
                            onChange={(e) => setEditReminderTime(e.target.value)}
                          />
                        </div>
                        <div className="col-md-3">
                          <button
                            className="btn btn-success btn-sm me-2"
                            onClick={() => handleEditSave(task.id)}
                          >
                            Save
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center flex-grow-1">
                          <input
                            type="checkbox"
                            className="form-check-input me-3"
                            checked={task.completed}
                            onChange={() => handleToggleTask(task)}
                          />
                          <div>
                            <span
                              style={{
                                textDecoration: task.completed ? 'line-through' : 'none',
                                color: task.completed ? '#999' : '#000',
                              }}
                            >
                              {task.title}
                            </span>
                            <div className="small text-muted mt-1">
                              {task.due_date && <span className="me-2">📅 {task.due_date}</span>}
                              {task.reminder_time && (
                                <span className="me-2" style={{ color: firedReminders.has(task.id) ? 'red' : 'inherit' }}>
                                  ⏰ {formatDateTime(task.reminder_time)}
                                </span>
                              )}
                              <span className={`badge bg-${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <button
                            className="btn btn-sm btn-warning me-2"
                            onClick={() => handleEditStart(task)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <footer style={{
        backgroundColor: 'rgba(255, 105, 180, 0.9)',
        color: 'white',
        textAlign: 'center',
        padding: '20px',
        marginTop: '40px',
        fontStyle: 'italic',
        fontSize: '16px',
        position: 'relative',
        zIndex: 1
      }}>
        <p style={{ margin: 0 }}>💕 This app is dedication for u bby girl i love u with all in me from ohene 💕</p>
      </footer>
    </div>
  );
}

export default Dashboard;
