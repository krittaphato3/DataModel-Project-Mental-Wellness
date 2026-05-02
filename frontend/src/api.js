import axios from 'axios';

// Directly use local backend – no .env needed for testing
const API_BASE = 'http://localhost:8000';

export const predict = async (formData) => {
  const response = await axios.post(`${API_BASE}/predict`, formData);
  return response.data;
};

export const submitFeedback = async (feedback) => {
  const response = await axios.post(`${API_BASE}/feedback`, feedback);
  return response.data;
};