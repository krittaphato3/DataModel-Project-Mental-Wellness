import axios from 'axios';

// In development, Vite proxy forwards /api -> backend.
// In production (Vercel), frontend and API are on the same origin,
// so /api works directly.
const API_BASE = '/api';

export const predict = async (formData) => {
  const response = await axios.post(`${API_BASE}/predict`, formData);
  return response.data;
};

export const submitFeedback = async (feedback) => {
  const response = await axios.post(`${API_BASE}/feedback`, feedback);
  return response.data;
};