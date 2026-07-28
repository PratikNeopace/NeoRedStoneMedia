document.addEventListener('DOMContentLoaded', () => {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Intersection Observer for Framer-style scroll reveal animations
    const revealElements = document.querySelectorAll('.reveal-up');
    
    const revealOptions = {
        root: null,
        rootMargin: '0px 0px -100px 0px', // Trigger slightly before it hits the bottom
        threshold: 0.1
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: unobserve if you want it to animate only once
                observer.unobserve(entry.target); 
            }
        });
    }, revealOptions);

    revealElements.forEach(el => {
        revealObserver.observe(el);
    });

    // --- NEW: Combined Mouse Parallax and Scroll Rotation ---
    const parallaxWrap = document.getElementById("parallax-wrap");
    const floatItems = document.querySelectorAll('.float-item');
    
    if (parallaxWrap && floatItems.length > 0) {
        
        let currentMouseX = window.innerWidth / 2;
        let currentMouseY = window.innerHeight / 2;
        
        document.addEventListener("mousemove", (event) => {
            currentMouseX = event.pageX;
            currentMouseY = event.pageY;
            updateTransforms();
        });
        
        window.addEventListener('scroll', () => {
            updateTransforms();
        });
        
        function updateTransforms() {
            const scrollY = window.scrollY;
            
            // The whole group revolves around the COMMON center
            const wheelRotation = scrollY * -0.05; 
            parallaxWrap.style.transform = `translate(-50%, -50%) rotate(${wheelRotation}deg)`;
            
            // Each picture revolves on its OWN center (counter-rotation) + your exact mouse parallax math
            floatItems.forEach((shift) => {
                const position = shift.getAttribute("data-value");
                
                // EXACT math from user snippet
                const x = (window.innerWidth - currentMouseX * position) / 90;
                const y = (window.innerHeight - currentMouseY * position) / 90;

                shift.style.transform = `translateX(${x}px) translateY(${y}px) rotate(${-wheelRotation}deg)`;
            });
        }
    }

    // --- NEW: GSAP 3D Draggable Carousel for Represent Roster ---
    const dragger = document.querySelector('.dragger');
    const ring = document.querySelector('.ring');
    const imgs = document.querySelectorAll('.img');

    if (dragger && ring && imgs.length > 0 && typeof gsap !== 'undefined') {
        // Safely initialize each image instead of relying on timeline .set
        gsap.set(dragger, { opacity:0 });
        gsap.set(ring, { rotationY: 180 });
        
        // Use a much larger radius to create gaps between the images and a wider concave curve
        let radius = window.innerWidth < 768 ? 400 : 800;
        
        imgs.forEach((img, i) => {
            gsap.set(img, {
                rotateY: i * -36,
                transformOrigin: `50% 50% ${radius}px`,
                z: -radius,
                backgroundImage: 'url(./Assets/img' + ((i % 7) + 1) + '.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backfaceVisibility: 'hidden'
            });
        });

        // Now animate them in
        gsap.from('.img', {
            duration: 1.5,
            y: 200,
            opacity: 0,
            stagger: 0.1,
            ease: 'expo'
        });

        // Custom Vanilla JS drag handler to bypass Chrome's file:/// Draggable CORS issue
        let isDragging = false;
        let startX = 0;
        let currentRotY = 180; // Starting rotation

        dragger.addEventListener('pointerdown', (e) => {
            isDragging = true;
            startX = e.clientX;
            dragger.style.cursor = 'grabbing';
            // Snap the current state of rotation in case it's mid-tween
            currentRotY = gsap.getProperty(ring, 'rotationY');
        });

        window.addEventListener('pointermove', (e) => {
            if (!isDragging) return;
            
            // Calculate how far the mouse has moved
            const deltaX = e.clientX - startX;
            const targetRotY = currentRotY - deltaX;
            
            gsap.to(ring, {
              rotationY: targetRotY,
              duration: 0.2 // Smooth inertia feel
            });
        });

        window.addEventListener('pointerup', () => {
            if(isDragging) {
                isDragging = false;
                dragger.style.cursor = 'grab';
            }
        });
    }
});