import axios from 'axios';

const DEFAULT_API_URI = `https://997f4fba7f04.ngrok-free.app`

const axiosInsatance = axios.create({
    baseURL: `${DEFAULT_API_URI}/api`,
});

export default axiosInsatance;