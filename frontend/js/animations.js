document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize AOS
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-in-out',
            once: true,
            offset: 50
        });
    }

    // 2. GSAP Micro-interactions
    if (typeof gsap !== 'undefined') {
        const cards = document.querySelectorAll('.gsap-card');
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                gsap.to(card, { y: -5, duration: 0.3, ease: 'power1.out' });
            });
            card.addEventListener('mouseleave', () => {
                gsap.to(card, { y: 0, duration: 0.3, ease: 'power1.out' });
            });
        });

        const buttons = document.querySelectorAll('.gsap-hover');
        buttons.forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                gsap.to(btn, { scale: 1.05, duration: 0.2, ease: 'power1.out' });
            });
            btn.addEventListener('mouseleave', () => {
                gsap.to(btn, { scale: 1, duration: 0.2, ease: 'power1.out' });
            });
        });
    }

    // 3. Three.js 3D Rotating Heart (Lazy Loaded)
    const container = document.getElementById('three-heart-container');
    if (container && typeof THREE !== 'undefined') {
        // Use IntersectionObserver for lazy loading Three.js
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    initThreeJsHeart(container);
                    observer.unobserve(container);
                }
            });
        }, { threshold: 0.1 });
        
        observer.observe(container);
    }
});

function initThreeJsHeart(container) {
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    
    // Transparent background
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.z = 45;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // Heart Shape
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
    
    // Center geometry
    geometry.computeBoundingBox();
    const centerOffset = -0.5 * ( geometry.boundingBox.max.x - geometry.boundingBox.min.x );
    const centerYOffset = -0.5 * ( geometry.boundingBox.max.y - geometry.boundingBox.min.y );
    geometry.translate( centerOffset, centerYOffset, 0 );
    
    // Rotate 180 degrees because shape is drawn upside down
    geometry.rotateZ(Math.PI);

    const material = new THREE.MeshPhongMaterial({ color: 0xf72585, shininess: 100 });
    const heartMesh = new THREE.Mesh( geometry, material );
    scene.add( heartMesh );

    // Lighting
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 1, 1).normalize();
    scene.add(light);
    
    const ambientLight = new THREE.AmbientLight(0x404040); 
    scene.add(ambientLight);

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);
        heartMesh.rotation.y += 0.02;
        renderer.render(scene, camera);
    }
    animate();
}
