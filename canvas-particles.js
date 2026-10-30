/**
 * Zenith Interactive Canvas Particle Background
 * High-performance, subtle constellation & fluid glow reacting to cursor.
 * Respects prefers-reduced-motion and tab visibility.
 */
(function () {
    'use strict';

    function initZenithBackground() {
        const canvas = document.createElement('canvas');
        canvas.id = 'zenithBgCanvas';
        canvas.className = 'zenith-bg-canvas';
        canvas.setAttribute('aria-hidden', 'true');

        // Style canvas to stay fixed behind content and ignore pointer events
        Object.assign(canvas.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: '0',
            opacity: '0.85',
            transition: 'opacity 1s ease'
        });

        document.body.prepend(canvas);

        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        let width = 0;
        let height = 0;
        let dpr = Math.min(window.devicePixelRatio || 1, 2);
        let particles = [];
        let animationFrameId = null;
        let isRunning = false;

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

        // Mouse tracker
        const mouse = {
            x: -9999,
            y: -9999,
            targetX: -9999,
            targetY: -9999,
            radius: 140,
            active: false
        };

        function resize() {
            width = window.innerWidth;
            height = window.innerHeight;
            dpr = Math.min(window.devicePixelRatio || 1, 2);

            canvas.width = Math.floor(width * dpr);
            canvas.height = Math.floor(height * dpr);
            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';

            ctx.scale(dpr, dpr);
            initParticles();
        }

        function initParticles() {
            particles = [];
            // Target ~45 particles on desktop, ~22 on mobile for 60fps
            const baseCount = width < 768 ? 24 : 50;
            const count = Math.min(baseCount, Math.floor((width * height) / 22000));

            for (let i = 0; i < count; i++) {
                const x = Math.random() * width;
                const y = Math.random() * height;
                particles.push({
                    x: x,
                    y: y,
                    originX: x,
                    originY: y,
                    vx: (Math.random() - 0.5) * 0.35,
                    vy: (Math.random() - 0.5) * 0.35,
                    radius: Math.random() * 1.5 + 0.8,
                    baseAlpha: Math.random() * 0.45 + 0.2,
                    isAccent: Math.random() > 0.65 // 35% lavender accent
                });
            }
        }

        function update() {
            // Smooth mouse interpolation
            if (mouse.active) {
                mouse.x += (mouse.targetX - mouse.x) * 0.15;
                mouse.y += (mouse.targetY - mouse.y) * 0.15;
            }

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];

                // Natural gentle drift
                p.x += p.vx;
                p.y += p.vy;

                // Bounce softly off screen bounds
                if (p.x < 0) { p.x = 0; p.vx *= -1; }
                else if (p.x > width) { p.x = width; p.vx *= -1; }
                if (p.y < 0) { p.y = 0; p.vy *= -1; }
                else if (p.y > height) { p.y = height; p.vy *= -1; }

                // Cursor interaction
                if (mouse.active) {
                    const dx = p.x - mouse.x;
                    const dy = p.y - mouse.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < mouse.radius && dist > 0.1) {
                        const force = (1 - dist / mouse.radius) * 1.8;
                        const angle = Math.atan2(dy, dx);
                        p.x += Math.cos(angle) * force;
                        p.y += Math.sin(angle) * force;
                    }
                }
            }
        }

        function draw() {
            ctx.clearRect(0, 0, width, height);

            // Subtle connecting lines between nearby particles
            const maxDist = width < 768 ? 90 : 120;
            const len = particles.length;

            for (let i = 0; i < len; i++) {
                const p1 = particles[i];
                for (let j = i + 1; j < len; j++) {
                    const p2 = particles[j];
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < maxDist) {
                        const lineAlpha = (1 - dist / maxDist) * 0.08;
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(170, 136, 255, ${lineAlpha})`;
                        ctx.lineWidth = 0.75;
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            }

            // Draw particles
            for (let i = 0; i < len; i++) {
                const p = particles[i];
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);

                if (p.isAccent) {
                    ctx.fillStyle = `rgba(170, 136, 255, ${p.baseAlpha})`;
                    ctx.shadowColor = 'rgba(170, 136, 255, 0.4)';
                    ctx.shadowBlur = 8;
                } else {
                    ctx.fillStyle = `rgba(245, 245, 245, ${p.baseAlpha * 0.75})`;
                    ctx.shadowColor = 'transparent';
                    ctx.shadowBlur = 0;
                }
                ctx.fill();
            }
            ctx.shadowBlur = 0;
        }

        function loop() {
            if (!isRunning) return;
            update();
            draw();
            animationFrameId = requestAnimationFrame(loop);
        }

        function start() {
            if (prefersReducedMotion.matches) {
                // Static subtle render for reduced motion
                draw();
                return;
            }
            if (!isRunning) {
                isRunning = true;
                loop();
            }
        }

        function stop() {
            isRunning = false;
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        }

        // Mouse & pointer listeners on window
        window.addEventListener('pointermove', function (e) {
            mouse.targetX = e.clientX;
            mouse.targetY = e.clientY;
            if (!mouse.active) {
                mouse.x = e.clientX;
                mouse.y = e.clientY;
                mouse.active = true;
            }
        }, { passive: true });

        window.addEventListener('pointerleave', function () {
            mouse.active = false;
        });

        // Tab visibility management
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) {
                stop();
            } else {
                start();
            }
        });

        let resizeTimer = null;
        window.addEventListener('resize', function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () {
                resize();
                if (!isRunning) draw();
            }, 150);
        });

        prefersReducedMotion.addEventListener('change', function () {
            if (prefersReducedMotion.matches) {
                stop();
                draw();
            } else {
                start();
            }
        });

        resize();
        start();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initZenithBackground);
    } else {
        initZenithBackground();
    }
})();
