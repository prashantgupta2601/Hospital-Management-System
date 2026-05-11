const API_BASE_URL = 'http://localhost:8080/api';

document.addEventListener('DOMContentLoaded', () => {
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
    const themeIcon = themeToggle.querySelector('i');

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

    function updateThemeIcon(theme) {
        if (theme === 'dark') {
            themeIcon.classList.replace('fa-moon', 'fa-sun');
        } else {
            themeIcon.classList.replace('fa-sun', 'fa-moon');
        }
    }

    // Initialize Dashboard Data
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        loadDashboardStats();
        loadRecentAppointments();
    }
});

// Axios Global Configuration
axios.defaults.baseURL = API_BASE_URL;

async function loadDashboardStats() {
    try {
        const [patients, doctors, appointments] = await Promise.all([
            axios.get('/patients'),
            axios.get('/doctors'),
            axios.get('/appointments')
        ]);

        document.getElementById('total-patients').textContent = patients.data.length;
        document.getElementById('total-doctors').textContent = doctors.data.length;
        document.getElementById('total-appointments').textContent = appointments.data.length;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadRecentAppointments() {
    const tableBody = document.querySelector('#recent-appointments-table tbody');
    try {
        const response = await axios.get('/appointments');
        const appointments = response.data.slice(0, 5); // Get recent 5

        if (appointments.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No recent appointments found</td></tr>';
            return;
        }

        tableBody.innerHTML = appointments.map(app => `
            <tr>
                <td>#${app.id}</td>
                <td>${app.patientName}</td>
                <td>Dr. ${app.doctorName}</td>
                <td>${new Date(app.appointmentDate).toLocaleString()}</td>
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
        case 'SCHEDULED': return 'bg-primary';
        case 'COMPLETED': return 'bg-success';
        case 'CANCELLED': return 'bg-danger';
        default: return 'bg-secondary';
    }
}
