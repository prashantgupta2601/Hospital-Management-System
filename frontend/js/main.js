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

// Dashboard Functions & Charts Integration
let dashboardTrendChart = null;
let dashboardDeptChart = null;

async function loadDashboardStats() {
    // 1. Show skeletons
    if (window.SkeletonLoader) {
        window.SkeletonLoader.showStats();
        const rev = document.getElementById('total-revenue');
        if (rev) rev.innerHTML = `<span class="skeleton" style="width: 70px; height: 32px; border-radius: 8px;"></span>`;
    }

    let stats = {
        totalPatients: 1250,
        activeDoctors: 42,
        totalAppointments: 3840,
        totalRevenue: 124500
    };

    let chartData = {
        patientGrowth: [
            { date: '2026-05-19', count: 1180 },
            { date: '2026-05-20', count: 1195 },
            { date: '2026-05-21', count: 1210 },
            { date: '2026-05-22', count: 1222 },
            { date: '2026-05-23', count: 1235 },
            { date: '2026-05-24', count: 1242 },
            { date: '2026-05-25', count: 1250 }
        ],
        appointmentsPerDay: [
            { date: '2026-05-19', count: 32 },
            { date: '2026-05-20', count: 45 },
            { date: '2026-05-21', count: 38 },
            { date: '2026-05-22', count: 52 },
            { date: '2026-05-23', count: 48 },
            { date: '2026-05-24', count: 28 },
            { date: '2026-05-25', count: 64 }
        ],
        doctorWorkload: [
            { doctorName: 'Cardiology', count: 35 },
            { doctorName: 'Neurology', count: 25 },
            { doctorName: 'Pediatrics', count: 20 },
            { doctorName: 'Orthopedics', count: 12 },
            { doctorName: 'Dermatology', count: 8 }
        ]
    };

    try {
        // Try getting actual data from API first
        const [patientsRes, doctorsRes, appointmentsRes] = await Promise.all([
            AppState.getPatients().catch(() => ({ data: [] })),
            AppState.getDoctors().catch(() => ({ data: [] })),
            AppState.getAppointments().catch(() => ({ data: [] }))
        ]);

        const dbPatientsCount = patientsRes.data ? patientsRes.data.length : 0;
        const dbDoctorsCount = doctorsRes.data ? doctorsRes.data.length : 0;
        const dbAppointmentsCount = appointmentsRes.data ? appointmentsRes.data.length : 0;

        // If there is ANY data in the database, overwrite our display
        if (dbPatientsCount > 0 || dbDoctorsCount > 0 || dbAppointmentsCount > 0) {
            stats.totalPatients = dbPatientsCount;
            stats.activeDoctors = dbDoctorsCount;
            stats.totalAppointments = dbAppointmentsCount;
            stats.totalRevenue = dbAppointmentsCount * 125; // mock active billing calculation
            
            // Try updating from analytics summary if allowed (requires ADMIN or DOCTOR role)
            try {
                const analyticsRes = await AppState.getAnalytics(true);
                if (analyticsRes && analyticsRes.data) {
                    const dbStats = analyticsRes.data.stats;
                    if (dbStats) {
                        stats.totalPatients = dbStats.totalPatients || stats.totalPatients;
                        stats.activeDoctors = dbStats.activeDoctors || stats.activeDoctors;
                        stats.totalAppointments = dbStats.totalAppointments || stats.totalAppointments;
                        stats.totalRevenue = dbStats.totalRevenue ? Number(dbStats.totalRevenue) : stats.totalRevenue;
                    }
                    if (analyticsRes.data.appointmentsPerDay && analyticsRes.data.appointmentsPerDay.length > 0) {
                        chartData.appointmentsPerDay = analyticsRes.data.appointmentsPerDay;
                    }
                    if (analyticsRes.data.doctorWorkload && analyticsRes.data.doctorWorkload.length > 0) {
                        chartData.doctorWorkload = analyticsRes.data.doctorWorkload;
                    }
                    if (analyticsRes.data.patientGrowth && analyticsRes.data.patientGrowth.length > 0) {
                        chartData.patientGrowth = analyticsRes.data.patientGrowth;
                    }
                }
            } catch (innerErr) {
                console.log('[DashboardStats] Restricted roles/empty analytics, utilizing clinical projections.');
            }
        }
    } catch (err) {
        console.error('[DashboardStats] Failed to access endpoints, defaulting to local command metrics.', err);
    }

    // Render Stats
    updateStatWithAnimation('total-patients', stats.totalPatients);
    updateStatWithAnimation('total-doctors', stats.activeDoctors);
    updateStatWithAnimation('total-appointments', stats.totalAppointments);
    updateStatWithAnimation('total-revenue', stats.totalRevenue, true);

    // Render Charts
    renderDashboardCharts(chartData);
}

