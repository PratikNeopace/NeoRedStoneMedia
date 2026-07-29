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

    // --- NEW: Premium Cinematic Floating Images (Single Render Loop) ---
    const parallaxWrap = document.getElementById("parallax-wrap");
    const floatItems = document.querySelectorAll('.float-item');
    
    if (parallaxWrap && floatItems.length > 0 && typeof gsap !== 'undefined') {
        
        // Depth and Base Angle Configurations
        const layers = [
            { depth: 1.0, angle: -12 },  // img1 (foreground)
            { depth: 0.3, angle: 7 },    // img2 (background)
            { depth: 0.6, angle: -5 },   // img3 (midground)
            { depth: 1.0, angle: 10 },   // img4 (foreground)
            { depth: 0.3, angle: -8 },   // img5 (background)
            { depth: 0.6, angle: 4 },    // img6 (midground)
            { depth: 1.0, angle: -3 }    // img7 (foreground)
        ];

        // Virtual state for every card
        const cards = Array.from(floatItems).map((item, index) => {
            return {
                el: item.querySelector('.img-wrapper'),
                img: item.querySelector('img'),
                depth: layers[index] ? layers[index].depth : 0.5,
                baseRotZ: layers[index] ? layers[index].angle : 0,
                
                // Virtual animated properties
                entranceProgress: 0,
                hoverProgress: 0,
                
                // Float variables
                phaseX: Math.random() * Math.PI * 2,
                phaseY: Math.random() * Math.PI * 2,
                speed: 0.0005 + Math.random() * 0.0005
            };
        });

        // Trigger entrance animations virtually
        cards.forEach((card, index) => {
            gsap.to(card, {
                entranceProgress: 1,
                duration: 1.5,
                ease: "elastic.out(1, 0.75)",
                delay: index * 0.1
            });

            // Setup virtual hover events
            card.el.addEventListener('mouseenter', () => {
                card.el.parentNode.style.zIndex = "10";
                gsap.to(card, { hoverProgress: 1, duration: 0.4, ease: "power2.out" });
                gsap.to(card.img, { boxShadow: "0 30px 70px rgba(0,0,0,0.24)", duration: 0.4 });
            });

            card.el.addEventListener('mouseleave', () => {
                card.el.parentNode.style.zIndex = "1";
                gsap.to(card, { hoverProgress: 0, duration: 0.4, ease: "power2.out" });
                gsap.to(card.img, { boxShadow: "0 18px 45px rgba(0,0,0,0.16)", duration: 0.4 });
            });
        });

        const isMobile = window.innerWidth <= 992;
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        let targetMouseX = 0;
        let targetMouseY = 0;
        let currentMouseX = 0;
        let currentMouseY = 0;

        // Only track mouse if not on mobile, and ONLY over the hero container
        if (!isMobile) {
            parallaxWrap.addEventListener("mousemove", (event) => {
                const rect = parallaxWrap.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                
                // Normalize from -1 to 1 based on hero center
                targetMouseX = (event.clientX - centerX) / (rect.width / 2);
                targetMouseY = (event.clientY - centerY) / (rect.height / 2);
                
                // Clamp to -1 -> 1
                targetMouseX = Math.max(-1, Math.min(1, targetMouseX));
                targetMouseY = Math.max(-1, Math.min(1, targetMouseY));
            });

            parallaxWrap.addEventListener("mouseleave", () => {
                targetMouseX = 0;
                targetMouseY = 0;
            });
        }

        // Master Render Loop
        function render(time) {
            // Lerp the global mouse vector for heavy spring physics
            currentMouseX += (targetMouseX - currentMouseX) * 0.08;
            currentMouseY += (targetMouseY - currentMouseY) * 0.08;

            cards.forEach(card => {
                // 1. Calculate Ambient Float
                let floatX = 0;
                let floatY = 0;
                if (!prefersReducedMotion) {
                    floatX = Math.sin(time * card.speed + card.phaseX) * 4 * card.depth;
                    floatY = Math.sin(time * card.speed + card.phaseY) * 4 * card.depth;
                }

                // 2. Calculate Mouse Parallax & Tilt
                const parallaxX = currentMouseX * 10 * card.depth;
                const parallaxY = currentMouseY * 10 * card.depth;
                
                // Tilt rotation (Max 4deg)
                const tiltX = currentMouseY * -4 * card.depth;
                const tiltY = currentMouseX * 4 * card.depth;

                // 3. Calculate Hover Offset
                const scale = 1 + (0.05 * card.hoverProgress);
                const z = 40 * card.hoverProgress;
                // Add a slight hover lift
                const hoverY = -10 * card.hoverProgress;

                // 4. Entrance Calculation (Slide & Fade)
                const entranceY = 80 * (1 - card.entranceProgress);
                const entranceScale = 0.8 + (0.2 * card.entranceProgress);
                
                // Base rotation interpolates from -15deg offset to original baseRotZ
                const currentRotZ = card.baseRotZ - (15 * (1 - card.entranceProgress));

                // 5. Apply Final Transform securely via GSAP set
                // Final Transform = Base + Float + Parallax + Hover + Entrance
                gsap.set(card.el, {
                    x: floatX + parallaxX,
                    y: floatY + parallaxY + entranceY + hoverY,
                    z: z,
                    rotationX: tiltX,
                    rotationY: tiltY,
                    rotationZ: currentRotZ, // Permanent Base Rotation
                    scale: scale * entranceScale,
                    opacity: card.entranceProgress
                });
            });

            requestAnimationFrame(render);
        }

        // Start render loop
        requestAnimationFrame(render);
    }

    // --- NEW: CHTRBOX-style Concave Curved Gallery with Dragging ---
    const rosterRing = document.getElementById('roster-ring');
    const dragger = document.querySelector('.dragger');
    
    if (rosterRing && typeof gsap !== 'undefined') {
        const images = [
            './Assets/img1.png', './Assets/img2.png', './Assets/img3.png',
            './Assets/img4.png', './Assets/img5.png', './Assets/img6.png',
            './Assets/img7.png', './Assets/portfolio1.png', './Assets/portfolio2.png',
            './Assets/portfolio3.png', './Assets/portfolio4.png', './Assets/portfolio5.png'
        ];
        
        const numCards = images.length;
        let radius = 1800;
        let anglePerCard = 8.3;
        const cards = [];
        
        if(dragger) gsap.set(dragger, { opacity:0 });
        
        // Generate cards
        images.forEach((src) => {
            const img = document.createElement('div');
            img.className = 'img';
            img.style.backgroundImage = `url(${src})`;
            rosterRing.appendChild(img);
            cards.push(img);
        });

        function layoutCards() {
            const isMobile = window.innerWidth < 768;
            radius = isMobile ? 1000 : 1800;
            // 260px width on a 1800px radius = exactly 8.3 degrees of arc.
            anglePerCard = isMobile ? 14.9 : 8.3; // Zero spacing calculation
            
            // Center the gallery
            const centerIndex = (numCards - 1) / 2;
            
            cards.forEach((card, i) => {
                const angle = (i - centerIndex) * anglePerCard;
                
                // Concave cylinder: Pivot is AT the camera (Z = +radius), card is pushed AWAY (Z = -radius)
                gsap.set(card, {
                    transformOrigin: `50% 50% ${radius}px`,
                    rotationY: -angle, // Invert angle for concave
                    z: -radius,
                    y: 150,
                    opacity: 0,
                    scale: 0.8
                });
            });
            
            // Pull the ring forward so the center card is visible at Z=0
            gsap.set(rosterRing, { z: radius, rotationY: 0, rotationX: 0, x: 0, y: 0 });
        }
        
        layoutCards();
        window.addEventListener('resize', layoutCards);

        // Entrance Animation
        ScrollTrigger.create({
            trigger: ".roster-wrapper",
            start: "top 70%",
            onEnter: () => {
                gsap.to(cards, {
                    duration: 1.2,
                    y: 0,
                    opacity: 1,
                    scale: 1,
                    ease: "power3.out",
                    stagger: 0.05
                });
            },
            once: true
        });

        // Mouse Drag Interaction ("Scrolling with mouse")
        let isDragging = false;
        let startX = 0;
        let currentRotY = 0; 

        // Use the dragger element if it exists, otherwise use the stage
        const dragTarget = dragger || document.querySelector('.roster .stage');
        
        if (dragTarget) {
            dragTarget.addEventListener('pointerdown', (e) => {
                isDragging = true;
                startX = e.clientX;
                dragTarget.style.cursor = 'grabbing';
                currentRotY = gsap.getProperty(rosterRing, 'rotationY');
            });

            window.addEventListener('pointermove', (e) => {
                if (!isDragging) return;
                // Calculate drag distance (multiplier adjusts speed)
                const deltaX = (e.clientX - startX) * 0.2;
                const targetRotY = currentRotY - deltaX;
                
                gsap.to(rosterRing, {
                  rotationY: targetRotY,
                  duration: 0.3, 
                  ease: "power2.out"
                });
            });

            window.addEventListener('pointerup', () => {
                if(isDragging) {
                    isDragging = false;
                    dragTarget.style.cursor = 'grab';
                }
            });
            
            // Optional: Mouse wheel scrolling to rotate
            dragTarget.addEventListener('wheel', (e) => {
                // Only rotate if scrolling horizontally, or fallback to vertical
                const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
                const currentRotY = gsap.getProperty(rosterRing, 'rotationY');
                gsap.to(rosterRing, {
                  rotationY: currentRotY - delta * 0.1,
                  duration: 0.3,
                  ease: "power2.out"
                });
            }, { passive: true });
        }
    }

    // --- NEW: AJAX Form Submission (FormSubmit) ---
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();
            
            const submitBtn = contactForm.querySelector('.btn-submit');
            const originalBtnText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.style.pointerEvents = 'none';

            fetch(contactForm.action, {
                method: 'POST',
                body: new FormData(contactForm),
                headers: {
                    'Accept': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success || data.success === 'true') {
                    alert('Message sent successfully! We will get back to you soon.');
                    contactForm.reset();
                } else {
                    alert('There was an issue sending your message. Please try again.');
                }
            })
            .catch(error => {
                console.error('Mail Error:', error);
                alert('There was an issue sending your message. Please try again.');
            })
            .finally(() => {
                submitBtn.textContent = originalBtnText;
                submitBtn.style.pointerEvents = 'auto';
            });
        });
    }
});