/**
 * HMS Frontend UX Polish Module
 * Implements transitions, skeleton loaders, custom GSAP toasts, and micro-interactions.
 */

// Global Toast System
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

    show(type, message) {
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
        setTimeout(dismiss, 3000);
    },

    success(message) { this.show('success', message); },
    error(message) { this.show('error', message); },
    info(message) { this.show('info', message); }
};

// Skeleton Loaders Builder
const SkeletonLoader = {
    // Renders custom, sleek table skeletons
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

    // Shimmer placeholder for Dashboard Stats
    showStats() {
        const statsIds = ['total-patients', 'total-doctors', 'total-appointments'];
        statsIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.innerHTML = `<span class="skeleton" style="width: 60px; height: 32px; border-radius: 8px;"></span>`;
            }
        });
    },

    // Shimmer cards loader in case of card view grids
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

// Micro Interactions Builder
const MicroInteractions = {
    // Binds ripple effects on button/tab clicks
    initRipples() {
        document.body.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn, .tab-btn, .chat-btn');
            if (!btn) return;

            // Maintain relative positioning for ripples
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

            // Remove previous ripple
            const existingRipple = btn.querySelector('.ripple-circle');
            if (existingRipple) {
                existingRipple.remove();
            }

            btn.appendChild(circle);

            // Cleanup when animation ends
            circle.addEventListener('animationend', () => {
                circle.remove();
            });
        });
    },

    // Animates active sidebar loads using GSAP
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

// Page Transition Manager
const PageTransitions = {
    init() {
        // Trigger fade + slide in on DOM Load
        document.addEventListener('DOMContentLoaded', () => {
            document.body.classList.add('page-loaded');
        });

        // Intercept standard click navigations
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

        // Trigger slide/fade out on browser tab/window close
        window.addEventListener('beforeunload', () => {
            document.body.classList.remove('page-loaded');
            document.body.classList.add('page-transitioning');
        });
    }
};

// Global exports
window.Toast = Toast;
window.SkeletonLoader = SkeletonLoader;
window.MicroInteractions = MicroInteractions;

// Auto-run transitions and bindings on script injection
PageTransitions.init();
document.addEventListener('DOMContentLoaded', () => {
    MicroInteractions.initRipples();
    MicroInteractions.animateSidebar();
});
