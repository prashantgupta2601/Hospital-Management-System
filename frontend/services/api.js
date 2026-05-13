const API_BASE_URL = 'http://localhost:8081/api';

// ─── Token Helpers ────────────────────────────────────────────────────────────
const AuthService = {
    getToken: () => localStorage.getItem('hms_jwt'),
    setToken: (token) => localStorage.setItem('hms_jwt', token),
    removeToken: () => localStorage.removeItem('hms_jwt'),

    getUser: () => {
        const user = localStorage.getItem('hms_user');
        return user ? JSON.parse(user) : null;
    },
    setUser: (user) => localStorage.setItem('hms_user', JSON.stringify(user)),
    removeUser: () => localStorage.removeItem('hms_user'),

    isLoggedIn: () => !!localStorage.getItem('hms_jwt'),

    getRoles: () => {
        const user = AuthService.getUser();
        return user ? user.roles : [];
    },

    hasRole: (role) => AuthService.getRoles().includes(role),

    logout: () => {
        AuthService.removeToken();
        AuthService.removeUser();
        window.location.href = '/login.html';
    },

    // POST /api/auth/login
    login: async (username, password) => {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (!res.ok) throw new Error((await res.json()).message || 'Login failed');
        const data = await res.json();
        AuthService.setToken(data.token);
        AuthService.setUser({ id: data.id, username: data.username, email: data.email, roles: data.roles });
        return data;
    },

    // POST /api/auth/register
    register: async (username, email, password, roles) => {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, roles })
        });
        if (!res.ok) throw new Error((await res.json()).message || 'Registration failed');
        return res.json();
    }
};

// ─── Axios Instance ───────────────────────────────────────────────────────────
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' }
});

// Request Interceptor — attach JWT to every request
apiClient.interceptors.request.use(config => {
    const token = AuthService.getToken();
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
}, error => Promise.reject(error));

// Response Interceptor — handle 401/403
apiClient.interceptors.response.use(response => {
    return response;
}, error => {
    const status = error.response?.status;
    if (status === 401) {
        console.warn('Unauthorized — redirecting to login');
        AuthService.logout();
    } else if (status === 403) {
        console.error('Forbidden — insufficient permissions');
        alert('You do not have permission to perform this action.');
    } else {
        console.error('API Error:', error.response || error.message);
    }
    return Promise.reject(error);
});

// ─── API Modules ──────────────────────────────────────────────────────────────
const PatientAPI = {
    getAll:  ()           => apiClient.get('/patients'),
    getById: (id)         => apiClient.get(`/patients/${id}`),
    create:  (data)       => apiClient.post('/patients', data),
    update:  (id, data)   => apiClient.put(`/patients/${id}`, data),
    delete:  (id)         => apiClient.delete(`/patients/${id}`)
};

const DoctorAPI = {
    getAll:  ()           => apiClient.get('/doctors'),
    getById: (id)         => apiClient.get(`/doctors/${id}`),
    create:  (data)       => apiClient.post('/doctors', data),
    update:  (id, data)   => apiClient.put(`/doctors/${id}`, data),
    delete:  (id)         => apiClient.delete(`/doctors/${id}`)
};

const AppointmentAPI = {
    getAll:         ()           => apiClient.get('/appointments'),
    getById:        (id)         => apiClient.get(`/appointments/${id}`),
    create:         (data)       => apiClient.post('/appointments', data),
    getByPatientId: (patientId)  => apiClient.get(`/appointments/patient/${patientId}`),
    getByDoctorId:  (doctorId)   => apiClient.get(`/appointments/doctor/${doctorId}`),
    updateStatus:   (id, status) => apiClient.patch(`/appointments/${id}/status?status=${status}`),
    delete:         (id)         => apiClient.delete(`/appointments/${id}`)
};
