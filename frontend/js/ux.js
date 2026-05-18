/**
 * HMS Frontend UX Polish Module & Production Experience Layer
 * Implements transitions, skeletons, custom toasts, route guards, offline detection, and recovery screens.
 */

// ─── 0. Protected Route Guard ────────────────────────────────────────────────
(function() {
    const isLoginPage = window.location.pathname.endsWith('login.html');
    const isLoggedIn = localStorage.getItem('hms_jwt') !== null;
    
    if (!isLoginPage && !isLoggedIn) {
        console.warn('[Guard] Unauthorized access to protected route, redirecting to login.html');
        window.location.replace('login.html');
    }
})();

// ─── 1. Global Toast System (Enhanced with Actions) ─────────────────────────
const Toast = {
    container: null,

    init() {
        if (this.container) return;
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        this.container.style.zIndex = '2000';
        document.body.appendChild(this.container);
    },

    show(type, message, actionText = '', actionCallback = null) {
        this.init();

        const toast = document.createElement('div');
        toast.className = `custom-toast toast-type-${type} d-flex align-items-center p-3 mb-2 border-0 shadow-lg`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');

        let icon = 'fa-info-circle';
        if (type === 'success') icon = 'fa-check-circle';
        if (type === 'error') icon = 'fa-exclamation-circle';

        toast.innerHTML = `
            <div class="toast-body d-flex align-items-center gap-2">
                <i class="fas ${icon} toast-icon"></i>
                <div class="toast-message">${message}</div>
                ${actionText ? `<button type="button" class="btn-toast-action">${actionText}</button>` : ''}
            </div>
            <button type="button" class="btn-close ms-auto" aria-label="Close"></button>
        `;

        this.container.appendChild(toast);

        // Animate in using GSAP if loaded, else fallback to CSS
        if (typeof gsap !== 'undefined') {
            gsap.fromTo(toast, 
                { x: 120, opacity: 0 }, 
                { x: 0, opacity: 1, duration: 0.35, ease: 'power2.out' }
            );
        } else {
            toast.style.opacity = '1';
        }

        const closeBtn = toast.querySelector('.btn-close');
        const dismiss = () => {
            if (typeof gsap !== 'undefined') {
                gsap.to(toast, {
                    x: 120, 
                    opacity: 0, 
                    duration: 0.3, 
                    ease: 'power2.in',
                    onComplete: () => toast.remove()
                });
            } else {
                toast.remove();
            }
        };

        closeBtn.addEventListener('click', dismiss);

        // Handle CTA Action Button
        if (actionText && actionCallback) {
            const actionBtn = toast.querySelector('.btn-toast-action');
            actionBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                actionCallback();
                dismiss();
            });
        }

        setTimeout(dismiss, 4000);
    },

    success(message) { this.show('success', message); },
    error(message, actionText = '', actionCallback = null) { this.show('error', message, actionText, actionCallback); },
    info(message) { this.show('info', message); }
};

