import axios from 'axios';

// Base API configuration
const API_URL = 'http://127.0.0.1:8001'; // Changed to 8001 to avoid conflicts
const USE_MOCK = false; // Set to false to use actual API

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

export const detectObjects = async (imageFile, email = null) => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            objects: [
              { label: 'Person', confidence: 0.95, box: [50, 50, 200, 300] },
              { label: 'Car', confidence: 0.88, box: [300, 100, 150, 100] },
            ]
          }
        });
      }, 1500);
    });
  }

  const formData = new FormData();
  formData.append('image', imageFile);
  
  try {
    const url = email ? `/detect?email=${encodeURIComponent(email)}` : '/detect';
    const response = await apiClient.post(url, formData);
    return response;
  } catch (error) {
    console.error('Error during detection API call:', error);
    throw error;
  }
};

export const fetchHistory = async (email = null) => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            history: [
              { id: 1, date: '2026-05-03T10:00:00Z', objectCount: 2, imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&q=80' },
              { id: 2, date: '2026-05-02T14:30:00Z', objectCount: 5, imageUrl: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=500&q=80' }
            ]
          }
        });
      }, 800);
    });
  }

  try {
    const url = email ? `/detections?email=${encodeURIComponent(email)}` : '/detections';
    const response = await apiClient.get(url);
    return response;
  } catch (error) {
    console.error('Error fetching history:', error);
    throw error;
  }
};

export const triggerTraining = async (config, developerToken) => {
  try {
    const response = await axios.post(`${API_URL}/api/v1/developer/train`, config, {
      headers: {
        'Content-Type': 'application/json',
        'X-Developer-Token': developerToken,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error triggering training API call:', error);
    throw error;
  }
};

export const registerUser = async (username, email, phone, password) => {
  try {
    const response = await axios.post(`${API_URL}/api/v1/auth/signup`, {
      username,
      email,
      phone: phone || null,
      password
    });
    return response.data;
  } catch (error) {
    console.error('Registration API error:', error);
    throw error;
  }
};

export const loginUser = async (emailOrPhone, password) => {
  try {
    const response = await axios.post(`${API_URL}/api/v1/auth/login`, {
      email: emailOrPhone, // mapped to email parameter in payload
      password
    });
    return response.data;
  } catch (error) {
    console.error('Login API error:', error);
    throw error;
  }
};

export const requestOtp = async (emailOrPhone) => {
  try {
    const response = await axios.post(`${API_URL}/api/v1/auth/forgot-password-otp`, {
      email_or_phone: emailOrPhone
    });
    return response.data;
  } catch (error) {
    console.error('Request OTP API error:', error);
    throw error;
  }
};

export const resetPassword = async (emailOrPhone, otpCode, newPassword) => {
  try {
    const response = await axios.post(`${API_URL}/api/v1/auth/reset-password`, {
      email_or_phone: emailOrPhone,
      otp_code: otpCode,
      new_password: newPassword
    });
    return response.data;
  } catch (error) {
    console.error('Reset Password API error:', error);
    throw error;
  }
};
