const API_BASE_URL = 'http://localhost:8081/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request Interceptor for Loading States (Global)
apiClient.interceptors.request.use(config => {
    // You could trigger a global loading spinner here
    console.log('API Request Started:', config.url);
    return config;
}, error => {
    return Promise.reject(error);
});

// Response Interceptor for Error Handling
apiClient.interceptors.response.use(response => {
    return response;
}, error => {
    console.error('API Error:', error.response || error.message);
    const message = error.response?.data?.message || 'Something went wrong. Please try again.';
    // You could trigger a toast notification here
    return Promise.reject(error);
});

const PatientAPI = {
    getAll: () => apiClient.get('/patients'),
    getById: (id) => apiClient.get(`/patients/${id}`),
    create: (data) => apiClient.post('/patients', data),
    update: (id, data) => apiClient.put(`/patients/${id}`, data),
    delete: (id) => apiClient.delete(`/patients/${id}`)
};

const DoctorAPI = {
    getAll: () => apiClient.get('/doctors'),
    getById: (id) => apiClient.get(`/doctors/${id}`),
    create: (data) => apiClient.post('/doctors', data),
    update: (id, data) => apiClient.put(`/doctors/${id}`, data),
    delete: (id) => apiClient.delete(`/doctors/${id}`)
};

const AppointmentAPI = {
    getAll: () => apiClient.get('/appointments'),
    getById: (id) => apiClient.get(`/appointments/${id}`),
    create: (data) => apiClient.post('/appointments', data),
    getByPatientId: (patientId) => apiClient.get(`/appointments/patient/${patientId}`),
    getByDoctorId: (doctorId) => apiClient.get(`/appointments/doctor/${doctorId}`),
    updateStatus: (id, status) => apiClient.patch(`/appointments/${id}/status?status=${status}`),
    delete: (id) => apiClient.delete(`/appointments/${id}`)
};
