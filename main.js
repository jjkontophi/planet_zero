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
    const COOKIE_PROGRESS_KEY = 'pz_user_progress';
    const COOKIE_HISTORY_KEY = 'pz_past_progress';
    const COOKIE_DAYS = 365;

    // =======================================================
    // COOKIE HELPERS
    // =======================================================
    function setCookie(name, value, days = COOKIE_DAYS) {
        try {
            const expires = new Date(Date.now() + days * 864e5).toUTCString();
            const valStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
            document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(valStr)}; expires=${expires}; path=/; SameSite=Lax`;
        } catch (e) {
            console.warn('Cookie write error:', e);
        }
    }

    function getCookie(name) {
        try {
            const target = encodeURIComponent(name) + '=';
            const cookieArray = document.cookie.split(';');
            for (let item of cookieArray) {
                item = item.trim();
                if (item.startsWith(target)) {
                    const rawVal = decodeURIComponent(item.substring(target.length));
                    try {
                        return JSON.parse(rawVal);
                    } catch {
                        return rawVal;
                    }
                }
            }
        } catch (e) {
            console.warn('Cookie read error:', e);
        }
        return null;
    }

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
    const progressNextTip = document.getElementById('progress-next-tip');
    const planetStageText = document.getElementById('planet-stage-text');
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
    const summaryHistoryCount = document.getElementById('summary-history-count');
    const summaryHistoryDetails = document.getElementById('summary-history-details');
    const lifetimeCarbonEl = document.getElementById('lifetime-carbon-val');
    const lifetimePtsEl = document.getElementById('lifetime-pts-val');
    const cookieLastSaved = document.getElementById('cookie-last-saved');
    const btnCheckout = document.getElementById('btn-checkout');
    const shareMenu = document.getElementById('share-menu');

    // Modals
    const modalGallery = document.getElementById('modal-planet-gallery');
    const btnCloseGallery = document.getElementById('btn-close-gallery');
    const modalSuccess = document.getElementById('modal-success-feedback');
    const btnCloseSuccess = document.querySelector('.btn-close-success');
    const modalLevelup = document.getElementById('modal-planet-levelup');
    const btnCloseLevelup = document.getElementById('btn-close-levelup');
    const levelupImg = document.getElementById('levelup-img');
    const levelupTitle = document.getElementById('levelup-title');
    const levelupStage = document.getElementById('levelup-stage');
    const levelupDesc = document.getElementById('levelup-desc');
    const levelupValPct = document.getElementById('levelup-val-pct');
    const levelupValNext = document.getElementById('levelup-val-next');

    // Toast
    const toastContainer = document.getElementById('toast-container');

    // =======================================================
    // STATE & PAST PROGRESS PERSISTENCE
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
            selectedPlanet: 'images/0.jpg',
            selectedPlanetName: '荒蕪星球 (0%)',
            highestPlanetLevel: 0,
            settled: false,
            lifetimePoints: 0,
            lifetimeCarbon: 0,
            history: [] // [{ date: '2026-10-25', points: 30, carbon: 0.8, settled: true }]
        };
    }

    function loadState() {
        let saved = null;
        // 1. Try reading from cookie first
        try {
            saved = getCookie(COOKIE_PROGRESS_KEY);
        } catch (e) {}

        // 2. Fallback to localStorage
        if (!saved) {
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                if (raw) saved = JSON.parse(raw);
            } catch (e) {}
        }

        // Check for dedicated history cookie
        let pastHistory = null;
        try {
            pastHistory = getCookie(COOKIE_HISTORY_KEY);
        } catch (e) {}

        if (saved) {
            const base = defaultState();
            const merged = { ...base, ...saved };
            if (Array.isArray(pastHistory) && pastHistory.length > 0) {
                merged.history = pastHistory;
            }

            // Daily transition: If stored date is a previous day, archive it into history!
            if (merged.date !== today) {
                const hadActivity = (merged.totalPoints > 0 || merged.cameraCarbon > 0 || merged.habitsCarbon > 0 || merged.settled);
                if (hadActivity) {
                    if (!Array.isArray(merged.history)) merged.history = [];
                    const alreadyArchived = merged.history.some(h => h.date === merged.date);
                    if (!alreadyArchived) {
                        merged.history.unshift({
                            date: merged.date,
                            points: merged.totalPoints || 0,
                            carbon: parseFloat(((merged.cameraCarbon || 0) + (merged.habitsCarbon || 0)).toFixed(1)),
                            settled: !!merged.settled
                        });
                        if (merged.history.length > 30) merged.history = merged.history.slice(0, 30);
                    }
                }

                // Preserve cumulative past progress
                merged.lifetimePoints = (merged.lifetimePoints || 0) + (merged.totalPoints || 0);
                merged.lifetimeCarbon = parseFloat(((merged.lifetimeCarbon || 0) + (merged.cameraCarbon || 0) + (merged.habitsCarbon || 0)).toFixed(1));

                // Reset daily active counters for new day
                merged.date = today;
                merged.totalPoints = 0;
                merged.cameraCarbon = 0;
                merged.habitsCarbon = 0;
                merged.cameraTasks = [];
                merged.dailyTasks = {};
                merged.settled = false;
            }

            if (!merged.selectedPlanet || merged.selectedPlanet.startsWith('assets/')) {
                merged.selectedPlanet = 'images/0.jpg';
                merged.selectedPlanetName = '荒蕪星球 (0%)';
            }

            return merged;
        }

        return defaultState();
    }

    function saveState() {
        state.date = today;

        // Save current progress to Cookie
        setCookie(COOKIE_PROGRESS_KEY, state);

        // Save past progress history to dedicated Cookie
        if (state.history && state.history.length > 0) {
            setCookie(COOKIE_HISTORY_KEY, state.history);
        }

        // Backup to localStorage
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {}

        // Update UI indicator
        const statusEl = document.getElementById('cookie-last-saved');
        if (statusEl) {
            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            statusEl.textContent = `${t('cookieSynced')} (${timeStr})`;
        }
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
    // LANGUAGE (i18n) MANAGEMENT
    // =======================================================
    const { t, setLang, getLang } = window.i18n;

    function applyTranslations() {
        const lang = getLang();

        // Update page title
        document.title = t('pageTitle');

        // All elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = t(key);
        });

        // Placeholder attributes
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            el.placeholder = t(key);
        });

        // data-i18n-question on preset chips
        document.querySelectorAll('[data-i18n-question]').forEach(el => {
            const key = el.getAttribute('data-i18n-question');
            el.dataset.question = t(key);
        });

        // Update planet grid item data-name attributes
        const planetNameMap = {
            'images/0.jpg':   'planet0',
            'images/25.jpg':  'planet25',
            'images/50.png':  'planet50',
            'images/75.png':  'planet75',
            'images/100.jpg': 'planet100',
        };
        document.querySelectorAll('.planet-grid-item').forEach(item => {
            const bg = item.dataset.bg;
            if (planetNameMap[bg]) {
                item.dataset.name = t(planetNameMap[bg]);
            }
        });

        // Update the planet name display
        if (state.selectedPlanet && planetNameMap[state.selectedPlanet]) {
            const translatedName = t(planetNameMap[state.selectedPlanet]);
            planetName.textContent = translatedName;
            state.selectedPlanetName = translatedName;
        }

        // Re-render the ring with translated text
        updateRing();

        // Re-render habits so task names appear in chosen language
        if (typeof renderHabits === 'function') renderHabits();

        // Re-init AI chat welcome message in chosen language (only if no user messages yet)
        const aiMessages = document.getElementById('ai-chat-messages');
        if (aiMessages && window._reinitAiWelcome) {
            const userBubbles = aiMessages.querySelectorAll('.ai-bubble.user');
            if (userBubbles.length === 0) {
                window._reinitAiWelcome();
            }
        }

        // Update lang toggle visual
        updateLangToggleUI();
    }

    function updateLangToggleUI() {
        const lang = getLang();
        // Desktop
        const thumbD = document.getElementById('lang-slider-thumb');
        const zhBtnD = document.getElementById('lang-btn-zh');
        const enBtnD = document.getElementById('lang-btn-en');
        if (thumbD) thumbD.style.transform = lang === 'en' ? 'translateX(100%)' : 'translateX(0)';
        if (zhBtnD) zhBtnD.classList.toggle('active', lang === 'zh-TW');
        if (enBtnD) enBtnD.classList.toggle('active', lang === 'en');

        // Mobile
        const thumbM = document.getElementById('lang-slider-thumb-m');
        const zhBtnM = document.getElementById('lang-btn-zh-m');
        const enBtnM = document.getElementById('lang-btn-en-m');
        if (thumbM) thumbM.style.transform = lang === 'en' ? 'translateX(100%)' : 'translateX(0)';
        if (zhBtnM) zhBtnM.classList.toggle('active', lang === 'zh-TW');
        if (enBtnM) enBtnM.classList.toggle('active', lang === 'en');
    }

    function initLangToggle() {
        ['lang-btn-zh', 'lang-btn-en', 'lang-btn-zh-m', 'lang-btn-en-m'].forEach(id => {
            const btn = document.getElementById(id);
            if (!btn) return;
            btn.addEventListener('click', () => {
                const lang = btn.dataset.lang;
                if (lang === getLang()) return;
                setLang(lang);
                applyTranslations();
                // If summary view is open, re-render it
                if (document.getElementById('view-summary')?.classList.contains('active')) {
                    renderSummary();
                }
            });
        });
        // Set initial state
        updateLangToggleUI();
    }

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

    // Clicking brand logo returns to home view
    document.querySelector('.sidebar-brand')?.addEventListener('click', () => switchView('view-home'));
    document.querySelector('.mobile-brand')?.addEventListener('click', () => switchView('view-home'));

    // =======================================================
    // PLANET PURIFICATION STAGES (5-STAGE PROGRESSION SYSTEM)
    // 0% (0 pt) -> 25% (50 pt) -> 50% (200 pt) -> 75% (500 pt) -> 100% (1000 pt)
    // =======================================================
    const PLANET_STAGES = [
        {
            percent: 0,
            threshold: 0,
            nextThreshold: 50,
            image: 'images/0.jpg',
            nameKey: 'planet0',
            badgeKey: 'stageName0',
            levelupTitleKey: 'levelupTitle',
            levelupStageKey: 'levelupStage25',
            levelupDescKey: 'levelupDesc25',
        },
        {
            percent: 25,
            threshold: 50,
            nextThreshold: 200,
            image: 'images/25.jpg',
            nameKey: 'planet25',
            badgeKey: 'stageName25',
            levelupStageKey: 'levelupStage25',
            levelupDescKey: 'levelupDesc25',
        },
        {
            percent: 50,
            threshold: 200,
            nextThreshold: 500,
            image: 'images/50.png',
            nameKey: 'planet50',
            badgeKey: 'stageName50',
            levelupStageKey: 'levelupStage50',
            levelupDescKey: 'levelupDesc50',
        },
        {
            percent: 75,
            threshold: 500,
            nextThreshold: 1000,
            image: 'images/75.png',
            nameKey: 'planet75',
            badgeKey: 'stageName75',
            levelupStageKey: 'levelupStage75',
            levelupDescKey: 'levelupDesc75',
        },
        {
            percent: 100,
            threshold: 1000,
            nextThreshold: null,
            image: 'images/100.jpg',
            nameKey: 'planet100',
            badgeKey: 'stageName100',
            levelupStageKey: 'levelupStage100',
            levelupDescKey: 'levelupDesc100',
        }
    ];

    function getPlanetStageByPoints(pts) {
        let raw;
        if (pts >= 1000) raw = PLANET_STAGES[4];
        else if (pts >= 500) raw = PLANET_STAGES[3];
        else if (pts >= 200) raw = PLANET_STAGES[2];
        else if (pts >= 50) raw = PLANET_STAGES[1];
        else raw = PLANET_STAGES[0];
        // Attach translated name + badge + desc dynamically
        return {
            ...raw,
            name: t(raw.nameKey),
            badgeText: t(raw.badgeKey),
            desc: t(raw.levelupDescKey),
        };
    }

    function getTotalAccumulatedPoints() {
        return (state.lifetimePoints || 0) + (state.totalPoints || 0);
    }

    // =======================================================
    // PROGRESS RING & PURIFICATION PROGRESS
    // =======================================================
    function updateRing() {
        const totalPts = getTotalAccumulatedPoints();
        const stage = getPlanetStageByPoints(totalPts);
        cameraPointsSpan.textContent = totalPts;

        // Calculate progress percentage for current stage
        let pct = 0;
        if (stage.percent === 0) {
            pct = totalPts / 50;
            progressLabel.textContent = `${totalPts} / 50 Pts`;
            if (progressNextTip) progressNextTip.textContent = t('progressNextTip25', { pts: Math.max(50 - totalPts, 0) });
        } else if (stage.percent === 25) {
            pct = (totalPts - 50) / (200 - 50);
            progressLabel.textContent = `${totalPts} / 200 Pts`;
            if (progressNextTip) progressNextTip.textContent = t('progressNextTip50', { pts: Math.max(200 - totalPts, 0) });
        } else if (stage.percent === 50) {
            pct = (totalPts - 200) / (500 - 200);
            progressLabel.textContent = `${totalPts} / 500 Pts`;
            if (progressNextTip) progressNextTip.textContent = t('progressNextTip75', { pts: Math.max(500 - totalPts, 0) });
        } else if (stage.percent === 75) {
            pct = (totalPts - 500) / (1000 - 500);
            progressLabel.textContent = `${totalPts} / 1000 Pts`;
            if (progressNextTip) progressNextTip.textContent = t('progressNextTip100', { pts: Math.max(1000 - totalPts, 0) });
        } else {
            pct = 1;
            progressLabel.textContent = `${totalPts} Pts (100%)`;
            if (progressNextTip) progressNextTip.textContent = t('progressNextTipMax');
        }

        const clampedPct = Math.min(Math.max(pct, 0), 1);
        const offset = RING_CIRCUMFERENCE * (1 - clampedPct);
        ringFill.style.strokeDashoffset = offset;

        // Sync planet image & badge with current stage (unless custom previewed)
        if (!state.selectedPlanet || state.selectedPlanet.startsWith('assets/')) {
            state.selectedPlanet = stage.image;
            state.selectedPlanetName = stage.name;
        }

        planetImg.src = state.selectedPlanet;
        planetName.textContent = state.selectedPlanetName;
        if (planetStageText) planetStageText.textContent = stage.badgeText;

        // Pulse ring animation when 100% complete
        if (totalPts >= 1000) {
            ringFill.parentElement.style.animation = 'pulseRing 2s infinite';
        } else {
            ringFill.parentElement.style.animation = '';
        }

        // Update Milestone track
        updateMilestones(totalPts, stage.percent);

        // Update Gallery Modal states
        updateGalleryUI(totalPts);

        // Check for Level-Up Celebration!
        checkLevelUp(stage);
    }

    function updateMilestones(totalPts, currentPct) {
        const steps = [
            { id: 'mstep-0', pct: 0, req: 0 },
            { id: 'mstep-25', pct: 25, req: 50 },
            { id: 'mstep-50', pct: 50, req: 200 },
            { id: 'mstep-75', pct: 75, req: 500 },
            { id: 'mstep-100', pct: 100, req: 1000 }
        ];

        steps.forEach((s) => {
            const el = document.getElementById(s.id);
            if (!el) return;
            const isUnlocked = totalPts >= s.req;
            const isActive = currentPct === s.pct;

            el.classList.toggle('unlocked', isUnlocked);
            el.classList.toggle('active', isActive);

            const dot = el.querySelector('.milestone-dot');
            if (dot) {
                if (s.pct === 0) {
                    dot.innerHTML = '<i class="fa-solid fa-check"></i>';
                } else if (s.pct === 100) {
                    dot.innerHTML = isUnlocked ? '<i class="fa-solid fa-crown"></i>' : '100%';
                } else {
                    dot.innerHTML = isUnlocked ? '<i class="fa-solid fa-check"></i>' : `${s.pct}%`;
                }
            }
        });

        // Connecting lines
        const l1 = document.getElementById('mline-1');
        const l2 = document.getElementById('mline-2');
        const l3 = document.getElementById('mline-3');
        const l4 = document.getElementById('mline-4');

        if (l1) l1.classList.toggle('filled', totalPts >= 50);
        if (l2) l2.classList.toggle('filled', totalPts >= 200);
        if (l3) l3.classList.toggle('filled', totalPts >= 500);
        if (l4) l4.classList.toggle('filled', totalPts >= 1000);
    }

    function updateGalleryUI(totalPts) {
        const gridItems = document.querySelectorAll('.planet-grid-item');
        gridItems.forEach(item => {
            const req = parseInt(item.dataset.req, 10) || 0;
            const isUnlocked = totalPts >= req;
            const isSelected = (state.selectedPlanet === item.dataset.bg);

            item.classList.toggle('locked', !isUnlocked);
            item.classList.toggle('active', isSelected);

            const tag = item.querySelector('.gallery-tag');
            if (tag) {
                if (isUnlocked) {
                    tag.className = 'gallery-tag unlocked';
                    tag.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${getLang() === 'en' ? 'Unlocked' : '已解鎖'}`;
                } else {
                    tag.className = 'gallery-tag';
                    const diff = req - totalPts;
                    tag.innerHTML = `<i class="fa-solid fa-lock"></i> ${getLang() === 'en' ? `Need ${diff} pt` : `還差 ${diff} pt`}`;
                }
            }
        });
    }

    function checkLevelUp(stage) {
        if (typeof state.highestPlanetLevel !== 'number') {
            state.highestPlanetLevel = 0;
        }

        // Newly reached higher level
        if (stage.percent > state.highestPlanetLevel) {
            state.highestPlanetLevel = stage.percent;
            state.selectedPlanet = stage.image;
            state.selectedPlanetName = stage.name;
            saveState();

            // Fire confetti
            if (typeof confetti === 'function') {
                confetti({
                    particleCount: 100,
                    spread: 80,
                    origin: { y: 0.6 }
                });
            }

            // Show level-up celebration modal
            if (modalLevelup) {
                if (levelupImg) levelupImg.src = stage.image;
                if (levelupTitle) levelupTitle.textContent = t('levelupTitle');
                if (levelupStage) levelupStage.textContent = t(stage.levelupStageKey || `levelupStage${stage.percent}`);
                if (levelupDesc) levelupDesc.textContent = t(stage.levelupDescKey || `levelupDesc${stage.percent}`);
                if (levelupValPct) levelupValPct.textContent = `${stage.percent}%`;
                if (levelupValNext) {
                    levelupValNext.textContent = stage.nextThreshold
                        ? `${stage.nextThreshold} pt (${stage.nextThreshold === 50 ? '25%' : stage.nextThreshold === 200 ? '50%' : stage.nextThreshold === 500 ? '75%' : '100%'})`
                        : (getLang() === 'en' ? 'Fully purified!' : '已達完全淨化！');
                }
                if (btnCloseLevelup) btnCloseLevelup.textContent = t('btnCloseLevelup');
                modalLevelup.classList.add('active');
            }

            showToast(getLang() === 'en'
                ? `🎉 Planet purified to ${stage.percent}%!`
                : `🎉 恭喜！星球淨化提升至 ${stage.percent}%！`);
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
    // TASK 2: DAILY HABITS — 20-habit pool, 5 per day (date-seeded)
    // =======================================================

    // ---- Full habit pool (20 habits) ----
    const HABIT_POOL = [
        { id: 'task-cup',        nameKey: 'taskCupName',        descKey: 'taskCupDesc',        points: 10, carbon: 0.20, category: 'food'      },
        { id: 'task-bag',        nameKey: 'taskBagName',        descKey: 'taskBagDesc',        points: 15, carbon: 0.30, category: 'food'      },
        { id: 'task-utensils',   nameKey: 'taskUtensilsName',   descKey: 'taskUtensilsDesc',   points: 10, carbon: 0.15, category: 'food'      },
        { id: 'task-veg',        nameKey: 'taskVegName',        descKey: 'taskVegDesc',        points: 20, carbon: 1.50, category: 'food'      },
        { id: 'task-cleanplate', nameKey: 'taskCleanPlateName', descKey: 'taskCleanPlateDesc', points: 15, carbon: 0.40, category: 'food'      },
        { id: 'task-local',      nameKey: 'taskLocalName',      descKey: 'taskLocalDesc',      points: 15, carbon: 0.50, category: 'food'      },
        { id: 'task-transport',  nameKey: 'taskTransportName',  descKey: 'taskTransportDesc',  points: 20, carbon: 1.50, category: 'transport' },
        { id: 'task-bike',       nameKey: 'taskBikeName',       descKey: 'taskBikeDesc',       points: 20, carbon: 1.20, category: 'transport' },
        { id: 'task-walk',       nameKey: 'taskWalkName',       descKey: 'taskWalkDesc',       points: 15, carbon: 0.80, category: 'transport' },
        { id: 'task-stairs',     nameKey: 'taskStairsName',     descKey: 'taskStairsDesc',     points: 10, carbon: 0.10, category: 'home'      },
        { id: 'task-light',      nameKey: 'taskLightName',      descKey: 'taskLightDesc',      points:  5, carbon: 0.05, category: 'home'      },
        { id: 'task-unplug',     nameKey: 'taskUnplugName',     descKey: 'taskUnplugDesc',     points: 10, carbon: 0.12, category: 'home'      },
        { id: 'task-ac',         nameKey: 'taskAcName',         descKey: 'taskAcDesc',         points: 15, carbon: 0.60, category: 'home'      },
        { id: 'task-drip',       nameKey: 'taskDripName',       descKey: 'taskDripDesc',       points: 15, carbon: 0.50, category: 'home'      },
        { id: 'task-recycle',    nameKey: 'taskRecycleName',    descKey: 'taskRecycleDesc',    points: 10, carbon: 0.20, category: 'recycle'   },
        { id: 'task-nopack',     nameKey: 'taskNopackName',     descKey: 'taskNopackDesc',     points: 10, carbon: 0.15, category: 'recycle'   },
        { id: 'task-paperless',  nameKey: 'taskPaperlessName',  descKey: 'taskPaperlessDesc',  points: 10, carbon: 0.18, category: 'recycle'   },
        { id: 'task-shower',     nameKey: 'taskShowerName',     descKey: 'taskShowerDesc',     points: 10, carbon: 0.20, category: 'home'      },
        { id: 'task-coldwash',   nameKey: 'taskColdwashName',   descKey: 'taskColdwashDesc',   points: 10, carbon: 0.25, category: 'home'      },
        { id: 'task-leftover',   nameKey: 'taskLeftoverName',   descKey: 'taskLeftoverDesc',   points: 15, carbon: 0.35, category: 'food'      },
    ];

    // ---- Seeded PRNG (mulberry32) ----
    function seededRandom(seed) {
        return function () {
            seed |= 0; seed = seed + 0x6D2B79F5 | 0;
            let t2 = Math.imul(seed ^ seed >>> 15, 1 | seed);
            t2 = t2 + Math.imul(t2 ^ t2 >>> 7, 61 | t2) ^ t2;
            return ((t2 ^ t2 >>> 14) >>> 0) / 4294967296;
        };
    }

    // ---- Pick 5 habits for today using date as seed ----
    function getTodayHabits() {
        const dateSeed = parseInt(today.replace(/-/g, ''), 10);
        const rand = seededRandom(dateSeed);
        const pool = [...HABIT_POOL];
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(rand() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        return pool.slice(0, 5);
    }

    // ---- Render today's 5 habits into #task-list ----
    let todayHabits = getTodayHabits();

    function renderHabits() {
        const taskList = document.getElementById('task-list');
        if (!taskList) return;
        taskList.innerHTML = '';
        todayHabits.forEach(habit => {
            const cbId = `cb-${habit.id}`;
            const isChecked = !!state.dailyTasks[habit.id];
            const isDisabled = !!state.settled;
            const label = document.createElement('label');
            label.className = 'task-item';
            label.setAttribute('for', cbId);
            label.innerHTML = `
                <input type="checkbox" id="${cbId}" class="task-checkbox"
                    data-task-id="${habit.id}"
                    data-points="${habit.points}"
                    data-carbon="${habit.carbon}"
                    ${isChecked ? 'checked' : ''}
                    ${isDisabled ? 'disabled' : ''}>
                <span class="cb-visual"><i class="fa-solid fa-leaf"></i></span>
                <span class="task-info">
                    <span class="task-name">${t(habit.nameKey)}</span>
                    <span class="task-desc">${t(habit.descKey)}</span>
                </span>
                <span class="task-pts">+${habit.points}</span>
            `;
            taskList.appendChild(label);
            const cb = label.querySelector('input[type="checkbox"]');
            cb.addEventListener('change', () => {
                if (cb.checked) {
                    state.dailyTasks[habit.id] = true;
                    state.totalPoints += habit.points;
                    showToast(`+${habit.points} Pts`);
                } else {
                    state.dailyTasks[habit.id] = false;
                    state.totalPoints -= habit.points;
                }
                recalcHabitsCarbon();
                updateRing();
                saveState();
            });
        });
    }

    function initHabits() {
        renderHabits();
        recalcHabitsCarbon();
    }

    function recalcHabitsCarbon() {
        let total = 0;
        document.querySelectorAll('.task-checkbox').forEach(cb => {
            if (cb.checked) total += parseFloat(cb.dataset.carbon) || 0;
        });
        state.habitsCarbon = total;
    }

    // =======================================================
    // PLANET GALLERY MODAL & LEVEL-UP MODAL LISTENERS
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

    // Gallery item selection
    const planetGridItems = document.querySelectorAll('.planet-grid-item');
    planetGridItems.forEach(item => {
        item.addEventListener('click', () => {
            const req = parseInt(item.dataset.req, 10) || 0;
            const totalPts = getTotalAccumulatedPoints();

            if (totalPts < req) {
                const diff = req - totalPts;
                showToast(getLang() === 'en' ? `🔒 Need ${diff} more Pts to unlock this stage!` : `🔒 還差 ${diff} Pts 才能解鎖此階段！請繼續加油！`);
                return;
            }

            planetGridItems.forEach(g => g.classList.remove('active'));
            item.classList.add('active');

            const bg = item.dataset.bg;
            const name = item.dataset.name;

            planetImg.src = bg;
            planetName.textContent = name;
            state.selectedPlanet = bg;
            state.selectedPlanetName = name;
            saveState();

            showToast(t('toastGallery', { name }));
            setTimeout(() => modalGallery.classList.remove('active'), 250);
        });
    });

    // Milestone steps click to open gallery
    document.querySelectorAll('.milestone-step').forEach(step => {
        step.addEventListener('click', () => {
            modalGallery.classList.add('active');
        });
    });

    // Close Level-Up modal
    if (btnCloseLevelup) {
        btnCloseLevelup.addEventListener('click', () => {
            modalLevelup.classList.remove('active');
        });
    }
    if (modalLevelup) {
        modalLevelup.addEventListener('click', (e) => {
            if (e.target === modalLevelup) modalLevelup.classList.remove('active');
        });
    }

    // =======================================================
    // TASK 1: CAMERA CHECK-IN (AI-Powered Plate Analysis)
    // =======================================================
    const AI_API_KEY = 'sk-rHD8mO4GyRQSDyHur7LcpfOy25Ug7GjC2f8vsOiWPLY31R0S';
    const AI_API_URL = 'https://api.relayrouter.ai/v1/chat/completions';

    const aiOverlay = document.getElementById('ai-analyzing-overlay');
    const aiResultPanel = document.getElementById('ai-result-panel');
    const aiResultIcon = document.getElementById('ai-result-icon');
    const aiResultVerdict = document.getElementById('ai-result-verdict');
    const aiResultDetail = document.getElementById('ai-result-detail');
    const modalReject = document.getElementById('modal-ai-reject');
    const btnCloseReject = document.getElementById('btn-close-reject');
    const successAiReason = document.getElementById('success-ai-reason');
    const rejectAiReason = document.getElementById('reject-ai-reason');

    // Store the captured image base64 for sending to AI
    let capturedBase64 = null;

    btnOpenCamera.addEventListener('click', () => {
        // Reset AI result panel when opening camera
        aiResultPanel.style.display = 'none';
        aiResultPanel.classList.remove('pass', 'fail');
        cameraInput.click();
    });

    cameraInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            capturedBase64 = ev.target.result; // full data URL
            previewImg.src = capturedBase64;
            previewImg.classList.add('visible');
            previewEmpty.style.display = 'none';
            btnSubmitPhoto.disabled = false;

            // Reset any previous AI result
            aiResultPanel.style.display = 'none';
            aiResultPanel.classList.remove('pass', 'fail');
        };
        reader.readAsDataURL(file);
    });

    /**
     * Call the RelayRouter AI API with the photo for plate analysis.
     * Uses GPT vision model to determine if the plate is clean.
     * Returns { pass: boolean, reason: string }
     */
    async function analyzePhotoWithAI(imageBase64) {
        const response = await fetch(AI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `你是一個「光盤行動」減碳 App 的 AI 審核員。用戶會上傳餐盤/食物的照片，你需要判斷他們是否確實把食物吃完了（光盤）。

你必須以 JSON 格式回覆，不要輸出任何其他文字：
{
  "pass": true 或 false,
  "confidence": 0-100 的信心百分比,
  "reason": "一句話中文說明判定理由"
}

判斷標準：
- pass=true：餐盤明顯空了、食物已吃完、只剩下骨頭/果皮等不可食用部分
- pass=false：盤中明顯還有食物殘留、食物只吃了一部分、無法看出是餐盤的照片
- 如果照片模糊或無法辨識，pass=false 並在 reason 說明
- 即使盤中有少量醬料或湯汁殘留，仍可判定 pass=true`
                    },
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: '請分析這張照片，判斷餐盤中的食物是否已經吃完了？'
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: imageBase64,
                                    detail: 'low'
                                }
                            }
                        ]
                    }
                ],
                temperature: 0.3,
                max_tokens: 200
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API error ${response.status}: ${errText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';

        // Parse the JSON response from AI
        try {
            // Extract JSON from possibly markdown-wrapped response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (parseErr) {
            console.warn('AI response parse error:', parseErr, content);
        }

        // Fallback: try to detect pass/fail from text
        const lower = content.toLowerCase();
        return {
            pass: lower.includes('"pass": true') || lower.includes('"pass":true'),
            confidence: 50,
            reason: content.slice(0, 100) || 'AI 無法正確回傳結果，請重試'
        };
    }

    btnSubmitPhoto.addEventListener('click', async () => {
        if (btnSubmitPhoto.disabled || !capturedBase64) return;

        // Show loading & AI scan overlay
        btnSubmitPhoto.classList.add('loading');
        btnSubmitPhoto.disabled = true;
        aiOverlay.classList.add('active');
        aiResultPanel.style.display = 'none';

        try {
            const result = await analyzePhotoWithAI(capturedBase64);

            // Hide scan overlay
            aiOverlay.classList.remove('active');
            btnSubmitPhoto.classList.remove('loading');

            // Show AI result panel
            aiResultPanel.style.display = 'flex';
            aiResultPanel.classList.remove('pass', 'fail');

            const confidence = result.confidence || 0;
            const reason = result.reason || '無說明';

            if (result.pass) {
                // ✅ AI APPROVED
                aiResultPanel.classList.add('pass');
                aiResultIcon.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
                aiResultVerdict.textContent = t('aiPassVerdict', { conf: confidence });
                aiResultDetail.textContent = reason;

                // Reset preview after a brief delay
                setTimeout(() => {
                    previewImg.classList.remove('visible');
                    previewEmpty.style.display = '';
                    cameraInput.value = '';
                    capturedBase64 = null;
                    aiResultPanel.style.display = 'none';
                }, 2500);

                // Update state — award points
                state.cameraCarbon += CARBON_PER_PLATE;
                state.totalPoints += POINTS_PER_PLATE;
                state.cameraTasks.push({ name: t('cameraDishName'), carbon: CARBON_PER_PLATE });
                updateRing();
                saveState();

                // Show success modal with AI reason
                successAiReason.textContent = reason;
                modalSuccess.classList.add('active');

            } else {
                // ❌ AI REJECTED
                aiResultPanel.classList.add('fail');
                aiResultIcon.innerHTML = '<i class="fa-solid fa-circle-xmark"></i>';
                aiResultVerdict.textContent = t('aiFailVerdict', { conf: confidence });
                aiResultDetail.textContent = reason;

                // Show rejection modal
                rejectAiReason.textContent = reason;
                modalReject.classList.add('active');

                // Re-enable submit so user can try again
                btnSubmitPhoto.disabled = false;
            }

        } catch (err) {
            console.error('AI Analysis error:', err);
            aiOverlay.classList.remove('active');
            btnSubmitPhoto.classList.remove('loading');
            btnSubmitPhoto.disabled = false;

            showToast(t('toastAIFail'));

            // Show error in result panel
            aiResultPanel.style.display = 'flex';
            aiResultPanel.classList.remove('pass', 'fail');
            aiResultIcon.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
            aiResultVerdict.textContent = t('aiErrorVerdict');
            aiResultDetail.textContent = t('aiErrorDetail');
        }
    });

    // Close modals
    btnCloseSuccess.addEventListener('click', () => {
        modalSuccess.classList.remove('active');
    });
    modalSuccess.addEventListener('click', (e) => {
        if (e.target === modalSuccess) modalSuccess.classList.remove('active');
    });
    btnCloseReject.addEventListener('click', () => {
        modalReject.classList.remove('active');
    });
    modalReject.addEventListener('click', (e) => {
        if (e.target === modalReject) modalReject.classList.remove('active');
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
            summaryCameraDetails.innerHTML = `<div class="detail-row"><span>${t('summaryNoRecord')}</span><span>0.0 kg</span></div>`;
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
            summaryHabitsDetails.innerHTML = `<div class="detail-row"><span>${t('summaryNoRecord')}</span><span>0.0 kg</span></div>`;
        }

        // Lifetime stats (cumulative past progress saved via cookies)
        const currentDayCarbon = state.cameraCarbon + state.habitsCarbon;
        const totalLifetimeCarbon = parseFloat(((state.lifetimeCarbon || 0) + currentDayCarbon).toFixed(1));
        const totalLifetimePoints = (state.lifetimePoints || 0) + state.totalPoints;
        if (lifetimeCarbonEl) animateCounter(lifetimeCarbonEl, totalLifetimeCarbon, 1800);
        if (lifetimePtsEl) lifetimePtsEl.textContent = totalLifetimePoints;

        // Past Progress History (read from Cookies)
        if (summaryHistoryDetails) {
            summaryHistoryDetails.innerHTML = '';
            const historyList = (state.history || []);
            if (summaryHistoryCount) {
                summaryHistoryCount.textContent = t('historyDays', { n: historyList.length });
            }
            if (historyList.length === 0) {
                summaryHistoryDetails.innerHTML = `<div class="detail-row"><span>${t('summaryNoHistory')}</span><span style="font-size:12px;color:var(--text-3)">${t('summaryHistoryNote')}</span></div>`;
            } else {
                historyList.forEach(item => {
                    const statusTag = item.settled
                        ? `<span class="history-badge">${t('badgeSettled')}</span>`
                        : `<span class="history-badge" style="opacity:0.75">${t('badgeHistory')}</span>`;
                    summaryHistoryDetails.innerHTML += `
                        <div class="detail-row">
                            <span><i class="fa-regular fa-calendar-check" style="margin-right:6px;color:var(--accent)"></i>${item.date} ${statusTag}</span>
                            <span><strong>${item.carbon.toFixed(1)} kg</strong> · ${item.points} Pts</span>
                        </div>
                    `;
                });
            }
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

        // Archive today's record into past progress history
        const dayCarbon = parseFloat((state.cameraCarbon + state.habitsCarbon).toFixed(1));
        if (!Array.isArray(state.history)) state.history = [];
        const existingIdx = state.history.findIndex(h => h.date === today);
        const dayRecord = {
            date: today,
            points: state.totalPoints,
            carbon: dayCarbon,
            settled: true
        };
        if (existingIdx >= 0) {
            state.history[existingIdx] = dayRecord;
        } else {
            state.history.unshift(dayRecord);
        }
        if (state.history.length > 30) state.history = state.history.slice(0, 30);

        saveState();
        renderSummary();
        showToast('🎉 結算完成！進度已永久存入 Cookie');
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
    // AI CARBON ASSISTANT (FLOATING BOT & PRESET QUESTIONS)
    // =======================================================
    function initAiAssistant() {
        const fabBtn = document.getElementById('ai-fab-btn');
        const fabTooltip = document.getElementById('ai-fab-tooltip');
        const tooltipClose = document.getElementById('ai-tooltip-close');
        const chatPanel = document.getElementById('ai-chat-panel');
        const chatMessages = document.getElementById('ai-chat-messages');
        const chatForm = document.getElementById('ai-chat-form');
        const chatInput = document.getElementById('ai-chat-input');
        const sendBtn = document.getElementById('ai-chat-send-btn');
        const btnClose = document.getElementById('ai-chat-close');
        const btnClear = document.getElementById('ai-chat-clear');
        const presetChips = document.querySelectorAll('.ai-preset-chip');
        const assistantWrapper = document.getElementById('ai-assistant-wrapper');

        if (!fabBtn || !chatPanel) return;

        const SESSION_CHAT_KEY = 'planet_zero_ai_chat_v1';
        let chatHistory = [];
        let isGenerating = false;

        function escapeHtml(str) {
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        function formatMarkdown(text) {
            let escaped = escapeHtml(text);
            escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            
            const lines = escaped.split('\n');
            let result = '';
            let inList = false;

            for (let line of lines) {
                line = line.trim();
                if (!line) {
                    if (inList) {
                        result += '</ul>';
                        inList = false;
                    }
                    continue;
                }

                if (/^[-•*]\s+(.*)/.test(line)) {
                    if (!inList) {
                        result += '<ul>';
                        inList = true;
                    }
                    result += `<li>${line.replace(/^[-•*]\s+/, '')}</li>`;
                } else if (/^\d+\.\s+(.*)/.test(line)) {
                    if (!inList) {
                        result += '<ol>';
                        inList = true;
                    }
                    result += `<li>${line.replace(/^\d+\.\s+/, '')}</li>`;
                } else {
                    if (inList) {
                        result += '</ul>';
                        inList = false;
                    }
                    result += `<p>${line}</p>`;
                }
            }

            if (inList) result += '</ul>';
            return result || `<p>${escaped}</p>`;
        }

        function appendMessage(role, content) {
            const msgEl = document.createElement('div');
            msgEl.className = `ai-msg ${role}`;

            if (role === 'bot') {
                msgEl.innerHTML = `
                    <div class="ai-msg-avatar"><i class="fa-solid fa-robot"></i></div>
                    <div class="ai-msg-bubble">${formatMarkdown(content)}</div>
                `;
            } else {
                msgEl.innerHTML = `
                    <div class="ai-msg-bubble">${escapeHtml(content)}</div>
                `;
            }

            chatMessages.appendChild(msgEl);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        function showTypingIndicator() {
            const typingEl = document.createElement('div');
            typingEl.className = 'ai-msg bot';
            typingEl.id = 'ai-typing-indicator';
            typingEl.innerHTML = `
                <div class="ai-msg-avatar"><i class="fa-solid fa-robot"></i></div>
                <div class="ai-msg-bubble ai-typing-indicator">
                    <div class="ai-typing-dot"></div>
                    <div class="ai-typing-dot"></div>
                    <div class="ai-typing-dot"></div>
                </div>
            `;
            chatMessages.appendChild(typingEl);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        function removeTypingIndicator() {
            const typingEl = document.getElementById('ai-typing-indicator');
            if (typingEl) typingEl.remove();
        }

        function initHistory() {
            chatMessages.innerHTML = '';
            try {
                const stored = sessionStorage.getItem(SESSION_CHAT_KEY);
                if (stored) {
                    chatHistory = JSON.parse(stored);
                }
            } catch (e) {
                chatHistory = [];
            }

            if (!Array.isArray(chatHistory) || chatHistory.length === 0) {
                chatHistory = [{ role: 'assistant', content: t('aiWelcome') }];
            }

            // Expose a lightweight re-welcome function for language switching
            window._reinitAiWelcome = function () {
                chatMessages.innerHTML = '';
                chatHistory = [{ role: 'assistant', content: t('aiWelcome') }];
                chatHistory.forEach(msg => appendMessage(msg.role === 'assistant' ? 'bot' : 'user', msg.content));
            };

            chatHistory.forEach(msg => {
                appendMessage(msg.role === 'assistant' ? 'bot' : 'user', msg.content);
            });
        }

        function saveHistory() {
            try {
                const slice = chatHistory.slice(-15);
                sessionStorage.setItem(SESSION_CHAT_KEY, JSON.stringify(slice));
            } catch (e) {}
        }

        async function sendQuery(queryText) {
            const q = (queryText || '').trim();
            if (!q || isGenerating) return;

            isGenerating = true;
            chatInput.value = '';
            chatInput.disabled = true;
            sendBtn.disabled = true;
            presetChips.forEach(chip => chip.style.pointerEvents = 'none');

            appendMessage('user', q);
            chatHistory.push({ role: 'user', content: q });
            showTypingIndicator();

            const systemPrompt = t('aiSystemPrompt');

            const recentMessages = chatHistory.slice(-6).map(m => ({
                role: m.role,
                content: m.content
            }));

            try {
                const response = await fetch(AI_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${AI_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: 'gpt-4o-mini',
                        messages: [
                            { role: 'system', content: systemPrompt },
                            ...recentMessages
                        ],
                        temperature: 0.6,
                        max_tokens: 450
                    })
                });

                removeTypingIndicator();

                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }

                const data = await response.json();
                const aiReply = data?.choices?.[0]?.message?.content?.trim() || '抱歉，小助手剛剛沒有理解，能換個方式再問一次嗎？';

                appendMessage('bot', aiReply);
                chatHistory.push({ role: 'assistant', content: aiReply });
                saveHistory();

            } catch (err) {
                console.error('AI Chat Error:', err);
                removeTypingIndicator();
                const errorMsg = '抱歉，小助手剛剛網路連線有點波動 😅 請稍後再試一次，或檢查網路設定！';
                appendMessage('bot', errorMsg);
            } finally {
                isGenerating = false;
                chatInput.disabled = false;
                sendBtn.disabled = false;
                presetChips.forEach(chip => chip.style.pointerEvents = 'auto');
                chatInput.focus();
            }
        }

        function toggleChat() {
            const isOpen = chatPanel.classList.toggle('open');
            if (isOpen) {
                if (fabTooltip) fabTooltip.classList.add('hidden');
                setTimeout(() => chatInput.focus(), 300);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        }

        fabBtn.addEventListener('click', toggleChat);

        if (tooltipClose) {
            tooltipClose.addEventListener('click', (e) => {
                e.stopPropagation();
                if (fabTooltip) fabTooltip.classList.add('hidden');
            });
        }

        if (fabTooltip) {
            fabTooltip.addEventListener('click', () => {
                toggleChat();
            });
        }

        if (btnClose) {
            btnClose.addEventListener('click', () => {
                chatPanel.classList.remove('open');
            });
        }

        if (btnClear) {
            btnClear.addEventListener('click', () => {
                chatHistory = [];
                sessionStorage.removeItem(SESSION_CHAT_KEY);
                initHistory();
                showToast('已清空對話紀錄');
            });
        }

        // Close when clicking outside on document
        document.addEventListener('click', (e) => {
            if (chatPanel.classList.contains('open') && assistantWrapper && !assistantWrapper.contains(e.target)) {
                chatPanel.classList.remove('open');
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && chatPanel.classList.contains('open')) {
                chatPanel.classList.remove('open');
            }
        });

        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            sendQuery(chatInput.value);
        });

        presetChips.forEach(chip => {
            chip.addEventListener('click', () => {
                const question = chip.dataset.question;
                if (question) {
                    sendQuery(question);
                }
            });
        });

        initHistory();
    }

    // =======================================================
    // EVENTS — 近期減碳活動 (Green Lifestyle Platform)
    // =======================================================

    // ---- Fallback event data (shown when fetch fails / CORS blocked) ----
    const FALLBACK_EVENTS = [
        {
            title: '2026 綠色生活節 — 淨零行動博覽會',
            titleEn: '2026 Green Life Festival — Net Zero Action Expo',
            date: '2026-11-28 ~ 2026-11-30',
            location: '台北市信義區 · 世貿一館',
            locationEn: 'World Trade Center Hall 1, Taipei',
            category: '博覽會', categoryEn: 'Expo',
            desc: '集結百家綠色品牌與環保機構，現場體驗各種低碳生活解方，並有專題講座與互動闖關活動。',
            descEn: 'Dozens of green brands and eco organizations gather for hands-on low-carbon living experiences, talks, and interactive challenges.',
            url: 'https://greenlifestyle.moenv.gov.tw/searchEvent',
        },
        {
            title: '淨零生活 DIY 工作坊 — 自製天然清潔劑',
            titleEn: 'Net Zero DIY Workshop — Natural Cleaner Making',
            date: '2026-12-07',
            location: '新北市板橋區 · 板橋環保教育館',
            locationEn: 'Banqiao Environmental Education Center, New Taipei',
            category: '工作坊', categoryEn: 'Workshop',
            desc: '學習用小蘇打、檸檬酸等天然材料製作清潔劑，減少化學品與塑膠瓶廢棄物。',
            descEn: 'Learn to make eco-friendly cleaners using baking soda and citric acid — cut chemical waste and plastic bottles.',
            url: 'https://greenlifestyle.moenv.gov.tw/searchEvent',
        },
        {
            title: '社區低碳行動論壇 — 綠色通勤與公共運輸',
            titleEn: 'Community Low-Carbon Forum — Green Commuting & Transit',
            date: '2026-12-14',
            location: '台中市西屯區 · 台中市政府',
            locationEn: 'Taichung City Government, Xitun District',
            category: '論壇', categoryEn: 'Forum',
            desc: '邀請專家分享各城市綠色通勤政策成果，並與市民共討未來低碳交通規劃。',
            descEn: 'Experts share green commuting policy outcomes and co-discuss future low-carbon transport plans with citizens.',
            url: 'https://greenlifestyle.moenv.gov.tw/searchEvent',
        },
        {
            title: '校園淨零挑戰賽 — 減碳創意提案競賽',
            titleEn: 'Campus Net Zero Challenge — Carbon Reduction Pitch',
            date: '2026-12-20 ~ 2026-12-21',
            location: '全台大專院校（線上 + 實體）',
            locationEn: 'Nationwide Universities (Online + In-person)',
            category: '競賽', categoryEn: 'Competition',
            desc: '大學生組隊提出校園減碳創意方案，優勝隊伍獲得環境部綠色認證及獎金。',
            descEn: 'University teams pitch creative campus carbon-reduction ideas for environmental ministry certification and prizes.',
            url: 'https://greenlifestyle.moenv.gov.tw/searchEvent',
        },
        {
            title: '海岸淨灘暨生態導覽活動',
            titleEn: 'Coastal Cleanup & Ecology Tour',
            date: '2026-12-28',
            location: '宜蘭縣南澳鄉 · 南澳海灘',
            locationEn: 'Nan-ao Beach, Yilan County',
            category: '戶外活動', categoryEn: 'Outdoor',
            desc: '結合淨灘與生態導覽，了解海洋垃圾對碳循環的影響，共同守護海洋生態。',
            descEn: 'Combine beach cleanup with ecology tours to understand marine litter\'s impact on carbon cycles and protect the ocean.',
            url: 'https://greenlifestyle.moenv.gov.tw/searchEvent',
        },
        {
            title: '綠色採購體驗日 — 認識環保標章商品',
            titleEn: 'Green Purchasing Day — Eco Label Products',
            date: '2027-01-11',
            location: '高雄市苓雅區 · 夢時代廣場',
            locationEn: 'Dream Mall, Lingya District, Kaohsiung',
            category: '體驗活動', categoryEn: 'Experience',
            desc: '現場展示具有環保標章的日常用品，並提供綠色採購指南與兌換優惠活動。',
            descEn: 'Showcasing eco-label everyday products with a green purchasing guide and exclusive discounts.',
            url: 'https://greenlifestyle.moenv.gov.tw/searchEvent',
        },
    ];

    // ---- CORS proxy options (tried in order until one succeeds) ----
    const PROXY_URLS = [
        url => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
        url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    ];
    const TARGET_URL = 'https://greenlifestyle.moenv.gov.tw/searchEvent';
    const EVENTS_CACHE_KEY = 'pz_events_cache';
    const EVENTS_CACHE_TTL = 3 * 60 * 60 * 1000; // 3 hours

    // ---- Try to parse events from raw HTML ----
    function parseEventsFromHTML(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const results = [];

        // Try common card selectors the platform might use
        const selectors = ['.event-item', '.activity-item', '.card', '[class*="event"]', 'article'];
        let cards = [];
        for (const sel of selectors) {
            cards = Array.from(doc.querySelectorAll(sel));
            if (cards.length > 2) break;
        }

        cards.slice(0, 8).forEach(card => {
            const titleEl = card.querySelector('h2,h3,h4,[class*="title"],[class*="name"]');
            const dateEl = card.querySelector('[class*="date"],[class*="time"],time');
            const descEl = card.querySelector('p,[class*="desc"],[class*="intro"]');
            const linkEl = card.querySelector('a[href]');
            if (!titleEl) return;

            const href = linkEl?.getAttribute('href') || TARGET_URL;
            results.push({
                title: titleEl.textContent.trim(),
                titleEn: titleEl.textContent.trim(),
                date: dateEl?.textContent.trim() || '',
                location: '', locationEn: '',
                category: '活動', categoryEn: 'Event',
                desc: descEl?.textContent.trim() || '',
                descEn: descEl?.textContent.trim() || '',
                url: href.startsWith('http') ? href : `https://greenlifestyle.moenv.gov.tw${href}`,
            });
        });
        return results;
    }

    // ---- Fetch with proxy ----
    async function fetchEvents() {
        // Check cache first
        try {
            const cached = JSON.parse(localStorage.getItem(EVENTS_CACHE_KEY) || 'null');
            if (cached && Date.now() - cached.ts < EVENTS_CACHE_TTL && cached.data?.length > 0) {
                return { data: cached.data, source: 'cache' };
            }
        } catch (e) {}

        for (const makeUrl of PROXY_URLS) {
            try {
                const proxyUrl = makeUrl(TARGET_URL);
                const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });
                if (!res.ok) continue;
                const json = await res.json();
                const html = json.contents || json.body || '';
                if (!html) continue;
                const events = parseEventsFromHTML(html);
                if (events.length > 0) {
                    localStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: events }));
                    return { data: events, source: 'live' };
                }
            } catch (e) { /* try next proxy */ }
        }
        return { data: null, source: 'fallback' };
    }

    // ---- Render a single event card ----
    function renderEventCard(ev) {
        const lang = getLang();
        const title = (lang === 'en' && ev.titleEn) ? ev.titleEn : ev.title;
        const desc = (lang === 'en' && ev.descEn) ? ev.descEn : ev.desc;
        const location = (lang === 'en' && ev.locationEn) ? ev.locationEn : ev.location;
        const category = (lang === 'en' && ev.categoryEn) ? ev.categoryEn : ev.category;

        const card = document.createElement('div');
        card.className = 'event-card';
        card.innerHTML = `
            <div class="event-card-header">
                <span class="event-category-badge">${category}</span>
                ${ev.date ? `<span class="event-date"><i class="fa-regular fa-calendar"></i> ${ev.date}</span>` : ''}
            </div>
            <h4 class="event-title">${title}</h4>
            ${location ? `<p class="event-location"><i class="fa-solid fa-location-dot"></i> ${location}</p>` : ''}
            ${desc ? `<p class="event-desc">${desc}</p>` : ''}
            <a href="${ev.url}" target="_blank" rel="noopener noreferrer" class="btn-pill primary event-goto-btn">
                <i class="fa-solid fa-arrow-up-right-from-square"></i>
                <span data-i18n="eventsGotoBtn">${lang === 'en' ? 'View Event' : '前往活動頁面'}</span>
            </a>
        `;
        return card;
    }

    // ---- Main init ----
    function initEvents() {
        const viewEl = document.getElementById('view-events');
        if (!viewEl) return;

        // Load events when the view is first activated
        let loaded = false;
        const observer = new MutationObserver(() => {
            if (viewEl.classList.contains('active') && !loaded) {
                loaded = true;
                loadAndRenderEvents();
            }
        });
        observer.observe(viewEl, { attributes: true, attributeFilter: ['class'] });

        // Also handle direct nav click
        const navBtn = document.querySelector('[data-target="view-events"]');
        if (navBtn) {
            navBtn.addEventListener('click', () => {
                if (!loaded) { loaded = true; loadAndRenderEvents(); }
            });
        }
    }

    async function loadAndRenderEvents() {
        const listEl = document.getElementById('events-list');
        const loadingEl = document.getElementById('events-loading');
        const fallbackNoticeEl = document.getElementById('events-fallback-notice');
        if (!listEl) return;

        loadingEl?.style && (loadingEl.style.display = 'flex');
        fallbackNoticeEl && (fallbackNoticeEl.style.display = 'none');
        listEl.innerHTML = '';

        const { data, source } = await fetchEvents();
        loadingEl?.style && (loadingEl.style.display = 'none');

        const events = data && data.length > 0 ? data : FALLBACK_EVENTS;
        const usedFallback = !data || data.length === 0;

        if (usedFallback && fallbackNoticeEl) {
            fallbackNoticeEl.style.display = 'flex';
        }

        events.forEach(ev => listEl.appendChild(renderEventCard(ev)));
    }

    // =======================================================
    // INITIALIZATION
    // =======================================================
    initLangToggle();
    applyTranslations();
    initHabits();
    updateRing();
    saveState();
    initAiAssistant();
    initEvents();

    // If settled, lock controls (habits are already rendered disabled via renderHabits)
    if (state.settled) {
        document.querySelectorAll('.task-checkbox').forEach(cb => cb.disabled = true);
        btnSubmitPhoto.disabled = true;
        btnOpenCamera.disabled = true;
    }

});

