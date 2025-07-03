import axios from 'axios';

const DEFAULT_API_URI = `http://192.168.1.33:3000`

const axiosInsatance = axios.create({
    baseURL: `${DEFAULT_API_URI}/api`,
});

export default axiosInsatance;