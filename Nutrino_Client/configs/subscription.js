import axios from 'axios';

const API_BASE_URL = 'https://a2f8-115-124-42-212.ngrok-free.app/api/v1'; // e.g., 'http://localhost:3000/api'

export const createSubscriptionOrder = async (userId, planId) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/subscription/create-order`, {
      userId,
      planId
    });
    return response.data;
  } catch (error) {
    console.error('Error creating subscription order:', error);
    throw error;
  }
};

export const verifyPayment = async (paymentData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/subscription/verify`, paymentData);
    return response.data;
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
};

export const checkUserSubscription = async (email) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/subscriptions/user/${email}`);
    return response.data;
  } catch (error) {
    console.error('Error checking subscription:', error);
    throw error;
  }
};