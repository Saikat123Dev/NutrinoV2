import axios from 'axios';

const DEFAULT_API_URI = `https://nutrinov2.onrender.com`

const axiosInsatance = axios.create({
    baseURL: `${DEFAULT_API_URI}/api`,
});

export default axiosInsatance;