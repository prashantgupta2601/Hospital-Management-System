const API_BASE_URL = 'http://localhost:8080/api';

// Axios Global Configuration
axios.defaults.baseURL = API_BASE_URL;

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // Sidebar Toggle
    const sidebarCollapse = document.getElementById('sidebarCollapse');
    const sidebar = document.getElementById('sidebar');
    if (sidebarCollapse) {
        sidebarCollapse.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }

    // Theme Toggle
    const themeToggle = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    const themeIcon = themeToggle ? themeToggle.querySelector('i') : null;

    if (themeToggle) {
        const savedTheme = localStorage.getItem('theme') || 'light';
        htmlElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);

        themeToggle.addEventListener('click', () => {
            const currentTheme = htmlElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            htmlElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme);
        });
    }

    function updateThemeIcon(theme) {
        if (!themeIcon) return;
        if (theme === 'dark') {
            themeIcon.className = 'fas fa-sun';
        } else {
            themeIcon.className = 'fas fa-moon';
        }
    }

    // Page Specific Initialization
    const path = window.location.pathname;
    if (path.endsWith('index.html') || path === '/' || path.endsWith('frontend/')) {
        loadDashboardStats();
        loadRecentAppointments();
    } else if (path.endsWith('patients.html')) {
        loadPatients();
    } else if (path.endsWith('doctors.html')) {
        loadDoctors();
    } else if (path.endsWith('appointments.html')) {
        loadAppointments();
    }
}

// Dashboard Functions
async function loadDashboardStats() {
    try {
        const [patients, doctors, appointments] = await Promise.all([
            axios.get('/patients'),
            axios.get('/doctors'),
            axios.get('/appointments')
        ]);

        updateStat('total-patients', patients.data.length);
        updateStat('total-doctors', doctors.data.length);
        updateStat('total-appointments', appointments.data.length);
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function updateStat(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

async function loadRecentAppointments() {
    const tableBody = document.querySelector('#recent-appointments-table tbody');
    if (!tableBody) return;

    try {
        const response = await axios.get('/appointments');
        const appointments = response.data.slice(0, 5);

        if (appointments.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No recent appointments found</td></tr>';
            return;
        }

        tableBody.innerHTML = appointments.map(app => `
            <tr>
                <td>#${app.id}</td>
                <td><div class="fw-bold">${app.patientName}</div></td>
                <td>Dr. ${app.doctorName}</td>
                <td>${new Date(app.appointmentDate).toLocaleDateString()}</td>
                <td><span class="badge ${getStatusBadgeClass(app.status)}">${app.status}</span></td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading appointments:', error);
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Failed to load data</td></tr>';
    }
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'SCHEDULED': return 'bg-primary-soft text-primary';
        case 'COMPLETED': return 'bg-success-soft text-success';
        case 'CANCELLED': return 'bg-warning-soft text-warning';
        default: return 'bg-secondary text-white';
    }
}

// Placeholder functions for other pages
async function loadPatients() { console.log('Loading patients...'); }
async function loadDoctors() { console.log('Loading doctors...'); }
async function loadAppointments() { console.log('Loading appointments...'); }
