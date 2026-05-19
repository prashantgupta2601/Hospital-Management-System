/**
 * HMS Analytics Dashboard JS Controller
 * Implements Chart.js integration, theme adaptation, state management, skeleton loaders, and GSAP animations.
 */

let patientGrowthChart = null;
let doctorWorkloadChart = null;
let appointmentsPerDayChart = null;

document.addEventListener('DOMContentLoaded', () => {
    // Initial fetch
    initAnalytics();

    // Setup Refresh listener
    const refreshBtn = document.getElementById('refresh-analytics');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            // GSAP spin animation on refresh icon
            const icon = refreshBtn.querySelector('i');
            if (icon && typeof gsap !== 'undefined') {
                gsap.to(icon, {
                    rotation: '+=360',
                    duration: 0.8,
                    ease: 'power2.out',
                    overwrite: 'auto'
                });
            }
            // Force fetch analytics data
            loadAnalytics(true);
        });
    }

    // Theme Switch Listener to adapt charts color palette in real-time
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            // Briefly wait for html[data-theme] to mutate, then redraw charts
            setTimeout(() => {
                loadAnalytics(false);
            }, 100);
        });
    }
});

async function initAnalytics() {
    // AOS init
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            once: true
        });
    }
    loadAnalytics(false);
}

function showStatsSkeletons() {
    const ids = ['stat-patients', 'stat-doctors', 'stat-appointments', 'stat-revenue'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = `<span class="skeleton" style="width: 70px; height: 32px; border-radius: 8px;"></span>`;
        }
    });
}

async function loadAnalytics(forceFetch = false) {
    if (forceFetch) {
        showStatsSkeletons();
    }

    try {
        const response = await AppState.getAnalytics(forceFetch);
        const data = response.data;

        // Render card statistics
        updateAnalyticsStats(data.stats);

        // Render visual charts
        renderPatientGrowthChart(data.patientGrowth);
        renderDoctorWorkloadChart(data.doctorWorkload);
        renderAppointmentsPerDayChart(data.appointmentsPerDay);

        // Update last updated timestamp
        const timeEl = document.getElementById('last-updated-time');
        if (timeEl) {
            timeEl.textContent = `Last updated: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
        }

        if (forceFetch && window.Toast) {
            window.Toast.success('Analytics successfully synchronized!');
        }
    } catch (error) {
        console.error('[Analytics] Failed to fetch analytics summary:', error);
        if (window.Toast) {
            window.Toast.error('Could not load analytics. Click retry to reconnect.', 'Retry', () => loadAnalytics(true));
        }
    }
}

function updateAnalyticsStats(stats) {
    if (!stats) return;

    animateNumber('stat-patients', stats.totalPatients);
    animateNumber('stat-doctors', stats.activeDoctors);
    animateNumber('stat-appointments', stats.totalAppointments);
    
    // Format Revenue as Currency
    const revenueVal = stats.totalRevenue || 0;
    const formattedRev = `$${Number(revenueVal).toLocaleString([], { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    const revenueEl = document.getElementById('stat-revenue');
    if (revenueEl) {
        revenueEl.textContent = formattedRev;
    }
}

function animateNumber(elementId, targetValue) {
    const el = document.getElementById(elementId);
    if (!el) return;

    if (typeof gsap !== 'undefined') {
        const obj = { val: 0 };
        gsap.to(obj, {
            val: targetValue,
            duration: 0.8,
            ease: 'power2.out',
            onUpdate: () => {
                el.textContent = Math.floor(obj.val).toLocaleString();
            }
        });
    } else {
        el.textContent = Number(targetValue).toLocaleString();
    }
}

// ─── Chart.js Render Methods ──────────────────────────────────────────────────

function getThemeColors() {
    const theme = document.documentElement.getAttribute('data-theme') || 'light';
    const isDark = theme === 'dark';

    return {
        isDark,
        text: isDark ? '#94a3b8' : '#64748b',
        grid: isDark ? 'rgba(148, 163, 184, 0.08)' : 'rgba(100, 116, 139, 0.06)',
        primary: '#4361ee',
        secondary: '#a855f7',
        success: '#4ade80',
        warning: '#fb923c',
        cardBg: isDark ? '#1e293b' : '#ffffff'
    };
}

function renderPatientGrowthChart(data) {
    const ctx = document.getElementById('patientGrowthChart');
    if (!ctx) return;

    if (patientGrowthChart) {
        patientGrowthChart.destroy();
    }

    const colors = getThemeColors();
    
    // Sort and format data
    const labels = data.map(d => new Date(d.date).toLocaleDateString([], { month: 'short', day: 'numeric' }));
    const values = data.map(d => d.count);

    // Create gradient fill
    const canvasCtx = ctx.getContext('2d');
    const gradient = canvasCtx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(67, 97, 238, 0.35)');
    gradient.addColorStop(1, 'rgba(67, 97, 238, 0.0)');

    patientGrowthChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Cumulative Registrations',
                data: values,
                borderColor: colors.primary,
                borderWidth: 3,
                backgroundColor: gradient,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: colors.primary,
                pointBorderColor: colors.cardBg,
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
                    ticks: { color: colors.text, font: { family: 'Inter', size: 11 } }
                },
                y: {
                    grid: { color: colors.grid, drawBorder: false },
                    ticks: { color: colors.text, font: { family: 'Inter', size: 11 }, precision: 0 }
                }
            }
        }
    });
}

function renderDoctorWorkloadChart(data) {
    const ctx = document.getElementById('doctorWorkloadChart');
    if (!ctx) return;

    if (doctorWorkloadChart) {
        doctorWorkloadChart.destroy();
    }

    const colors = getThemeColors();

    const labels = data.map(d => d.doctorName);
    const values = data.map(d => d.count);

    doctorWorkloadChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    colors.primary,
                    colors.secondary,
                    colors.success,
                    colors.warning,
                    '#38bdf8',
                    '#ec4899',
                    '#f43f5e'
                ],
                borderWidth: colors.isDark ? 3 : 2,
                borderColor: colors.cardBg
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: colors.text,
                        font: { family: 'Inter', size: 11, weight: '500' },
                        padding: 15,
                        boxWidth: 12,
                        usePointStyle: true
                    }
                }
            },
            cutout: '65%'
        }
    });
}

function renderAppointmentsPerDayChart(data) {
    const ctx = document.getElementById('appointmentsPerDayChart');
    if (!ctx) return;

    if (appointmentsPerDayChart) {
        appointmentsPerDayChart.destroy();
    }

    const colors = getThemeColors();

    const labels = data.map(d => new Date(d.date).toLocaleDateString([], { month: 'short', day: 'numeric' }));
    const values = data.map(d => d.count);

    appointmentsPerDayChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Appointments',
                data: values,
                backgroundColor: colors.success,
                hoverBackgroundColor: colors.primary,
                borderRadius: 6,
                borderSkipped: false
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
                    ticks: { color: colors.text, font: { family: 'Inter', size: 11 } }
                },
                y: {
                    grid: { color: colors.grid, drawBorder: false },
                    ticks: { color: colors.text, font: { family: 'Inter', size: 11 }, precision: 0 }
                }
            }
        }
    });
}
