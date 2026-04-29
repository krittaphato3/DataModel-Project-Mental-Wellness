import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const predict = async (data) => {
  const response = await axios.post(`${API_BASE}/predict`, data);
  return response.data;
};

export const submitFeedback = async (feedback) => {
  const response = await axios.post(`${API_BASE}/feedback`, feedback);
  return response.data;
};