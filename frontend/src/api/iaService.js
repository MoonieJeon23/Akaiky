// frontend/src/api/iaService.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const getIAConsail = async (userMessage) => {
  try {
    const response = await axios.post(`${API_URL}/ia/conseil`, {
      message: userMessage
    });
    return response.data;
  } catch (error) {
    console.error("Lien API cassé :", error);
    throw error;
  }
};