import axios from 'axios';

const api = axios.create({
    baseURL: '/api', // Proxy handles this
    timeout: 10000,
});

api.interceptors.request.use(
    (config) => {
        const authStorageStr = localStorage.getItem('auth-storage');
        if (authStorageStr) {
            try {
                const { state } = JSON.parse(authStorageStr);
                if (state?.token) {
                    config.headers.Authorization = `Bearer ${state.token}`;
                }
            } catch (e) {
                console.error("Failed to parse auth storage", e);
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const data = error.response?.data;
        const rawMsg = data?.message || data?.msg;
        const message = Array.isArray(rawMsg) ? rawMsg[0] : rawMsg;

        if (error.response?.status === 401) {
            console.warn('Unauthorized request, token might be expired.');
        }

        // Standardize the error object
        error.detailedMessage = message || error.message;

        console.error('API Error:', error.detailedMessage);
        return Promise.reject(error);
    }
);

export default api;
