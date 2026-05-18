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
        const [patientsRes, doctorsRes, appointmentsRes] = await Promise.all([
            AppState.getPatients(),
            AppState.getDoctors(),
            AppState.getAppointments()
        ]);

        updateStat('total-patients', patientsRes.data.length);
        updateStat('total-doctors', doctorsRes.data.length);
        updateStat('total-appointments', appointmentsRes.data.length);
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
        const response = await AppState.getAppointments();
        const appointments = response.data.slice(0, 5);

        if (appointments.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No recent appointments found</td></tr>';
            return;
        }

        tableBody.innerHTML = appointments.map(app => `
            <tr>
                <td>#${app.id < 0 ? 'Pending' : app.id}</td>
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
        const response = await AppState.getPatients();
        renderPatientsList(response.data);
    } catch (error) {
        showError(tableBody, 7, 'Failed to load patients');
        if (window.Toast) window.Toast.error('Failed to load patients');
    }
}

function renderPatientsList(patients) {
    const tableBody = document.querySelector('#patients-table tbody');
    if (!tableBody) return;

    if (!patients || patients.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No patients found</td></tr>';
        return;
    }

    tableBody.innerHTML = patients.map(p => {
        const optimisticClass = p.isOptimistic ? 'optimistic-pending' : '';
        const pendingBadge = p.isOptimistic ? ' <span class="spinner-border spinner-border-sm ms-1 text-primary" style="width: 12px; height: 12px; vertical-align: middle;"></span>' : '';
        return `
            <tr class="${optimisticClass}">
                <td>#${p.id < 0 ? 'Pending' : p.id}</td>
                <td><div class="fw-bold text-primary">${p.firstName} ${p.lastName}${pendingBadge}</div></td>
                <td>${p.contactNumber || 'N/A'}</td>
                <td>${p.email}</td>
                <td><span class="text-muted small text-uppercase">${p.gender}</span></td>
                <td>${p.age || 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-light text-primary me-1" onclick="editPatient(${p.id})" ${p.isOptimistic ? 'disabled' : ''}><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-light text-danger" onclick="deletePatient(${p.id})" ${p.isOptimistic ? 'disabled' : ''}><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    }).join('');
}

async function handleAddPatient(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Create optimistic record
    const tempId = -Date.now();
    const optimisticPatient = {
        id: tempId,
        firstName: data.firstName,
        lastName: data.lastName,
        contactNumber: data.contactNumber,
        email: data.email,
        gender: data.gender,
        age: data.age,
        isOptimistic: true
    };

    // Close Modal immediately for smooth responsive feel
    const modalEl = document.getElementById('addPatientModal');
    if (modalEl) {
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();
    }
    form.reset();

    // 1. Inject optimistic item and re-render
    AppState.addPatientOptimistic(optimisticPatient);
    renderPatientsList(AppState.cache.patients);

    try {
        const res = await PatientAPI.create(data);
        // 2. Success: replace with actual server-confirmed patient
        AppState.confirmPatient(tempId, res.data);
        renderPatientsList(AppState.cache.patients);
        if (window.Toast) {
            window.Toast.success('Patient registered successfully!');
        }
    } catch (error) {
        console.error('[AddPatient] API failed, rolling back optimistic patient UI:', error);
        
        // 3. Failure: Rollback to original backup list and re-render
        AppState.rollbackPatients();
        renderPatientsList(AppState.cache.patients);

        const errMsg = error.response?.data?.message || 'Failed to add patient';
        if (window.Toast) {
            window.Toast.error(`${errMsg}. Click to try again.`, 'Retry', () => {
                handleAddPatientRetry(data);
            });
        }
    }
}

