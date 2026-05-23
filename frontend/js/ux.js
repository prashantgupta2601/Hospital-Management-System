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
    LuxuryAtmosphere.init();
});

// ─── 9. VINTAGE IMPERIAL ATMOSPHERE LAYER ───
const LuxuryAtmosphere = {
    particles: [],
    trail: [],
    maxParticles: 45,
    lastMouseX: window.innerWidth / 2,
    lastMouseY: window.innerHeight / 2,
    mouseX: window.innerWidth / 2,
    mouseY: window.innerHeight / 2,

    init() {
        const isLoginPage = window.location.pathname.endsWith('login.html');
        const isLandingPage = window.location.pathname.endsWith('pg-care-landing.html');
        if (isLoginPage || isLandingPage) {
            console.log('[LuxuryAtmosphere] Bespoke login/landing detected, skipping global atmosphere injection.');
            return;
        }

        this.injectHTML();
        this.initCanvas();
        this.initParallax();
        this.initCursorTrail();
    },

    injectHTML() {
        // 1. Vignette framing overlay
        const vignette = document.createElement('div');
        vignette.className = 'vignette';
        vignette.style.position = 'fixed';
        vignette.style.top = '0';
        vignette.style.left = '0';
        vignette.style.width = '100%';
        vignette.style.height = '100%';
        vignette.style.background = 'radial-gradient(circle, transparent 35%, rgba(2, 4, 10, 0.95) 100%)';
        vignette.style.pointerEvents = 'none';
        vignette.style.zIndex = '2';
        document.body.insertBefore(vignette, document.body.firstChild);

        // 2. Atmospheric structures container
        const isSubPage = window.location.pathname.includes('/pages/');
        const hospitalImg = isSubPage ? '../assets/luxury_hospital.png' : 'assets/luxury_hospital.png';

        const atmosphere = document.createElement('div');
        atmosphere.className = 'atmospheric-container';
        atmosphere.style.position = 'fixed';
        atmosphere.style.top = '0';
        atmosphere.style.left = '0';
        atmosphere.style.width = '100%';
        atmosphere.style.height = '100%';
        atmosphere.style.pointerEvents = 'none';
        atmosphere.style.zIndex = '1';
        atmosphere.style.overflow = 'hidden';

        atmosphere.innerHTML = `
            <div class="ambient-orb orb-gold" style="position: absolute; border-radius: 50%; filter: blur(140px); opacity: 0.12; pointer-events: none; width: 600px; height: 600px; background: radial-gradient(circle, #d4af37, transparent 70%); top: -150px; left: -150px; transition: transform 0.2s cubic-bezier(0.25, 1, 0.5, 1);"></div>
            <div class="ambient-orb orb-blue" style="position: absolute; border-radius: 50%; filter: blur(140px); opacity: 0.12; pointer-events: none; width: 700px; height: 700px; background: radial-gradient(circle, #0e1e38, #1e3a8a 60%, transparent 100%); top: 20%; right: -100px; transition: transform 0.2s cubic-bezier(0.25, 1, 0.5, 1);"></div>
            <div class="light-streak" style="position: absolute; top: 0; left: -150%; width: 120%; height: 100%; background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.03) 30%, rgba(255, 255, 255, 0.08) 50%, rgba(212, 175, 55, 0.03) 70%, transparent); transform: skewX(-30deg); animation: sweep 16s ease-in-out infinite; pointer-events: none; z-index: 2;"></div>
            <div class="light-streak-reverse" style="position: absolute; top: 0; right: -150%; width: 120%; height: 100%; background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.02) 30%, rgba(255, 255, 255, 0.06) 50%, rgba(59, 130, 246, 0.02) 70%, transparent); transform: skewX(30deg); animation: sweep-reverse 20s ease-in-out infinite; pointer-events: none; z-index: 2; animation-delay: 4s;"></div>
            
            <div class="parallax-hospital" style="position: absolute; left: -5%; top: 15%; width: 45%; height: 70%; opacity: 0.14; background-image: url('${hospitalImg}'); background-size: contain; background-position: left center; background-repeat: no-repeat; filter: blur(1.5px) brightness(0.6) contrast(1.1); pointer-events: none; transition: transform 0.2s cubic-bezier(0.25, 1, 0.5, 1);"></div>
            
            <div class="parallax-pattern" style="position: absolute; right: -2%; top: 20%; width: 40%; height: 60%; opacity: 0.06; background-image: url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60' width='30' height='30'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45v-30L30 0zm0 4.15L7.6 17.07v25.86L30 55.85l22.4-12.92V17.07L30 4.15z' fill='%23d4af37' fill-opacity='0.5'/%3E%3C/svg%3E&quot;); background-size: 30px 30px; mask-image: radial-gradient(circle at center, black 30%, transparent 70%); -webkit-mask-image: radial-gradient(circle at center, black 30%, transparent 70%); pointer-events: none; transition: transform 0.2s cubic-bezier(0.25, 1, 0.5, 1);"></div>
        `;
        document.body.insertBefore(atmosphere, document.body.firstChild);
    },

    initCanvas() {
        const canvas = document.createElement('canvas');
        canvas.id = 'luxury-particles-canvas';
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '1';
        document.body.insertBefore(canvas, document.body.firstChild);

        const ctx = canvas.getContext('2d');
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        window.addEventListener('resize', () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        });

        class GoldDust {
            constructor() {
                this.reset();
                this.y = Math.random() * height;
            }
            reset() {
                this.x = Math.random() * width;
                this.y = height + 10;
                this.size = Math.random() * 1.5 + 0.5;
                this.speedY = Math.random() * 0.25 + 0.08;
                this.speedX = Math.random() * 0.1 - 0.05;
                this.alpha = Math.random() * 0.4 + 0.15;
                this.angle = Math.random() * Math.PI * 2;
                this.waveSpeed = Math.random() * 0.01 + 0.005;
            }
            update() {
                this.y -= this.speedY;
                this.angle += this.waveSpeed;
                this.x += Math.sin(this.angle) * 0.15 + this.speedX;
                if (this.y < -10 || this.x < -10 || this.x > width + 10) {
                    this.reset();
                }
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(212, 175, 55, ${this.alpha})`;
                ctx.shadowColor = 'rgba(212, 175, 55, 0.4)';
                ctx.shadowBlur = this.size * 3;
                ctx.fill();
            }
        }

        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push(new GoldDust());
        }

        const loop = () => {
            ctx.clearRect(0, 0, width, height);
            for (let p of this.particles) {
                p.update();
                p.draw();
            }
            
            // Draw cursor trail as sparks if enabled
            if (this.trail.length > 0) {
                for (let i = this.trail.length - 1; i >= 0; i--) {
                    const t = this.trail[i];
                    t.x += t.vx;
                    t.y += t.vy;
                    t.alpha -= t.decay;
                    if (t.alpha <= 0) {
                        this.trail.splice(i, 1);
                    } else {
                        ctx.beginPath();
                        ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
                        ctx.fillStyle = `rgba(243, 229, 171, ${t.alpha})`;
                        ctx.shadowColor = 'rgba(212, 175, 55, 0.8)';
                        ctx.shadowBlur = t.size * 4;
                        ctx.fill();
                    }
                }
            }

            requestAnimationFrame(loop);
        };
        loop();
    },

    initParallax() {
        window.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;

            const xOffset = (window.innerWidth / 2 - this.mouseX) / 32;
            const yOffset = (window.innerHeight / 2 - this.mouseY) / 32;

            const orbs = document.querySelectorAll('.ambient-orb');
            orbs.forEach((orb, i) => {
                const direction = i === 0 ? 0.3 : -0.3;
                orb.style.transform = `translate3d(${xOffset * direction}px, ${yOffset * direction}px, 0)`;
            });

            const hospital = document.querySelector('.parallax-hospital');
            if (hospital) {
                hospital.style.transform = `translate3d(${xOffset * 0.4}px, ${yOffset * 0.4}px, 0)`;
            }

            const pattern = document.querySelector('.parallax-pattern');
            if (pattern) {
                pattern.style.transform = `translate3d(${xOffset * -0.5}px, ${yOffset * -0.5}px, 0)`;
            }
        });
    },

    initCursorTrail() {
        document.addEventListener('mousemove', (e) => {
            const dist = Math.hypot(e.clientX - this.lastMouseX, e.clientY - this.lastMouseY);
            if (dist > 4) {
                for (let i = 0; i < 2; i++) {
                    this.trail.push({
                        x: e.clientX + (Math.random() * 6 - 3),
                        y: e.clientY + (Math.random() * 6 - 3),
                        size: Math.random() * 2.5 + 0.8,
                        alpha: 1.0,
                        decay: Math.random() * 0.025 + 0.015,
                        vx: Math.random() * 0.6 - 0.3,
                        vy: Math.random() * 0.6 - 0.3
                    });
                }
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            }
        });
    }
};
