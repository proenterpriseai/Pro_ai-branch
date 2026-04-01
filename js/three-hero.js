/* ============================================================
   Three.js 3D Metallic Spiral — OrfeoAI-level quality
   ES Module: dense spiral + object animation + bloom + wave bg
   ============================================================ */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

(function () {
    'use strict';

    // Mobile check — skip on small screens
    if (window.innerWidth < 769) {
        const c = document.getElementById('threeCanvas');
        if (c) c.style.display = 'none';
        return;
    }

    initScene();

    function initScene() {
        const canvas = document.getElementById('threeCanvas');
        if (!canvas) return;

        /* ==========================================================
           1. RENDERER
           ========================================================== */
        const renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: false
        });
        renderer.setClearColor(0x000000, 1);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.6;

        /* ==========================================================
           2. SCENE + CAMERA (fixed position)
           ========================================================== */
        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera(
            50,
            window.innerWidth / window.innerHeight,
            0.1,
            200
        );
        camera.position.set(0, 0, 8);

        /* ==========================================================
           3. DENSE SPIRAL GEOMETRY (50 turns)
           ========================================================== */
        function createSpiral() {
            const points = [];
            const turns = 24;
            const radius = 2.8;
            const height = 5.5;
            const segments = turns * 60; // 1440 points

            for (let i = 0; i <= segments; i++) {
                const t = i / segments;
                const angle = t * Math.PI * 2 * turns;
                points.push(new THREE.Vector3(
                    Math.cos(angle) * radius,
                    (t - 0.5) * height,
                    Math.sin(angle) * radius
                ));
            }

            const curve = new THREE.CatmullRomCurve3(points, false);
            // tubularSegments=1200, radialSegments=8 for performance
            return new THREE.TubeGeometry(curve, 1200, 0.065, 8, false);
        }

        /* ==========================================================
           4. ENHANCED ENVIRONMENT MAP
           ========================================================== */
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        const envScene = new THREE.Scene();

        // Background sphere
        const envSphere = new THREE.Mesh(
            new THREE.SphereGeometry(25, 32, 32),
            new THREE.MeshBasicMaterial({ color: 0x020204, side: THREE.BackSide })
        );
        envScene.add(envSphere);

        // Color gradient strips (emissive planes for rich reflections)
        const stripMat1 = new THREE.MeshBasicMaterial({ color: 0x6644ff, side: THREE.DoubleSide });
        const stripMat2 = new THREE.MeshBasicMaterial({ color: 0x44ddcc, side: THREE.DoubleSide });
        const stripMat3 = new THREE.MeshBasicMaterial({ color: 0xff4488, side: THREE.DoubleSide });
        const stripMat4 = new THREE.MeshBasicMaterial({ color: 0x88aaff, side: THREE.DoubleSide });
        const stripMat5 = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });

        const stripGeo = new THREE.PlaneGeometry(12, 4);

        const strip1 = new THREE.Mesh(stripGeo, stripMat1);
        strip1.position.set(10, 6, -8);
        strip1.rotation.set(0.3, -0.5, 0.1);
        envScene.add(strip1);

        const strip2 = new THREE.Mesh(stripGeo, stripMat2);
        strip2.position.set(-10, -4, 6);
        strip2.rotation.set(-0.2, 0.8, 0);
        envScene.add(strip2);

        const strip3 = new THREE.Mesh(stripGeo, stripMat3);
        strip3.position.set(0, 10, -6);
        strip3.rotation.set(0.5, 0, 0.3);
        envScene.add(strip3);

        const strip4 = new THREE.Mesh(stripGeo, stripMat4);
        strip4.position.set(-8, 2, 10);
        strip4.rotation.set(0, -0.4, 0.2);
        envScene.add(strip4);

        const strip5 = new THREE.Mesh(stripGeo, stripMat5);
        strip5.position.set(6, -6, 8);
        strip5.rotation.set(-0.3, 0.6, 0);
        envScene.add(strip5);

        // Point lights for env map
        const envLights = [
            { color: 0x6688ff, intensity: 350, pos: [10, 8, 8] },
            { color: 0xaa66ff, intensity: 300, pos: [-10, -5, 7] },
            { color: 0x44ffcc, intensity: 250, pos: [0, 10, -10] },
            { color: 0xff6699, intensity: 200, pos: [-8, 3, -8] },
            { color: 0xffffff, intensity: 280, pos: [5, -7, 5] },
            { color: 0x88ccff, intensity: 220, pos: [-5, 5, -5] },
            { color: 0xcc88ff, intensity: 180, pos: [8, 0, -6] }
        ];
        envLights.forEach(function (l) {
            const pl = new THREE.PointLight(l.color, l.intensity, 60);
            pl.position.set(l.pos[0], l.pos[1], l.pos[2]);
            envScene.add(pl);
        });

        const envAmbient = new THREE.AmbientLight(0x334466, 6);
        envScene.add(envAmbient);

        const envMap = pmremGenerator.fromScene(envScene, 0.04).texture;
        pmremGenerator.dispose();

        /* ==========================================================
           5. MATERIAL
           ========================================================== */
        const material = new THREE.MeshPhysicalMaterial({
            metalness: 1.0,
            roughness: 0.03,
            color: 0xaaaacc,
            envMap: envMap,
            envMapIntensity: 5.5,
            clearcoat: 1.0,
            clearcoatRoughness: 0.04,
            reflectivity: 1.0,
            transparent: true,
            opacity: 1.0
        });

        // Organic "wriggle" animation via vertex shader injection
        const wriggleUniforms = { uWriggleTime: { value: 0 } };
        material.onBeforeCompile = function (shader) {
            shader.uniforms.uWriggleTime = wriggleUniforms.uWriggleTime;
            // Inject uniform declaration
            shader.vertexShader = 'uniform float uWriggleTime;\n' + shader.vertexShader;
            // Inject displacement after #include <begin_vertex>
            shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `#include <begin_vertex>
                float wFreq = 2.0;
                float wAmp = 0.08;
                float wt = uWriggleTime;
                float displaceX = sin(position.y * wFreq + wt * 1.2) * wAmp;
                float displaceY = cos(position.x * wFreq * 0.8 + wt * 0.9) * wAmp * 0.7;
                float displaceZ = sin((position.x + position.y) * wFreq * 0.6 + wt * 1.5) * wAmp * 0.5;
                transformed += vec3(displaceX, displaceY, displaceZ);`
            );
        };

        // Iridescence if supported
        if ('iridescence' in material) {
            material.iridescence = 1.0;
            material.iridescenceIOR = 1.5;
            material.iridescenceThicknessRange = [100, 400];
        }

        /* ==========================================================
           6. SPIRAL GROUP + MESH
           ========================================================== */
        const spiralGeo = createSpiral();
        const spiral = new THREE.Mesh(spiralGeo, material);

        // Inner tilt group — permanent diagonal orientation (like OrfeoAI)
        const spiralTilt = new THREE.Group();
        spiralTilt.rotation.set(0.3, 0, -0.6); // ~35° diagonal tilt
        spiralTilt.add(spiral);

        const spiralGroup = new THREE.Group();
        spiralGroup.add(spiralTilt);
        scene.add(spiralGroup);

        /* ==========================================================
           7. BACKGROUND WAVE PARTICLES
           ========================================================== */
        function createWavePlane(yPos, zPos, color, opacity) {
            const geo = new THREE.PlaneGeometry(50, 30, 80, 50);
            const mat = new THREE.ShaderMaterial({
                uniforms: {
                    uTime: { value: 0 },
                    uColor: { value: new THREE.Color(color) },
                    uOpacity: { value: opacity }
                },
                vertexShader: `
                    uniform float uTime;
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        vec3 pos = position;
                        float wave1 = sin(pos.x * 0.3 + uTime * 0.4) * 0.8;
                        float wave2 = sin(pos.y * 0.5 + uTime * 0.3) * 0.5;
                        float wave3 = cos(pos.x * 0.15 + pos.y * 0.2 + uTime * 0.2) * 1.0;
                        pos.z += wave1 + wave2 + wave3;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform vec3 uColor;
                    uniform float uOpacity;
                    varying vec2 vUv;
                    void main() {
                        float edgeFade = smoothstep(0.0, 0.15, vUv.x) * smoothstep(1.0, 0.85, vUv.x)
                                       * smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.85, vUv.y);
                        gl_FragColor = vec4(uColor, uOpacity * edgeFade);
                    }
                `,
                transparent: true,
                wireframe: true,
                depthWrite: false,
                side: THREE.DoubleSide
            });

            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(0, yPos, zPos);
            mesh.rotation.x = -0.2;
            return mesh;
        }

        const wave1 = createWavePlane(4, -15, 0x221144, 0.025);
        const wave2 = createWavePlane(-6, -18, 0x331155, 0.02);
        scene.add(wave1);
        scene.add(wave2);

        /* ==========================================================
           8. SCENE LIGHTS
           ========================================================== */
        const sceneLights = [
            { color: 0x6688ff, intensity: 70, pos: [10, 6, 8] },
            { color: 0xaa66ff, intensity: 55, pos: [-10, -5, 7] },
            { color: 0x44ffcc, intensity: 45, pos: [0, 10, -8] },
            { color: 0xff6699, intensity: 35, pos: [-6, 4, -6] },
            { color: 0xffffff, intensity: 30, pos: [6, -6, 6] }
        ];
        sceneLights.forEach(function (l) {
            const pl = new THREE.PointLight(l.color, l.intensity, 45);
            pl.position.set(l.pos[0], l.pos[1], l.pos[2]);
            scene.add(pl);
        });
        scene.add(new THREE.AmbientLight(0x223344, 3));

        /* ==========================================================
           9. POST-PROCESSING (Bloom)
           ========================================================== */
        const composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));

        const bloomRes = new THREE.Vector2(
            Math.floor(window.innerWidth / 2),
            Math.floor(window.innerHeight / 2)
        );
        const bloomPass = new UnrealBloomPass(bloomRes, 0.3, 0.5, 0.88);
        composer.addPass(bloomPass);

        const outputPass = new OutputPass();
        composer.addPass(outputPass);

        /* ==========================================================
           10. MOUSE PARALLAX
           ========================================================== */
        let mouseX = 0, mouseY = 0;
        window.addEventListener('mousemove', function (e) {
            mouseX = (e.clientX / window.innerWidth - 0.5) * 0.3;
            mouseY = (e.clientY / window.innerHeight - 0.5) * 0.2;
        }, { passive: true });

        /* ==========================================================
           11. GSAP SCROLL ANIMATIONS (object-based)
           ========================================================== */
        function waitForGSAP() {
            if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
                initScrollAnimations();
            } else {
                setTimeout(waitForGSAP, 100);
            }
        }
        waitForGSAP();

        function initScrollAnimations() {
            gsap.registerPlugin(ScrollTrigger);

            // Helper: animate spiralGroup per section
            function sectionAnim(trigger, toPos, toRot, toScale, toOpacity, scrollConfig) {
                const defaults = {
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: 1
                };
                const sc = Object.assign({}, defaults, scrollConfig || {});

                const tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: trigger,
                        start: sc.start,
                        end: sc.end,
                        scrub: sc.scrub
                    }
                });

                tl.to(spiralGroup.position, {
                    x: toPos[0], y: toPos[1], z: toPos[2],
                    duration: 1
                }, 0);

                tl.to(spiralGroup.rotation, {
                    x: toRot[0], y: toRot[1], z: toRot[2],
                    duration: 1
                }, 0);

                tl.to(spiralGroup.scale, {
                    x: toScale, y: toScale, z: toScale,
                    duration: 1
                }, 0);

                if (toOpacity !== null && toOpacity !== undefined) {
                    tl.to(material, {
                        opacity: toOpacity,
                        duration: 1
                    }, 0);
                }

                return tl;
            }

            // --- Section animations ---

            // #whatWeDo — ZOOM IN: massive scale, fills screen with coils
            sectionAnim('#whatWeDo',
                [-1.5, -2, -3],       // position
                [-0.8, 1.2, 0.3],     // rotation
                3.5,                   // scale
                1.0,                   // opacity
                { start: 'top bottom', end: 'bottom top' }
            );

            // #whatWeBuild — shrink + fade, cards take focus
            sectionAnim('#whatWeBuild',
                [2, 5, -2],
                [-1.5, 2.0, 0.5],
                0.6,
                0.3
            );

            // #whoWeAre — left column
            sectionAnim('#whoWeAre',
                [-4, 0, -1],
                [0.3, -0.8, -0.2],
                1.2,
                1.0
            );

            // #whyChooseUs — sweep to right
            sectionAnim('#whyChooseUs',
                [5, 0.5, -1],
                [-0.5, 2.5, 0.4],
                1.0,
                1.0
            );

            // #features — dramatic angle, far left
            sectionAnim('#features',
                [-6, 1, -3],
                [-2.0, 4.0, -0.5],
                1.5,
                1.0
            );

            // #clients — minimize, logos take focus
            sectionAnim('#clients',
                [0, -1, -5],
                [0, 5.0, 0],
                0.4,
                0.25
            );

            // #testimonial — re-expand dramatically
            sectionAnim('#testimonial',
                [0, 0, -1],
                [-1.0, 6.0, 0.3],
                2.5,
                1.0
            );

            // footer — exit: sink below
            sectionAnim('.site-footer',
                [0, -8, -4],
                [-1.5, 7.0, 0.5],
                0.3,
                0.3,
                { start: 'top bottom', end: 'top center' }
            );
        }

        /* ==========================================================
           12. HERO ENTRANCE ANIMATION
           ========================================================== */
        // Set initial state (compressed, slightly visible)
        spiralGroup.scale.set(0.85, 0.85, 0.85);
        spiralGroup.rotation.set(0, -Math.PI * 0.5, 0);

        window.__revealHero = function () {
            if (typeof gsap !== 'undefined') {
                gsap.to(spiralGroup.scale, {
                    x: 1, y: 1, z: 1,
                    duration: 1.8,
                    ease: 'power2.out'
                });
                gsap.to(spiralGroup.rotation, {
                    x: 0, y: 0, z: 0,
                    duration: 1.8,
                    ease: 'power2.out'
                });
            } else {
                spiralGroup.scale.set(1, 1, 1);
                spiralGroup.rotation.y = 0;
            }
        };

        /* ==========================================================
           13. ANIMATION LOOP
           ========================================================== */
        let isRendering = true;

        function animate() {
            requestAnimationFrame(animate);
            if (!isRendering) return;

            // Subtle idle rotation on inner mesh only (no conflict with GSAP on group)
            spiral.rotation.y += 0.0008;

            // Organic wriggle animation
            wriggleUniforms.uWriggleTime.value = performance.now() * 0.001;

            // Mouse parallax on camera (gentle)
            camera.position.x += (mouseX - camera.position.x) * 0.04;
            camera.position.y += (mouseY - camera.position.y) * 0.04;
            camera.lookAt(0, 0, 0);

            // Animate wave backgrounds
            const time = performance.now() * 0.001;
            if (wave1.material.uniforms) wave1.material.uniforms.uTime.value = time;
            if (wave2.material.uniforms) wave2.material.uniforms.uTime.value = time;

            // Render with bloom post-processing
            composer.render();
        }

        animate();

        /* ==========================================================
           14. RESIZE
           ========================================================== */
        window.addEventListener('resize', function () {
            if (window.innerWidth < 769) {
                canvas.style.display = 'none';
                isRendering = false;
                return;
            }
            canvas.style.display = '';
            isRendering = true;
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            composer.setSize(window.innerWidth, window.innerHeight);
            bloomPass.resolution.set(window.innerWidth, window.innerHeight);
        });

        /* ==========================================================
           15. EXPOSE FOR LOADING SCREEN
           ========================================================== */
        window.__threeReady = true;
    }
})();