async function handleAddPatientRetry(data) {
    const tempId = -Date.now();
    const optimisticPatient = {
        id: tempId,
        firstName: data.firstName,
        lastName: data.lastName,
        contactNumber: data.contactNumber,
        email: data.email,
        gender: data.gender,
        age: data.age,
        isOptimistic: true
    };

    AppState.addPatientOptimistic(optimisticPatient);
    renderPatientsList(AppState.cache.patients);

    try {
        const res = await PatientAPI.create(data);
        AppState.confirmPatient(tempId, res.data);
        renderPatientsList(AppState.cache.patients);
        if (window.Toast) window.Toast.success('Patient registered successfully on retry!');
    } catch (error) {
        AppState.rollbackPatients();
        renderPatientsList(AppState.cache.patients);
        const errMsg = error.response?.data?.message || 'Server connection failed';
        if (window.Toast) window.Toast.error(`Retry failed: ${errMsg}`);
    }
}

// --- Doctors Page Logic ---
async function loadDoctorsPage() {
    const tableBody = document.querySelector('#doctors-table tbody');
    if (!tableBody) return;

    showLoading(tableBody, 6);

    try {
        const response = await AppState.getDoctors();
        renderDoctorsList(response.data);
    } catch (error) {
        showError(tableBody, 6, 'Failed to load doctors');
        if (window.Toast) window.Toast.error('Failed to load doctors');
    }
}

