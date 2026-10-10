/* ==========================================================
   ANTIGRAVITY 減碳 APP — MAIN APPLICATION LOGIC
   Features:
   - Theme switching (light/dark) with localStorage persistence
   - Tab navigation (sidebar + bottom nav)
   - Task 1: Camera check-in with Base64 preview
   - Task 2: Daily habits with progress ring & toasts
   - Task 3: Summary with count-up animation & confetti
   - Daily reset at midnight via date comparison
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // =======================================================
    // CONSTANTS
    // =======================================================
    const RING_CIRCUMFERENCE = 2 * Math.PI * 96; // ≈ 603.19
    const POINTS_TO_UNLOCK = 100;
    const CARBON_PER_PLATE = 0.5; // kg CO₂e per camera check-in
    const POINTS_PER_PLATE = 20;
    const STORAGE_KEY = 'ag_state';
    const THEME_KEY = 'ag_theme';

    // =======================================================
    // DOM REFERENCES
    // =======================================================
    const html = document.documentElement;

    // Navigation
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    const bnavItems = document.querySelectorAll('.bnav-item');
    const views = document.querySelectorAll('.view');

    // Theme toggles
    const themeDesktop = document.getElementById('theme-toggle-desktop');
    const themeMobile = document.getElementById('theme-toggle-mobile');

    // Home view
    const ringFill = document.getElementById('progress-ring-fill');
    const progressLabel = document.getElementById('progress-label');
    const planetImg = document.getElementById('planet-img');
    const planetName = document.getElementById('planet-name');
    const taskCheckboxes = document.querySelectorAll('.task-checkbox');
    const btnChangeBg = document.getElementById('btn-change-bg');

    // Camera view
    const btnOpenCamera = document.getElementById('btn-open-camera');
    const cameraInput = document.getElementById('camera-input');
    const previewImg = document.getElementById('preview-img');
    const previewEmpty = document.getElementById('preview-empty');
    const btnSubmitPhoto = document.getElementById('btn-submit-photo');
    const cameraPointsSpan = document.getElementById('current-points-camera');

    // Summary view
    const totalCarbonEl = document.getElementById('total-carbon-val');
    const summaryCameraVal = document.getElementById('summary-camera-val');
    const summaryHabitsVal = document.getElementById('summary-habits-val');
    const summaryCameraDetails = document.getElementById('summary-camera-details');
    const summaryHabitsDetails = document.getElementById('summary-habits-details');
    const btnCheckout = document.getElementById('btn-checkout');
    const shareMenu = document.getElementById('share-menu');

    // Modals
    const modalGallery = document.getElementById('modal-planet-gallery');
    const btnCloseGallery = document.getElementById('btn-close-gallery');
    const planetGridItems = document.querySelectorAll('.planet-grid-item');
    const modalSuccess = document.getElementById('modal-success-feedback');
    const btnCloseSuccess = document.querySelector('.btn-close-success');

    // Toast
    const toastContainer = document.getElementById('toast-container');

    // =======================================================
    // STATE
    // =======================================================
    const today = new Date().toISOString().slice(0, 10);

    let state = loadState();

    function defaultState() {
        return {
            date: today,
            totalPoints: 0,
            cameraCarbon: 0,
            habitsCarbon: 0,
            cameraTasks: [],
            dailyTasks: {},
            selectedPlanet: 'assets/planet_earth.png',
            selectedPlanetName: '蔚藍地球',
            settled: false
        };
    }

    function loadState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                // Daily reset: if stored date is different from today, reset
                if (parsed.date !== today) {
                    return defaultState();
                }
                return parsed;
            }
        } catch (e) { /* ignore */ }
        return defaultState();
    }

    function saveState() {
        state.date = today;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    // =======================================================
    // THEME MANAGEMENT
    // =======================================================
    function applyTheme(theme) {
        html.setAttribute('data-theme', theme);
        localStorage.setItem(THEME_KEY, theme);
    }

    function toggleTheme() {
        const current = html.getAttribute('data-theme');
        applyTheme(current === 'light' ? 'dark' : 'light');
    }

    // Load saved theme
    const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
    applyTheme(savedTheme);

    themeDesktop.addEventListener('click', toggleTheme);
    themeMobile.addEventListener('click', toggleTheme);

    // =======================================================
    // NAVIGATION
    // =======================================================
    function switchView(targetId) {
        views.forEach(v => v.classList.toggle('active', v.id === targetId));
        sidebarItems.forEach(i => i.classList.toggle('active', i.dataset.target === targetId));
        bnavItems.forEach(i => i.classList.toggle('active', i.dataset.target === targetId));

        if (targetId === 'view-summary') {
            renderSummary();
        }
    }

    sidebarItems.forEach(item => {
        item.addEventListener('click', () => switchView(item.dataset.target));
    });
    bnavItems.forEach(item => {
        item.addEventListener('click', () => switchView(item.dataset.target));
    });

    // =======================================================
    // PROGRESS RING
    // =======================================================
    function updateRing() {
        const pct = Math.min(state.totalPoints / POINTS_TO_UNLOCK, 1);
        const offset = RING_CIRCUMFERENCE * (1 - pct);
        ringFill.style.strokeDashoffset = offset;
        progressLabel.textContent = `${state.totalPoints} / ${POINTS_TO_UNLOCK} Pts`;
        cameraPointsSpan.textContent = state.totalPoints;

        if (pct >= 1 && html.getAttribute('data-theme') === 'dark') {
            ringFill.parentElement.style.animation = 'pulseRing 2s infinite';
        } else {
            ringFill.parentElement.style.animation = '';
        }
    }

    // =======================================================
    // TOAST
    // =======================================================
    function showToast(message) {
        const t = document.createElement('div');
        t.className = 'toast';
        t.textContent = message;
        toastContainer.appendChild(t);
        setTimeout(() => t.remove(), 1700);
    }

    // =======================================================
    // TASK 2: DAILY HABITS
    // =======================================================
    function initHabits() {
        taskCheckboxes.forEach(cb => {
            const id = cb.dataset.taskId;
            if (state.dailyTasks[id]) {
                cb.checked = true;
            }
            if (state.settled) {
                cb.disabled = true;
            }
        });
        recalcHabitsCarbon();
    }

    function recalcHabitsCarbon() {
        let total = 0;
        taskCheckboxes.forEach(cb => {
            if (cb.checked) {
                total += parseFloat(cb.dataset.carbon);
            }
        });
        state.habitsCarbon = total;
    }

    taskCheckboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            const pts = parseInt(cb.dataset.points);
            const id = cb.dataset.taskId;

            if (cb.checked) {
                state.dailyTasks[id] = true;
                state.totalPoints += pts;
                showToast(`+${pts} Pts`);
            } else {
                state.dailyTasks[id] = false;
                state.totalPoints -= pts;
            }
            recalcHabitsCarbon();
            updateRing();
            saveState();
        });
    });

    // =======================================================
    // PLANET GALLERY
    // =======================================================
    btnChangeBg.addEventListener('click', () => {
        modalGallery.classList.add('active');
    });
    btnCloseGallery.addEventListener('click', () => {
        modalGallery.classList.remove('active');
    });
    modalGallery.addEventListener('click', (e) => {
        if (e.target === modalGallery) modalGallery.classList.remove('active');
    });

    planetGridItems.forEach(item => {
        item.addEventListener('click', () => {
            planetGridItems.forEach(g => g.classList.remove('active'));
            item.classList.add('active');

            const bg = item.dataset.bg;
            const name = item.dataset.name;

            planetImg.src = bg;
            planetName.textContent = name;
            state.selectedPlanet = bg;
            state.selectedPlanetName = name;
            saveState();

            setTimeout(() => modalGallery.classList.remove('active'), 300);
        });
    });

    // Apply saved planet
    planetImg.src = state.selectedPlanet;
    planetName.textContent = state.selectedPlanetName;
    // Also sync gallery active state
    planetGridItems.forEach(g => {
        g.classList.toggle('active', g.dataset.bg === state.selectedPlanet);
    });

    // =======================================================
    // TASK 1: CAMERA CHECK-IN
    // =======================================================
    btnOpenCamera.addEventListener('click', () => cameraInput.click());

    cameraInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            previewImg.src = ev.target.result;
            previewImg.classList.add('visible');
            previewEmpty.style.display = 'none';
            btnSubmitPhoto.disabled = false;
        };
        reader.readAsDataURL(file);
    });

    btnSubmitPhoto.addEventListener('click', () => {
        if (btnSubmitPhoto.disabled) return;

        // Show loading
        btnSubmitPhoto.classList.add('loading');
        btnSubmitPhoto.disabled = true;

        // Simulate API upload
        setTimeout(() => {
            btnSubmitPhoto.classList.remove('loading');

            // Reset preview
            previewImg.classList.remove('visible');
            previewEmpty.style.display = '';
            cameraInput.value = '';

            // Update state
            state.cameraCarbon += CARBON_PER_PLATE;
            state.totalPoints += POINTS_PER_PLATE;
            state.cameraTasks.push({ name: '餐盤光光', carbon: CARBON_PER_PLATE });
            updateRing();
            saveState();

            // Show success modal
            modalSuccess.classList.add('active');
        }, 1500);
    });

    btnCloseSuccess.addEventListener('click', () => {
        modalSuccess.classList.remove('active');
    });
    modalSuccess.addEventListener('click', (e) => {
        if (e.target === modalSuccess) modalSuccess.classList.remove('active');
    });

    // =======================================================
    // TASK 3: SUMMARY & CHECKOUT
    // =======================================================
    function animateCounter(element, target, duration = 2000, decimals = 1) {
        const start = parseFloat(element.textContent) || 0;
        const range = target - start;
        if (Math.abs(range) < 0.01) {
            element.textContent = target.toFixed(decimals);
            return;
        }
        const startTime = performance.now();

        function tick(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            element.textContent = (start + range * eased).toFixed(decimals);
            if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    function renderSummary() {
        const totalCarbon = state.cameraCarbon + state.habitsCarbon;

        // Animate number
        animateCounter(totalCarbonEl, totalCarbon, 1800);

        summaryCameraVal.textContent = `${state.cameraCarbon.toFixed(1)} kg`;
        summaryHabitsVal.textContent = `${state.habitsCarbon.toFixed(1)} kg`;

        // Camera details
        summaryCameraDetails.innerHTML = '';
        if (state.cameraTasks.length === 0) {
            summaryCameraDetails.innerHTML = '<div class="detail-row"><span>尚無紀錄</span><span>0.0 kg</span></div>';
        } else {
            state.cameraTasks.forEach(t => {
                summaryCameraDetails.innerHTML += `<div class="detail-row"><span>${t.name}</span><span>${t.carbon.toFixed(1)} kg</span></div>`;
            });
        }

        // Habits details
        summaryHabitsDetails.innerHTML = '';
        let hasHabit = false;
        taskCheckboxes.forEach(cb => {
            if (cb.checked) {
                hasHabit = true;
                const name = cb.closest('.task-item').querySelector('.task-name').textContent;
                const carbon = parseFloat(cb.dataset.carbon);
                summaryHabitsDetails.innerHTML += `<div class="detail-row"><span>${name}</span><span>${carbon.toFixed(1)} kg</span></div>`;
            }
        });
        if (!hasHabit) {
            summaryHabitsDetails.innerHTML = '<div class="detail-row"><span>尚無紀錄</span><span>0.0 kg</span></div>';
        }

        // If already settled, hide checkout and show share
        if (state.settled) {
            btnCheckout.style.display = 'none';
            shareMenu.classList.add('visible');
        } else {
            btnCheckout.style.display = '';
            shareMenu.classList.remove('visible');
        }
    }

    btnCheckout.addEventListener('click', () => {
        // Confetti burst
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 180,
                spread: 80,
                origin: { y: 0.55 },
                colors: [
                    getComputedStyle(html).getPropertyValue('--accent').trim(),
                    '#F5A623', '#22C55E', '#fff'
                ]
            });
        }

        btnCheckout.style.display = 'none';
        shareMenu.classList.add('visible');

        // Lock everything
        state.settled = true;
        taskCheckboxes.forEach(cb => cb.disabled = true);
        btnSubmitPhoto.disabled = true;
        btnOpenCamera.disabled = true;
        saveState();
    });

    // Web Share API
    const btnShareNative = document.getElementById('btn-share-native');
    if (btnShareNative) {
        btnShareNative.addEventListener('click', async () => {
            const total = (state.cameraCarbon + state.habitsCarbon).toFixed(1);
            const shareData = {
                title: 'Antigravity 減碳成果',
                text: `🌍 我今天透過 Antigravity 減少了 ${total} kg CO₂e 的碳排放！一起加入環保行列吧！`,
                url: window.location.href
            };
            try {
                if (navigator.share) {
                    await navigator.share(shareData);
                } else {
                    // Fallback: copy to clipboard
                    await navigator.clipboard.writeText(shareData.text);
                    showToast('已複製到剪貼簿！');
                }
            } catch (err) {
                // User cancelled or error — ignore
            }
        });
    }

    // =======================================================
    // INITIALIZATION
    // =======================================================
    initHabits();
    updateRing();
    saveState();

    // If settled, lock controls
    if (state.settled) {
        taskCheckboxes.forEach(cb => cb.disabled = true);
        btnSubmitPhoto.disabled = true;
        btnOpenCamera.disabled = true;
    }

});
