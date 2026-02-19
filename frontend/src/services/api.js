import axios from 'axios';

const api = axios.create({
    // Use relative path '/api' so Vercel proxies it to Render
    // This makes cookies "First Party" and fixes mobile login
    baseURL: '/api',
    withCredentials: true // Send cookies with requests
});

export default api;