// ─── 2. Skeleton Loaders Builder ─────────────────────────────────────────────
const SkeletonLoader = {
    showTable(element, colspan, rowsCount = 5) {
        if (!element) return;
        let rowsHtml = '';
        for (let i = 0; i < rowsCount; i++) {
            rowsHtml += `
                <tr class="skeleton-table-row">
                    <td><span class="skeleton" style="width: 40px; height: 16px;"></span></td>
                    <td>
                        <div class="d-flex align-items-center gap-2">
                            <span class="skeleton skeleton-avatar"></span>
                            <span class="skeleton" style="width: 130px; height: 16px;"></span>
                        </div>
                    </td>
                    <td><span class="skeleton" style="width: 90px; height: 16px;"></span></td>
                    <td><span class="skeleton" style="width: 160px; height: 16px;"></span></td>
                    <td><span class="skeleton skeleton-badge"></span></td>
                    ${colspan >= 6 ? `<td><span class="skeleton" style="width: 70px; height: 16px;"></span></td>` : ''}
                    ${colspan >= 7 ? `<td>
                        <div class="d-flex gap-2">
                            <span class="skeleton skeleton-btn"></span>
                            <span class="skeleton skeleton-btn"></span>
                        </div>
                    </td>` : ''}
                </tr>
            `;
        }
        element.innerHTML = rowsHtml;
    },

    showStats() {
        const statsIds = ['total-patients', 'total-doctors', 'total-appointments'];
        statsIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.innerHTML = `<span class="skeleton" style="width: 60px; height: 32px; border-radius: 8px;"></span>`;
            }
        });
    },

    showCards(element, cardsCount = 4) {
        if (!element) return;
        let cardsHtml = '';
        for (let i = 0; i < cardsCount; i++) {
            cardsHtml += `
                <div class="col-md-6 col-lg-3 mb-4">
                    <div class="skeleton-card">
                        <span class="skeleton skeleton-avatar" style="width: 48px; height: 48px; border-radius: 12px;"></span>
                        <span class="skeleton" style="width: 70%; height: 18px; margin-top: 8px;"></span>
                        <span class="skeleton" style="width: 45%; height: 14px;"></span>
                    </div>
                </div>
            `;
        }
        element.innerHTML = cardsHtml;
    }
};

// ─── 3. Micro Interactions ───────────────────────────────────────────────────
const MicroInteractions = {
    initRipples() {
        document.body.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn, .tab-btn, .chat-btn, .btn-retry');
            if (!btn) return;

            if (getComputedStyle(btn).position === 'static') {
                btn.style.position = 'relative';
            }
            btn.style.overflow = 'hidden';

            const circle = document.createElement('span');
            const diameter = Math.max(btn.clientWidth, btn.clientHeight);
            const radius = diameter / 2;

            circle.style.width = circle.style.height = `${diameter}px`;
            circle.style.left = `${e.clientX - btn.getBoundingClientRect().left - radius}px`;
            circle.style.top = `${e.clientY - btn.getBoundingClientRect().top - radius}px`;
            circle.className = 'ripple-circle';

            const existingRipple = btn.querySelector('.ripple-circle');
            if (existingRipple) {
                existingRipple.remove();
            }

            btn.appendChild(circle);

            circle.addEventListener('animationend', () => {
                circle.remove();
            });
        });
    },

    animateSidebar() {
        const activeLink = document.querySelector('#sidebar .nav-link.active');
        if (activeLink && typeof gsap !== 'undefined') {
            gsap.fromTo(activeLink, 
                { x: -15, opacity: 0.7 }, 
                { x: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }
            );
        }
    }
};

// ─── 4. Page Transition Manager ──────────────────────────────────────────────
const PageTransitions = {
    init() {
        document.addEventListener('DOMContentLoaded', () => {
            document.body.classList.add('page-loaded');
        });

        document.addEventListener('click', (e) => {
            const anchor = e.target.closest('a');
            if (!anchor) return;

            const href = anchor.getAttribute('href');
            if (!href || href === '#' || href.startsWith('javascript:') || anchor.classList.contains('dropdown-toggle') || anchor.getAttribute('target') === '_blank') {
                return;
            }

            e.preventDefault();
            document.body.classList.remove('page-loaded');
            document.body.classList.add('page-transitioning');
            setTimeout(() => {
                window.location.href = href;
            }, 350);
        });

        window.addEventListener('beforeunload', () => {
            document.body.classList.remove('page-loaded');
            document.body.classList.add('page-transitioning');
        });
    }
};

