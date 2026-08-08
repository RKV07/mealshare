import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api',
});

client.interceptors.request.use(cfg => {
  const token = localStorage.getItem('mealshare_token');
  if (token) cfg.headers.Authorization = `Token ${token}`;
  return cfg;
});

// Auth
export const registerAccount  = (form)  => client.post('/auth/register/', form).then(r => r.data);
export const loginAccount     = (username, password) => client.post('/auth/login/', { username, password }).then(r => r.data);
export const logoutAccount    = ()      => client.post('/auth/logout/');
export const getMe            = ()      => client.get('/auth/me/').then(r => r.data);

// Admin Dashboard
export const getAdminDashboardStats = () => client.get('/admin/dashboard-stats/').then(r => r.data);

// Students Management
export const getStudents      = ()          => client.get('/students/').then(r => r.data);
export const addStudent        = (data)      => client.post('/students/', data).then(r => r.data);
export const updateStudent     = (id, data)  => client.put(`/students/${id}/`, data).then(r => r.data);
export const deleteStudent     = (id)        => client.delete(`/students/${id}/`).then(r => r.data);

// Meals Management
export const getMealLogs      = ()          => client.get('/meals/').then(r => r.data);
export const createMealLog    = (data)      => client.post('/meals/', data).then(r => r.data);
export const updateMealLog    = (id, data)  => client.put(`/meals/${id}/`, data).then(r => r.data);
export const deleteMealLog    = (id)        => client.delete(`/meals/${id}/`).then(r => r.data);

// Surplus & Claims
export const getSurplusBoard  = ()          => client.get('/surplus/').then(r => r.data);
export const claimSurplus     = (id, d)     => client.post(`/surplus/${id}/claim/`, d).then(r => r.data);
export const addFeedback      = (data)      => client.post('/feedback/', data);
export const getPrediction    = (type)      => client.get('/predict/', { params: { meal_type: type } }).then(r => r.data);
export const getWasteReport   = ()          => client.get('/waste-report/').then(r => r.data);

// NGO Management & Claims
export const getNGOContacts   = ()          => client.get('/ngo/').then(r => r.data);
export const addNGOContact    = (data)      => client.post('/ngo/', data).then(r => r.data);
export const updateNGOContact = (id, data)  => client.put(`/ngo/${id}/`, data).then(r => r.data);
export const deleteNGOContact = (id)        => client.delete(`/ngo/${id}/`).then(r => r.data);
export const getNGOClaims     = ()          => client.get('/ngo/claims/').then(r => r.data);
export const submitNGOClaim   = (data)      => client.post('/ngo/claims/', data).then(r => r.data);
export const approveNGOClaim  = (id)        => client.post(`/ngo/claims/${id}/approve/`).then(r => r.data);
export const rejectNGOClaim   = (id)        => client.post(`/ngo/claims/${id}/reject/`).then(r => r.data);
export const getNGODashboardStats = ()    => client.get('/ngo/dashboard-stats/').then(r => r.data);

export default client;
