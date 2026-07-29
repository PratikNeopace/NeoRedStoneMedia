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

    // --- NEW: CHTRBOX-style Curved Gallery for Represent Roster ---
    const rosterRing = document.getElementById('roster-ring');
    if (rosterRing && typeof gsap !== 'undefined') {
        const images = [
            './Assets/img1.png', './Assets/img2.png', './Assets/img3.png',
            './Assets/img4.png', './Assets/img5.png', './Assets/img6.png',
            './Assets/img7.png', './Assets/portfolio1.png', './Assets/portfolio2.png',
            './Assets/portfolio3.png', './Assets/portfolio4.png', './Assets/portfolio5.png'
        ];
        
        const numCards = images.length;
        let radius = 2500;
        let zCenter = 1000;
        let maxAngle = 45; // Degrees from center to edge (total 90 spread)
        const cards = [];
        
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
            radius = isMobile ? 800 : 2000;
            zCenter = isMobile ? 0 : 800;
            maxAngle = isMobile ? 55 : 40;
            
            cards.forEach((card, i) => {
                const progress = numCards > 1 ? i / (numCards - 1) : 0.5;
                const theta = -maxAngle + (progress * 2 * maxAngle);
                const thetaRad = theta * (Math.PI / 180);
                
                // Concave curve: Center is far, sides curve forward towards user
                const x = radius * Math.sin(thetaRad);
                const z = zCenter - radius * Math.cos(thetaRad);
                const rotateY = -theta;
                
                card.dataset.x = x;
                card.dataset.z = z;
                card.dataset.rotateY = rotateY;
                
                // Initial hidden state for entrance animation
                gsap.set(card, {
                    x: x,
                    y: 100,
                    z: z - 500, // pushed further back
                    rotationY: rotateY + (Math.random() * 20 - 10), // slight random twist
                    opacity: 0,
                    transformStyle: "preserve-3d",
                    force3D: true
                });
            });
        }
        
        layoutCards();
        window.addEventListener('resize', layoutCards);

        // Entrance Animation
        ScrollTrigger.create({
            trigger: ".roster-wrapper",
            start: "top 70%",
            onEnter: () => {
                cards.forEach((card, i) => {
                    gsap.to(card, {
                        duration: 1.5,
                        x: parseFloat(card.dataset.x),
                        y: 0,
                        z: parseFloat(card.dataset.z),
                        rotationY: parseFloat(card.dataset.rotateY),
                        opacity: 1,
                        ease: "power4.out",
                        delay: i * 0.05
                    });
                });
            },
            once: true
        });

        // Mouse Interaction & Ambient Motion
        let mouseX = 0;
        let mouseY = 0;
        let targetMouseX = 0;
        let targetMouseY = 0;
        let time = 0;

        const rosterStage = document.querySelector('.roster .stage');
        if (rosterStage) {
            rosterStage.addEventListener('mousemove', (e) => {
                const rect = rosterStage.getBoundingClientRect();
                targetMouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                targetMouseY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
            });

            rosterStage.addEventListener('mouseleave', () => {
                targetMouseX = 0;
                targetMouseY = 0;
            });
        }

        // Use quickSetter for performance
        const setRotY = gsap.quickSetter(rosterRing, "rotationY", "deg");
        const setRotX = gsap.quickSetter(rosterRing, "rotationX", "deg");
        const setX = gsap.quickSetter(rosterRing, "x", "px");
        const setY = gsap.quickSetter(rosterRing, "y", "px");

        function renderRoster() {
            time += 0.005;
            
            // Lerp mouse for springy feel
            mouseX += (targetMouseX - mouseX) * 0.05;
            mouseY += (targetMouseY - mouseY) * 0.05;
            
            // Apply restrained motion
            setRotY(mouseX * 4);
            setRotX(-mouseY * 4);
            setX(mouseX * 15);
            
            // Ambient breathing + mouse Y translation
            setY(mouseY * 15 + Math.sin(time) * 10);
            
            requestAnimationFrame(renderRoster);
        }
        renderRoster();
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