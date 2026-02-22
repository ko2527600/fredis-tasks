import axios from 'axios';

const API_URL = 'https://fredis-tasks-api.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 second timeout
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const register = (username, password) =>
  api.post('/register', { username, password });

export const login = (username, password) => {
  const params = new URLSearchParams();
  params.append('username', username);
  params.append('password', password);
  return api.post('/token', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
};

export const getTasks = () => api.get('/tasks');

export const createTask = (title, priority = 'medium', due_date = null, reminder_time = null) =>
  api.post('/tasks', { title, completed: false, priority, due_date, reminder_time });

export const updateTask = (taskId, title, completed, priority = 'medium', due_date = null, reminder_time = null) =>
  api.put(`/tasks/${taskId}`, { title, completed, priority, due_date, reminder_time });

export const deleteTask = (taskId) =>
  api.delete(`/tasks/${taskId}`);

export default api;