function renderDoctorsList(doctors) {
    const tableBody = document.querySelector('#doctors-table tbody');
    if (!tableBody) return;

    if (!doctors || doctors.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No doctors registered</td></tr>';
        return;
    }

    tableBody.innerHTML = doctors.map(d => `
        <tr>
            <td>#${d.id}</td>
            <td><div class="fw-bold text-primary">Dr. ${d.firstName} ${d.lastName}</div></td>
            <td><span class="badge bg-info-soft text-info">${d.specialization}</span></td>
            <td>${d.email}</td>
            <td><span class="badge bg-success-soft text-success">Available</span></td>
            <td>
                <button class="btn btn-sm btn-light text-primary me-1" onclick="editDoctor(${d.id})"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-light text-danger" onclick="deleteDoctor(${d.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
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
        AppState.invalidate('doctors'); // invalidate memory cache
        loadDoctorsPage();
        if (window.Toast) {
            window.Toast.success('Doctor registered successfully!');
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
        const response = await AppState.getAppointments();
        renderAppointmentsList(response.data);
    } catch (error) {
        showError(tableBody, 6, 'Failed to load appointments');
        if (window.Toast) window.Toast.error('Failed to load appointments');
    }
}

function renderAppointmentsList(appointments) {
    const tableBody = document.querySelector('#appointments-table tbody');
    if (!tableBody) return;

    if (!appointments || appointments.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No appointments found</td></tr>';
        return;
    }

    tableBody.innerHTML = appointments.map(a => {
        const optimisticClass = a.isOptimistic ? 'optimistic-pending' : '';
        const pendingBadge = a.isOptimistic ? ' <span class="spinner-border spinner-border-sm ms-1 text-primary" style="width: 12px; height: 12px; vertical-align: middle;"></span>' : '';
        return `
            <tr class="${optimisticClass}">
                <td>#${a.id < 0 ? 'Pending' : a.id}</td>
                <td><div class="fw-bold text-primary">${a.patientName}${pendingBadge}</div></td>
                <td>Dr. ${a.doctorName}</td>
                <td>${new Date(a.appointmentDate).toLocaleString()}</td>
                <td><span class="badge ${getStatusBadgeClass(a.status)}">${a.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-light text-primary me-1" title="View Detail" ${a.isOptimistic ? 'disabled' : ''}><i class="fas fa-eye"></i></button>
                    <button class="btn btn-sm btn-light text-success me-1" onclick="updateStatus(${a.id}, 'COMPLETED')" title="Mark Completed" ${a.isOptimistic ? 'disabled' : ''}><i class="fas fa-check"></i></button>
                    <button class="btn btn-sm btn-light text-danger" onclick="updateStatus(${a.id}, 'CANCELLED')" title="Cancel" ${a.isOptimistic ? 'disabled' : ''}><i class="fas fa-times"></i></button>
                </td>
            </tr>
        `;
    }).join('');
}

async function handleBookAppointment(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    data.patientId = parseInt(data.patientId);
    data.doctorId = parseInt(data.doctorId);

    // Look up real patient and doctor names from local state if available to render immediately
    let patientName = `Patient #${data.patientId}`;
    let doctorName = `Doctor #${data.doctorId}`;
    
    if (AppState.cache.patients) {
        const p = AppState.cache.patients.find(x => x.id === data.patientId);
        if (p) patientName = `${p.firstName} ${p.lastName}`;
    }
    if (AppState.cache.doctors) {
        const d = AppState.cache.doctors.find(x => x.id === data.doctorId);
        if (d) doctorName = `${d.firstName} ${d.lastName}`;
    }

    const tempId = -Date.now();
    const optimisticAppointment = {
        id: tempId,
        patientId: data.patientId,
        patientName: patientName,
        doctorId: data.doctorId,
        doctorName: doctorName,
        appointmentDate: data.appointmentDate,
        status: 'SCHEDULED',
        isOptimistic: true
    };

    // Close Modal instantly
    const modalEl = document.getElementById('bookAppointmentModal');
    if (modalEl) {
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();
    }
    form.reset();

    // 1. Inject optimistic appointment and re-render
    AppState.addAppointmentOptimistic(optimisticAppointment);
    renderAppointmentsList(AppState.cache.appointments);

    try {
        const res = await AppointmentAPI.create(data);
        // 2. Success: confirm real appointment
        AppState.confirmAppointment(tempId, res.data);
        renderAppointmentsList(AppState.cache.appointments);
        if (window.Toast) {
            window.Toast.success('Appointment booked successfully!');
        }
    } catch (error) {
        console.error('[BookAppointment] API failed, rolling back optimistic appointment UI:', error);

        // 3. Failure: Rollback appointment state and re-render
        AppState.rollbackAppointments();
        renderAppointmentsList(AppState.cache.appointments);

        const errMsg = error.response?.data?.message || 'Failed to book appointment';
        if (window.Toast) {
            window.Toast.error(`${errMsg}. Click to retry booking.`, 'Retry', () => {
                handleBookAppointmentRetry(data);
            });
        }
    }
}

async function handleBookAppointmentRetry(data) {
    let patientName = `Patient #${data.patientId}`;
    let doctorName = `Doctor #${data.doctorId}`;
    
    if (AppState.cache.patients) {
        const p = AppState.cache.patients.find(x => x.id === data.patientId);
        if (p) patientName = `${p.firstName} ${p.lastName}`;
    }
    if (AppState.cache.doctors) {
        const d = AppState.cache.doctors.find(x => x.id === data.doctorId);
        if (d) doctorName = `${d.firstName} ${d.lastName}`;
    }

    const tempId = -Date.now();
    const optimisticAppointment = {
        id: tempId,
        patientId: data.patientId,
        patientName: patientName,
        doctorId: data.doctorId,
        doctorName: doctorName,
        appointmentDate: data.appointmentDate,
        status: 'SCHEDULED',
        isOptimistic: true
    };

    AppState.addAppointmentOptimistic(optimisticAppointment);
    renderAppointmentsList(AppState.cache.appointments);

    try {
        const res = await AppointmentAPI.create(data);
        AppState.confirmAppointment(tempId, res.data);
        renderAppointmentsList(AppState.cache.appointments);
        if (window.Toast) window.Toast.success('Appointment booked successfully on retry!');
    } catch (error) {
        AppState.rollbackAppointments();
        renderAppointmentsList(AppState.cache.appointments);
        const errMsg = error.response?.data?.message || 'Server connection failed';
        if (window.Toast) window.Toast.error(`Retry failed: ${errMsg}`);
    }
}

async function updateStatus(id, status) {
    if(!confirm(`Are you sure you want to mark this appointment as ${status}?`)) return;
    try {
        await AppointmentAPI.updateStatus(id, status);
        AppState.invalidate('appointments'); // invalidate appointments cache
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
            AppState.invalidate('patients'); // invalidate memory cache
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
            AppState.invalidate('doctors'); // invalidate memory cache
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