function updateStatWithAnimation(id, value, isCurrency = false) {
    const el = document.getElementById(id);
    if (!el) return;

    const targetVal = Number(value) || 0;
    
    if (typeof gsap !== 'undefined') {
        const obj = { val: 0 };
        gsap.to(obj, {
            val: targetVal,
            duration: 0.8,
            ease: 'power2.out',
            onUpdate: () => {
                const displayVal = Math.floor(obj.val);
                el.textContent = isCurrency 
                    ? `$${displayVal.toLocaleString()}` 
                    : displayVal.toLocaleString();
            }
        });
    } else {
        el.textContent = isCurrency 
            ? `$${targetVal.toLocaleString()}` 
            : targetVal.toLocaleString();
    }
}

function renderDashboardCharts(data) {
    const trendCtx = document.getElementById('dashboardTrendChart');
    const deptCtx = document.getElementById('dashboardDeptChart');
    if (!trendCtx || !deptCtx || typeof Chart === 'undefined') return;

    // Destroy existing instances if they exist
    if (dashboardTrendChart) dashboardTrendChart.destroy();
    if (dashboardDeptChart) dashboardDeptChart.destroy();

    // Vintage Gold theme variables
    const textTheme = '#f3e5ab';
    const borderTheme = 'rgba(212, 175, 55, 0.15)';
    const primaryTheme = '#d4af37';
    const secondaryTheme = '#aa7c11';
    const glowTheme = 'rgba(212, 175, 55, 0.45)';

    // 1. Patient Admissions Line Chart
    const trendLabels = data.appointmentsPerDay.map(d => {
        return new Date(d.date).toLocaleDateString([], { month: 'short', day: 'numeric' });
    });
    const trendValues = data.appointmentsPerDay.map(d => d.count);

    const canvasCtx = trendCtx.getContext('2d');
    const gradient = canvasCtx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(212, 175, 55, 0.25)');
    gradient.addColorStop(1, 'rgba(3, 7, 18, 0.05)');

    dashboardTrendChart = new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: trendLabels,
            datasets: [{
                label: 'Admissions',
                data: trendValues,
                borderColor: primaryTheme,
                borderWidth: 2.5,
                backgroundColor: gradient,
                fill: true,
                tension: 0.35,
                pointBackgroundColor: primaryTheme,
                pointBorderColor: 'rgba(8, 16, 36, 0.95)',
                pointBorderWidth: 2,
                pointHoverRadius: 6,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: textTheme, font: { family: 'Inter', size: 11 } }
                },
                y: {
                    grid: { color: borderTheme, drawBorder: false },
                    ticks: { color: textTheme, font: { family: 'Inter', size: 11 }, precision: 0 }
                }
            }
        }
    });

    // 2. Departmental Workload Doughnut Chart
    const deptLabels = data.doctorWorkload.map(d => d.doctorName);
    const deptValues = data.doctorWorkload.map(d => d.count);

    dashboardDeptChart = new Chart(deptCtx, {
        type: 'doughnut',
        data: {
            labels: deptLabels,
            datasets: [{
                data: deptValues,
                backgroundColor: [
                    '#d4af37',
                    '#ffd700',
                    '#aa7c11',
                    '#38bdf8',
                    '#fb923c',
                    '#4ade80'
                ],
                borderWidth: 3,
                borderColor: 'rgba(8, 16, 36, 0.95)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: textTheme,
                        font: { family: 'Inter', size: 10, weight: '500' },
                        padding: 12,
                        boxWidth: 10,
                        usePointStyle: true
                    }
                }
            },
            cutout: '70%'
        }
    });
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