// ─── 5. Network Awareness System ─────────────────────────────────────────────
const NetworkManager = {
    banner: null,

    init() {
        this.createBanner();
        window.addEventListener('online', () => this.updateStatus());
        window.addEventListener('offline', () => this.updateStatus());
        this.updateStatus();
    },

    createBanner() {
        if (document.getElementById('offline-banner')) return;
        this.banner = document.createElement('div');
        this.banner.id = 'offline-banner';
        this.banner.className = 'offline-banner';
        this.banner.innerHTML = `<i class="fas fa-exclamation-triangle"></i> You are currently offline. API requests are disabled in offline mode.`;
        document.body.appendChild(this.banner);
    },

    updateStatus() {
        if (navigator.onLine) {
            this.banner?.classList.remove('show');
            if (this.banner && this.banner.dataset.wasOffline === 'true') {
                Toast.success('Connection restored. Back online!');
                this.banner.dataset.wasOffline = 'false';
            }
        } else {
            this.banner?.classList.add('show');
            if (this.banner) {
                this.banner.dataset.wasOffline = 'true';
            }
            Toast.error('You are offline. Network operations are paused.');
        }
    }
};

// ─── 6. Server Unavailable Screen ────────────────────────────────────────────
const ServerUnavailableScreen = {
    overlay: null,
    retryCallback: null,

    create() {
        if (document.getElementById('server-unavailable-overlay')) return;
        this.overlay = document.createElement('div');
        this.overlay.id = 'server-unavailable-overlay';
        this.overlay.className = 'server-unavailable-overlay';
        this.overlay.innerHTML = `
            <div class="server-unavailable-card">
                <div class="server-unavailable-icon">
                    <i class="fas fa-server"></i>
                </div>
                <h2 class="server-unavailable-title">Server Unavailable</h2>
                <p class="server-unavailable-desc">We are having trouble connecting to our medical servers right now. Please verify your connection or click retry below.</p>
                <button type="button" class="btn btn-retry" id="btn-server-retry">
                    <i class="fas fa-sync-alt"></i> Try Again
                </button>
            </div>
        `;
        document.body.appendChild(this.overlay);

        document.getElementById('btn-server-retry').addEventListener('click', () => {
            const btn = document.getElementById('btn-server-retry');
            const icon = btn.querySelector('i');
            btn.disabled = true;
            icon.classList.add('fa-spin');
            
            if (this.retryCallback) {
                this.retryCallback().then(() => {
                    this.hide();
                }).catch(() => {
                    Toast.error('Server connection failed. Retrying...');
                }).finally(() => {
                    btn.disabled = false;
                    icon.classList.remove('fa-spin');
                });
            } else {
                window.location.reload();
            }
        });
    },

    show(retryCb) {
        this.create();
        this.retryCallback = retryCb;
        document.getElementById('server-unavailable-overlay').classList.add('show');
    },

    hide() {
        const ov = document.getElementById('server-unavailable-overlay');
        if (ov) {
            ov.classList.remove('show');
        }
    }
};

// ─── 7. Inactivity Auto-Logout Tracker ────────────────────────────────────────
const InactivityTracker = {
    timeoutId: null,
    duration: 5 * 60 * 1000, // 5 minutes in ms
    
    init() {
        if (window.location.pathname.endsWith('login.html')) return;
        this.reset();
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        events.forEach(e => {
            document.addEventListener(e, () => this.reset(), { passive: true });
        });
    },
    
    reset() {
        if (this.timeoutId) clearTimeout(this.timeoutId);
        this.timeoutId = setTimeout(() => this.logout(), this.duration);
    },
    
    logout() {
        console.warn('[InactivityTracker] User logged out due to inactivity');
        if (typeof AuthService !== 'undefined') {
            AuthService.logout('inactive');
        } else {
            localStorage.removeItem('hms_jwt');
            localStorage.removeItem('hms_user');
            window.location.href = 'login.html?reason=inactive';
        }
    }
};

// ─── 8. Global Exports & Run ─────────────────────────────────────────────────
window.Toast = Toast;
window.SkeletonLoader = SkeletonLoader;
window.MicroInteractions = MicroInteractions;
window.NetworkManager = NetworkManager;
window.ServerUnavailableScreen = ServerUnavailableScreen;

PageTransitions.init();
document.addEventListener('DOMContentLoaded', () => {
    MicroInteractions.initRipples();
    MicroInteractions.animateSidebar();
    NetworkManager.init();
    InactivityTracker.init();
});
