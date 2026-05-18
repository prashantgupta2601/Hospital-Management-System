// js/main.js

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
        themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    // Page Specific Initialization
    const path = window.location.pathname;
    if (path.endsWith('index.html') || path === '/' || path.endsWith('frontend/')) {
        loadDashboardStats();
        loadRecentAppointments();
    } else if (path.endsWith('patients.html')) {
        loadPatientsPage();
    } else if (path.endsWith('doctors.html')) {
        loadDoctorsPage();
    } else if (path.endsWith('appointments.html')) {
        loadAppointmentsPage();
    }
}

// Dashboard Functions
async function loadDashboardStats() {
    if (window.SkeletonLoader) {
        window.SkeletonLoader.showStats();
    }
    try {
        const [patients, doctors, appointments] = await Promise.all([
            PatientAPI.getAll(),
            DoctorAPI.getAll(),
            AppointmentAPI.getAll()
        ]);

        updateStat('total-patients', patients.data.length);
        updateStat('total-doctors', doctors.data.length);
        updateStat('total-appointments', appointments.data.length);
    } catch (error) {
        console.error('Error loading stats:', error);
        if (window.Toast) window.Toast.error('Failed to load dashboard statistics');
    }
}

function updateStat(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

async function loadRecentAppointments() {
    const tableBody = document.querySelector('#recent-appointments-table tbody');
    if (!tableBody) return;

    showLoading(tableBody, 5);

    try {
        const response = await AppointmentAPI.getAll();
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
        showError(tableBody, 5, 'Failed to load data');
        if (window.Toast) window.Toast.error('Failed to load recent appointments');
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

// --- Patients Page Logic ---
async function loadPatientsPage() {
    const tableBody = document.querySelector('#patients-table tbody');
    if (!tableBody) return;

    showLoading(tableBody, 7);

    try {
        const response = await PatientAPI.getAll();
        const patients = response.data;
        
        if (patients.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No patients found</td></tr>';
            return;
        }

        tableBody.innerHTML = patients.map(p => `
            <tr>
                <td>#${p.id}</td>
                <td><div class="fw-bold text-primary">${p.firstName} ${p.lastName}</div></td>
                <td>${p.contactNumber || 'N/A'}</td>
                <td>${p.email}</td>
                <td><span class="text-muted small text-uppercase">${p.gender}</span></td>
                <td>${p.age || 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-light text-primary me-1" onclick="editPatient(${p.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-light text-danger" onclick="deletePatient(${p.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        showError(tableBody, 7, 'Failed to load patients');
        if (window.Toast) window.Toast.error('Failed to load patients');
    }
}

async function handleAddPatient(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Adding...';

    try {
        await PatientAPI.create(data);
        form.reset();
        bootstrap.Modal.getInstance(document.getElementById('addPatientModal')).hide();
        loadPatientsPage();
        if (window.Toast) {
            window.Toast.success('Patient registered successfully!');
        } else {
            alert('Patient added successfully!');
        }
    } catch (error) {
        const errMsg = error.response?.data?.message || 'Failed to add patient';
        if (window.Toast) {
            window.Toast.error(errMsg);
        } else {
            alert(errMsg);
        }
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// --- Doctors Page Logic ---
async function loadDoctorsPage() {
    const tableBody = document.querySelector('#doctors-table tbody');
    if (!tableBody) return;

    showLoading(tableBody, 6);

    try {
        const response = await DoctorAPI.getAll();
        const doctors = response.data;
        
        if (doctors.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No doctors registered</td></tr>';
            return;
        }

        tableBody.innerHTML = doctors.map(d => `
            <tr>
                <td>#${d.id}</td>
                <td><div class="fw-bold">Dr. ${d.firstName} ${d.lastName}</div></td>
                <td><span class="badge bg-info-soft text-info">${d.specialization}</span></td>
                <td>${d.email}</td>
                <td><span class="badge bg-success-soft text-success">Available</span></td>
                <td>
                    <button class="btn btn-sm btn-light text-primary me-1" onclick="editDoctor(${d.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-light text-danger" onclick="deleteDoctor(${d.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        showError(tableBody, 6, 'Failed to load doctors');
        if (window.Toast) window.Toast.error('Failed to load doctors');
    }
}

async function handleAddDoctor(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Registering...';

    try {
        await DoctorAPI.create(data);
        form.reset();
        bootstrap.Modal.getInstance(document.getElementById('addDoctorModal')).hide();
        loadDoctorsPage();
        if (window.Toast) {
            window.Toast.success('Doctor registered successfully!');
        } else {
            alert('Doctor registered successfully!');
        }
    } catch (error) {
        const errMsg = error.response?.data?.message || 'Failed to register doctor';
        if (window.Toast) {
            window.Toast.error(errMsg);
        } else {
            alert(errMsg);
        }
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Register Doctor';
    }
}

// --- Appointments Page Logic ---
async function loadAppointmentsPage() {
    const tableBody = document.querySelector('#appointments-table tbody');
    if (!tableBody) return;

    showLoading(tableBody, 6);

    try {
        const response = await AppointmentAPI.getAll();
        const appointments = response.data;
        
        if (appointments.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No appointments found</td></tr>';
            return;
        }

        tableBody.innerHTML = appointments.map(a => `
            <tr>
                <td>#${a.id}</td>
                <td><div class="fw-bold text-primary">${a.patientName}</div></td>
                <td>Dr. ${a.doctorName}</td>
                <td>${new Date(a.appointmentDate).toLocaleString()}</td>
                <td><span class="badge ${getStatusBadgeClass(a.status)}">${a.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-light text-primary me-1" title="View Detail"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-sm btn-light text-success me-1" onclick="updateStatus(${a.id}, 'COMPLETED')" title="Mark Completed"><i class="fas fa-check"></i></button>
                    <button class="btn btn-sm btn-light text-danger" onclick="updateStatus(${a.id}, 'CANCELLED')" title="Cancel"><i class="fas fa-times"></i></button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        showError(tableBody, 6, 'Failed to load appointments');
        if (window.Toast) window.Toast.error('Failed to load appointments');
    }
}

async function handleBookAppointment(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Convert patientId and doctorId to numbers
    data.patientId = parseInt(data.patientId);
    data.doctorId = parseInt(data.doctorId);

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Booking...';

    try {
        await AppointmentAPI.create(data);
        form.reset();
        bootstrap.Modal.getInstance(document.getElementById('bookAppointmentModal')).hide();
        loadAppointmentsPage();
        if (window.Toast) {
            window.Toast.success('Appointment booked successfully!');
        } else {
            alert('Appointment booked successfully!');
        }
    } catch (error) {
        const errMsg = error.response?.data?.message || 'Failed to book appointment';
        if (window.Toast) {
            window.Toast.error(errMsg);
        } else {
            alert(errMsg);
        }
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Book Appointment';
    }
}

async function updateStatus(id, status) {
    if(!confirm(`Are you sure you want to mark this appointment as ${status}?`)) return;
    try {
        await AppointmentAPI.updateStatus(id, status);
        loadAppointmentsPage();
        if (window.Toast) {
            window.Toast.success(`Appointment marked as ${status.toLowerCase()}!`);
        }
    } catch (error) {
        if (window.Toast) {
            window.Toast.error('Failed to update status');
        } else {
            alert('Failed to update status');
        }
    }
}

// --- Helper Functions ---
function showLoading(element, colspan) {
    if (window.SkeletonLoader) {
        window.SkeletonLoader.showTable(element, colspan, 5);
    } else {
        element.innerHTML = `<tr><td colspan="${colspan}" class="text-center py-4"><div class="spinner-border spinner-border-sm text-primary me-2"></div>Loading...</td></tr>`;
    }
}

function showError(element, colspan, message) {
    element.innerHTML = `<tr><td colspan="${colspan}" class="text-center text-danger py-4"><i class="fas fa-exclamation-circle me-2"></i>${message}</td></tr>`;
}

// Global scope functions for onclick events
window.deletePatient = async (id) => {
    if(confirm('Are you sure you want to delete this patient?')) {
        try {
            await PatientAPI.delete(id);
            loadPatientsPage();
            if (window.Toast) {
                window.Toast.success('Patient deleted successfully');
            } else {
                alert('Patient deleted successfully');
            }
        } catch (error) {
            if (window.Toast) {
                window.Toast.error('Failed to delete patient');
            } else {
                alert('Failed to delete patient');
            }
        }
    }
};

window.deleteDoctor = async (id) => {
    if(confirm('Are you sure you want to delete this doctor?')) {
        try {
            await DoctorAPI.delete(id);
            loadDoctorsPage();
            if (window.Toast) {
                window.Toast.success('Doctor deleted successfully');
            } else {
                alert('Doctor deleted successfully');
            }
        } catch (error) {
            if (window.Toast) {
                window.Toast.error('Failed to delete doctor');
            } else {
                alert('Failed to delete doctor');
            }
        }
    }
};

window.updateStatus = updateStatus;
