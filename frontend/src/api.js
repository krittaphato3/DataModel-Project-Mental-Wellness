import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const predict = async (formData) => {
  const response = await axios.post(`${API_BASE}/predict`, formData);
  return response.data;
};

export const submitFeedback = async (feedback) => {
  const response = await axios.post(`${API_BASE}/feedback`, feedback);
  return response.data;
};

export const updateFeedback = async (submissionId, rating, comment) => {
  const response = await axios.post(`${API_BASE}/submit-feedback`, {
    submission_id: submissionId,
    rating,
    comment,
  });
  return response.data;
};