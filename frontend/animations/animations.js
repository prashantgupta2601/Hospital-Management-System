/**
 * Core Animation Module
 * Contains reusable animation logic for GSAP and AOS across all pages.
 */

const AnimationManager = {
    init() {
        this.initAOS();
        this.initGsapHover();
        this.initModals();
        this.initThreeJs();
        this.initAppointmentFlow();
    },

    initAOS() {
        if (typeof AOS !== 'undefined') {
            AOS.init({
                duration: 800,
                easing: 'ease-in-out',
                once: true,
                offset: 50
            });
        }
    },

    initGsapHover() {
        if (typeof gsap === 'undefined') return;
        
        const cards = document.querySelectorAll('.gsap-card');
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => gsap.to(card, { y: -5, duration: 0.3, ease: 'power1.out' }));
            card.addEventListener('mouseleave', () => gsap.to(card, { y: 0, duration: 0.3, ease: 'power1.out' }));
        });

        const buttons = document.querySelectorAll('.gsap-hover');
        buttons.forEach(btn => {
            btn.addEventListener('mouseenter', () => gsap.to(btn, { scale: 1.05, duration: 0.2, ease: 'power1.out' }));
            btn.addEventListener('mouseleave', () => gsap.to(btn, { scale: 1, duration: 0.2, ease: 'power1.out' }));
        });
    },

    initModals() {
        if (typeof gsap === 'undefined') return;
        // Listen to Bootstrap Modal events
        document.addEventListener('show.bs.modal', function (event) {
            const modalContent = event.target.querySelector('.modal-content');
            if (modalContent) {
                gsap.fromTo(modalContent, 
                    { scale: 0.8, opacity: 0 }, 
                    { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.2)" }
                );
            }
        });
    },

    initThreeJs() {
        const container = document.getElementById('three-heart-container');
        if (container && typeof THREE !== 'undefined') {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.renderThreeJsHeart(container);
                        observer.unobserve(container);
                    }
                });
            }, { threshold: 0.1 });
            observer.observe(container);
        }
    },

    renderThreeJsHeart(container) {
        // Prevent double initialization
        if (container.dataset.initialized) return;
        container.dataset.initialized = 'true';

        const width = container.clientWidth;
        const height = container.clientHeight;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
        camera.position.z = 45;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(width, height);
        container.appendChild(renderer.domElement);

        const x = 0, y = 0;
        const heartShape = new THREE.Shape();
        heartShape.moveTo( x + 5, y + 5 );
        heartShape.bezierCurveTo( x + 5, y + 5, x + 4, y, x, y );
        heartShape.bezierCurveTo( x - 6, y, x - 6, y + 7, x - 6, y + 7 );
        heartShape.bezierCurveTo( x - 6, y + 11, x - 3, y + 15.4, x + 5, y + 19 );
        heartShape.bezierCurveTo( x + 12, y + 15.4, x + 16, y + 11, x + 16, y + 7 );
        heartShape.bezierCurveTo( x + 16, y + 7, x + 16, y, x + 10, y );
        heartShape.bezierCurveTo( x + 7, y, x + 5, y + 5, x + 5, y + 5 );

        const extrudeSettings = { depth: 2, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 };
        const geometry = new THREE.ExtrudeGeometry( heartShape, extrudeSettings );
        
        geometry.computeBoundingBox();
        const centerOffset = -0.5 * ( geometry.boundingBox.max.x - geometry.boundingBox.min.x );
        const centerYOffset = -0.5 * ( geometry.boundingBox.max.y - geometry.boundingBox.min.y );
        geometry.translate( centerOffset, centerYOffset, 0 );
        geometry.rotateZ(Math.PI);

        const material = new THREE.MeshPhongMaterial({ color: 0xf72585, shininess: 100 });
        const heartMesh = new THREE.Mesh( geometry, material );
        scene.add( heartMesh );

        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(0, 1, 1).normalize();
        scene.add(light);
        scene.add(new THREE.AmbientLight(0x404040)); 

        function animate() {
            requestAnimationFrame(animate);
            heartMesh.rotation.y += 0.02;
            renderer.render(scene, camera);
        }
        animate();
    },

    initAppointmentFlow() {
        if (typeof gsap === 'undefined') return;
        const nextBtn = document.getElementById('btn-next-step');
        
        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const step1 = document.getElementById('appointment-step-1');
                const step2 = document.getElementById('appointment-step-2');
                
                // Timeline for smooth flow
                const tl = gsap.timeline();
                tl.to(step1, { x: -50, opacity: 0, duration: 0.3, onComplete: () => {
                    step1.style.display = 'none';
                    step2.style.display = 'block';
                }})
                .fromTo(step2, { x: 50, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4 });
            });
        }
    },
    
    // Globally accessible method for showing success message
    showAppointmentSuccess() {
        const step2 = document.getElementById('appointment-step-2');
        const success = document.getElementById('appointment-success');
        if(!step2 || !success || typeof gsap === 'undefined') return;
        
        const tl = gsap.timeline();
        tl.to(step2, { scale: 0.9, opacity: 0, duration: 0.3, onComplete: () => {
            step2.style.display = 'none';
            success.style.display = 'block';
        }})
        .fromTo(success, { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.5)" });
    }
};

// Expose to window for external scripts if necessary
window.AnimationManager = AnimationManager;

document.addEventListener('DOMContentLoaded', () => {
    AnimationManager.init();
});