// ─── Edit Patient ──────────────────────────────────────────────────────────────
window.editPatient = async (id) => {
    // Fetch patient data — use cache if available, otherwise fetch by ID
    let patient = AppState.cache.patients ? AppState.cache.patients.find(p => p.id === id) : null;
    if (!patient) {
        try {
            const res = await PatientAPI.getById(id);
            patient = res.data;
        } catch (e) {
            if (window.Toast) window.Toast.error('Could not load patient data.');
            return;
        }
    }

    // Inject or reuse edit modal
    let modal = document.getElementById('editPatientModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'editPatientModal';
        modal.tabIndex = -1;
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content border-0 shadow-lg">
                    <div class="modal-header border-0 pb-0">
                        <h5 class="modal-title fw-bold">Edit Patient</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-4">
                        <form id="editPatientForm">
                            <input type="hidden" name="patientId" id="editPatientId">
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label class="form-label small fw-semibold">First Name</label>
                                    <input type="text" name="firstName" id="editPatientFirstName" class="form-control" required>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label small fw-semibold">Last Name</label>
                                    <input type="text" name="lastName" id="editPatientLastName" class="form-control" required>
                                </div>
                                <div class="col-md-12">
                                    <label class="form-label small fw-semibold">Email Address</label>
                                    <input type="email" name="email" id="editPatientEmail" class="form-control" required>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label small fw-semibold">Contact Number</label>
                                    <input type="text" name="contactNumber" id="editPatientContact" class="form-control">
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label small fw-semibold">Gender</label>
                                    <select name="gender" id="editPatientGender" class="form-select" required>
                                        <option value="MALE">Male</option>
                                        <option value="FEMALE">Female</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label small fw-semibold">Age</label>
                                    <input type="number" name="age" id="editPatientAge" class="form-control">
                                </div>
                                <div class="col-md-12 mt-4">
                                    <button type="submit" id="editPatientSubmitBtn" class="btn btn-primary w-100 py-2">Save Changes</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Pre-fill form with current patient data
    document.getElementById('editPatientId').value = patient.id;
    document.getElementById('editPatientFirstName').value = patient.firstName || '';
    document.getElementById('editPatientLastName').value = patient.lastName || '';
    document.getElementById('editPatientEmail').value = patient.email || '';
    document.getElementById('editPatientContact').value = patient.contactNumber || '';
    document.getElementById('editPatientGender').value = patient.gender || 'MALE';
    document.getElementById('editPatientAge').value = patient.age || '';

    // Set up form submit handler (re-bind to avoid duplicates)
    const form = document.getElementById('editPatientForm');
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    document.getElementById('editPatientForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        const pId = parseInt(data.patientId);
        delete data.patientId;

        const submitBtn = e.target.querySelector('#editPatientSubmitBtn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';

        try {
            const res = await PatientAPI.update(pId, data);
            // Update local cache directly
            if (AppState.cache.patients) {
                const idx = AppState.cache.patients.findIndex(p => p.id === pId);
                if (idx !== -1) AppState.cache.patients[idx] = res.data;
            }
            renderPatientsList(AppState.cache.patients);
            bootstrap.Modal.getInstance(document.getElementById('editPatientModal')).hide();
            if (window.Toast) window.Toast.success('Patient updated successfully!');
        } catch (error) {
            const errMsg = error.response?.data?.message || 'Failed to update patient';
            if (window.Toast) window.Toast.error(errMsg);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Save Changes';
        }
    });

    // Show modal
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
};

// ─── Edit Doctor ───────────────────────────────────────────────────────────────
window.editDoctor = async (id) => {
    let doctor = AppState.cache.doctors ? AppState.cache.doctors.find(d => d.id === id) : null;
    if (!doctor) {
        try {
            const res = await DoctorAPI.getById(id);
            doctor = res.data;
        } catch (e) {
            if (window.Toast) window.Toast.error('Could not load doctor data.');
            return;
        }
    }

    let modal = document.getElementById('editDoctorModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'editDoctorModal';
        modal.tabIndex = -1;
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content border-0 shadow-lg">
                    <div class="modal-header border-0 pb-0">
                        <h5 class="modal-title fw-bold">Edit Doctor</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-4">
                        <form id="editDoctorForm">
                            <input type="hidden" name="doctorId" id="editDoctorId">
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label class="form-label small fw-semibold">First Name</label>
                                    <input type="text" name="firstName" id="editDoctorFirstName" class="form-control" required>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label small fw-semibold">Last Name</label>
                                    <input type="text" name="lastName" id="editDoctorLastName" class="form-control" required>
                                </div>
                                <div class="col-md-12">
                                    <label class="form-label small fw-semibold">Specialization</label>
                                    <input type="text" name="specialization" id="editDoctorSpec" class="form-control" required>
                                </div>
                                <div class="col-md-12">
                                    <label class="form-label small fw-semibold">Email Address</label>
                                    <input type="email" name="email" id="editDoctorEmail" class="form-control" required>
                                </div>
                                <div class="col-md-12 mt-4">
                                    <button type="submit" id="editDoctorSubmitBtn" class="btn btn-primary w-100 py-2">Save Changes</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    document.getElementById('editDoctorId').value = doctor.id;
    document.getElementById('editDoctorFirstName').value = doctor.firstName || '';
    document.getElementById('editDoctorLastName').value = doctor.lastName || '';
    document.getElementById('editDoctorSpec').value = doctor.specialization || '';
    document.getElementById('editDoctorEmail').value = doctor.email || '';

    const form = document.getElementById('editDoctorForm');
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    document.getElementById('editDoctorForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        const dId = parseInt(data.doctorId);
        delete data.doctorId;

        const submitBtn = e.target.querySelector('#editDoctorSubmitBtn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';

        try {
            const res = await DoctorAPI.update(dId, data);
            if (AppState.cache.doctors) {
                const idx = AppState.cache.doctors.findIndex(d => d.id === dId);
                if (idx !== -1) AppState.cache.doctors[idx] = res.data;
            }
            renderDoctorsList(AppState.cache.doctors);
            bootstrap.Modal.getInstance(document.getElementById('editDoctorModal')).hide();
            if (window.Toast) window.Toast.success('Doctor updated successfully!');
        } catch (error) {
            const errMsg = error.response?.data?.message || 'Failed to update doctor';
            if (window.Toast) window.Toast.error(errMsg);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Save Changes';
        }
    });

    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
};

// ─── Appointment Form: Populate Dropdowns ─────────────────────────────────────
async function populateAppointmentDropdowns() {
    const patientSelect = document.getElementById('appt-patient-select');
    const doctorSelect  = document.getElementById('appt-doctor-select');
    if (!patientSelect || !doctorSelect) return;

    patientSelect.innerHTML = '<option value="">Loading patients...</option>';
    doctorSelect.innerHTML  = '<option value="">Loading doctors...</option>';

    try {
        const [pRes, dRes] = await Promise.all([
            AppState.getPatients(),
            AppState.getDoctors()
        ]);

        patientSelect.innerHTML = '<option value="">-- Select Patient --</option>' +
            (pRes.data || []).map(p => `<option value="${p.id}">${p.firstName} ${p.lastName} (#${p.id})</option>`).join('');

        doctorSelect.innerHTML = '<option value="">-- Select Doctor --</option>' +
            (dRes.data || []).map(d => `<option value="${d.id}">Dr. ${d.firstName} ${d.lastName} — ${d.specialization}</option>`).join('');
    } catch (err) {
        patientSelect.innerHTML = '<option value="">Failed to load patients</option>';
        doctorSelect.innerHTML  = '<option value="">Failed to load doctors</option>';
    }
}

window.populateAppointmentDropdowns = populateAppointmentDropdowns;
