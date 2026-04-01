/* ============================================================
   Pro Enterprise AI — Main JS
   Loading screen, Nav, Clock, GSAP scroll animations
   ============================================================ */
(function () {
    'use strict';

    /* ==========================================================
       1. LOADING SCREEN — 0→100 counter + SVG circle progress
       ========================================================== */
    const loadingScreen = document.getElementById('loadingScreen');
    const loadingCounter = document.getElementById('loadingCounter');
    const progressCircle = document.querySelector('.loading-circle-progress');
    const CIRCUMFERENCE = 2 * Math.PI * 90; // r=90

    let loadCount = 0;
    const LOAD_DURATION = 2200; // ms
    const LOAD_INTERVAL = LOAD_DURATION / 100;

    function updateLoading() {
        if (loadCount >= 100) {
            // Check if Three.js is ready (or timeout)
            finishLoading();
            return;
        }
        loadCount++;
        loadingCounter.textContent = loadCount;
        const offset = CIRCUMFERENCE - (loadCount / 100) * CIRCUMFERENCE;
        progressCircle.style.strokeDashoffset = offset;
        setTimeout(updateLoading, LOAD_INTERVAL);
    }

    function finishLoading() {
        loadingCounter.textContent = '100';
        progressCircle.style.strokeDashoffset = '0';
        setTimeout(function () {
            loadingScreen.classList.add('done');
            document.body.style.overflow = '';
            // Reveal hero after loading fade-out
            if (typeof window.__revealHero === 'function') {
                window.__revealHero();
            }
            setTimeout(function () {
                loadingScreen.style.display = 'none';
            }, 900);
        }, 400);
    }

    // Block scroll during loading
    document.body.style.overflow = 'hidden';
    updateLoading();

    /* ==========================================================
       2. HEADER — scroll show/hide + blur background
       ========================================================== */
    const header = document.getElementById('siteHeader');
    let lastScrollY = 0;
    let headerHidden = false;

    function handleHeaderScroll() {
        const scrollY = window.pageYOffset;
        // Add blur bg after 50px
        if (scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        // Hide on scroll down, show on scroll up
        if (scrollY > lastScrollY && scrollY > 200 && !headerHidden) {
            header.classList.add('hidden');
            headerHidden = true;
        } else if (scrollY < lastScrollY && headerHidden) {
            header.classList.remove('hidden');
            headerHidden = false;
        }
        lastScrollY = scrollY;
    }
    window.addEventListener('scroll', handleHeaderScroll, { passive: true });

    /* ==========================================================
       3. LIVE CLOCK (KST)
       ========================================================== */
    const clockEl = document.getElementById('headerClock');
    function updateClock() {
        const now = new Date();
        const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000) + (now.getTimezoneOffset() * 60 * 1000));
        let h = kst.getHours();
        const m = String(kst.getMinutes()).padStart(2, '0');
        const s = String(kst.getSeconds()).padStart(2, '0');
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        clockEl.textContent = 'KST ' + String(h).padStart(2, '0') + ':' + m + ':' + s + ' ' + ampm;
    }
    updateClock();
    setInterval(updateClock, 1000);

    /* ==========================================================
       4. GSAP SCROLL ANIMATIONS
       ========================================================== */
    let gsapRetries = 0;
    function waitForGSAP() {
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            initGSAP();
        } else if (gsapRetries++ < 80) {
            setTimeout(waitForGSAP, 100);
        }
    }
    waitForGSAP();

    function initGSAP() {
        gsap.registerPlugin(ScrollTrigger);

        // --- Section titles: zoom in ---
        gsap.utils.toArray('.section-title').forEach(function (title) {
            gsap.fromTo(title,
                { opacity: 0, scale: 0.85 },
                {
                    opacity: 1, scale: 1, duration: 1,
                    scrollTrigger: {
                        trigger: title,
                        start: 'top 85%',
                        end: 'top 40%',
                        scrub: 1
                    }
                }
            );
        });

        // --- Section texts: fade up ---
        gsap.utils.toArray('.section-text, .section-subtitle').forEach(function (el) {
            gsap.fromTo(el,
                { opacity: 0, y: 30 },
                {
                    opacity: 1, y: 0, duration: 0.8,
                    scrollTrigger: {
                        trigger: el,
                        start: 'top 90%',
                        toggleActions: 'play none none reverse'
                    }
                }
            );
        });

        // --- Hero title entrance (triggered after loading completes) ---
        // Set initial hidden state
        gsap.set('.hero-title', { opacity: 0, y: 40 });
        gsap.set('.hero-cta', { opacity: 0, y: 20 });
        gsap.set('.hero-aside', { opacity: 0, x: -30 });

        // Will be triggered by window.__revealHero()
        window.__revealHero = function () {
            gsap.to('.hero-title', { opacity: 1, y: 0, duration: 1.2, delay: 0.3, ease: 'power3.out' });
            gsap.to('.hero-cta', { opacity: 1, y: 0, duration: 1, delay: 0.7, ease: 'power3.out' });
            gsap.to('.hero-aside', { opacity: 1, x: 0, duration: 1, delay: 0.9, ease: 'power3.out' });
        };

        // --- Build cards: stagger ---
        gsap.utils.toArray('.build-card').forEach(function (card, i) {
            gsap.fromTo(card,
                { opacity: 0, y: 50 },
                {
                    opacity: 1, y: 0, duration: 0.7,
                    scrollTrigger: {
                        trigger: card,
                        start: 'top 90%',
                        toggleActions: 'play none none reverse'
                    },
                    delay: i % 2 * 0.15
                }
            );
        });

        // --- Why cards: stagger slide up ---
        gsap.utils.toArray('.why-card').forEach(function (card, i) {
            gsap.fromTo(card,
                { opacity: 0, y: 60, scale: 0.96 },
                {
                    opacity: 1, y: 0, scale: 1, duration: 0.7,
                    scrollTrigger: {
                        trigger: card,
                        start: 'top 92%',
                        toggleActions: 'play none none reverse'
                    },
                    delay: i * 0.1
                }
            );
        });

        // --- Client cards: scale in ---
        gsap.utils.toArray('.client-card').forEach(function (card, i) {
            gsap.fromTo(card,
                { opacity: 0, scale: 0.9 },
                {
                    opacity: 1, scale: 1, duration: 0.5,
                    scrollTrigger: {
                        trigger: card,
                        start: 'top 95%',
                        toggleActions: 'play none none reverse'
                    },
                    delay: i * 0.04
                }
            );
        });

        // --- Testimonial card: fade scale ---
        gsap.fromTo('.testimonial-card',
            { opacity: 0, scale: 0.95, y: 40 },
            {
                opacity: 1, scale: 1, y: 0, duration: 1,
                scrollTrigger: {
                    trigger: '.testimonial-card',
                    start: 'top 85%',
                    toggleActions: 'play none none reverse'
                }
            }
        );

        // --- Testimonial intro text ---
        gsap.fromTo('.testimonial-intro',
            { opacity: 0, y: 30 },
            {
                opacity: 1, y: 0, duration: 1,
                scrollTrigger: {
                    trigger: '.testimonial-intro',
                    start: 'top 85%',
                    toggleActions: 'play none none reverse'
                }
            }
        );

        // --- Feature quote ---
        gsap.fromTo('.feature-quote',
            { opacity: 0, y: 30 },
            {
                opacity: 1, y: 0, duration: 1,
                scrollTrigger: {
                    trigger: '.feature-quote',
                    start: 'top 85%',
                    toggleActions: 'play none none reverse'
                }
            }
        );

        // --- Feature hero image ---
        gsap.fromTo('.feature-hero-image',
            { opacity: 0, scale: 0.96 },
            {
                opacity: 1, scale: 1, duration: 1.2,
                scrollTrigger: {
                    trigger: '.feature-hero-image',
                    start: 'top 85%',
                    toggleActions: 'play none none reverse'
                }
            }
        );

        // --- Split right content (Who We Are) ---
        gsap.fromTo('.split-right',
            { opacity: 0, x: 60 },
            {
                opacity: 1, x: 0, duration: 1,
                scrollTrigger: {
                    trigger: '.split-right',
                    start: 'top 80%',
                    toggleActions: 'play none none reverse'
                }
            }
        );

        // --- Footer columns stagger ---
        gsap.utils.toArray('.footer-col').forEach(function (col, i) {
            gsap.fromTo(col,
                { opacity: 0, y: 30 },
                {
                    opacity: 1, y: 0, duration: 0.7,
                    scrollTrigger: {
                        trigger: col,
                        start: 'top 95%',
                        toggleActions: 'play none none reverse'
                    },
                    delay: i * 0.15
                }
            );
        });

        // --- Buttons: subtle entrance ---
        gsap.utils.toArray('.btn-pill').forEach(function (btn) {
            if (btn.classList.contains('header-cta')) return; // skip header
            gsap.fromTo(btn,
                { opacity: 0, y: 15 },
                {
                    opacity: 1, y: 0, duration: 0.6,
                    scrollTrigger: {
                        trigger: btn,
                        start: 'top 95%',
                        toggleActions: 'play none none reverse'
                    }
                }
            );
        });
    }

})();
