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
    const planetGridItems = document.querySelectorAll('.planet-grid-item');
    const modalSuccess = document.getElementById('modal-success-feedback');
    const btnCloseSuccess = document.querySelector('.btn-close-success');

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
            selectedPlanet: 'assets/planet_earth.png',
            selectedPlanetName: '蔚藍地球',
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
            statusEl.textContent = `已同步至 Cookie (${timeStr})`;
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
                aiResultVerdict.textContent = `✅ 通過！信心度 ${confidence}%`;
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
                state.cameraTasks.push({ name: '餐盤光光 (AI驗證)', carbon: CARBON_PER_PLATE });
                updateRing();
                saveState();

                // Show success modal with AI reason
                successAiReason.textContent = reason;
                modalSuccess.classList.add('active');

            } else {
                // ❌ AI REJECTED
                aiResultPanel.classList.add('fail');
                aiResultIcon.innerHTML = '<i class="fa-solid fa-circle-xmark"></i>';
                aiResultVerdict.textContent = `❌ 未通過 — 信心度 ${confidence}%`;
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

            showToast('⚠️ AI 分析失敗，請稍後重試');

            // Show error in result panel
            aiResultPanel.style.display = 'flex';
            aiResultPanel.classList.remove('pass', 'fail');
            aiResultIcon.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
            aiResultVerdict.textContent = '⚠️ 連線錯誤';
            aiResultDetail.textContent = err.message || '無法連接 AI 服務，請檢查網路後重試';
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
                summaryHistoryCount.textContent = `${historyList.length} 天紀錄`;
            }
            if (historyList.length === 0) {
                summaryHistoryDetails.innerHTML = '<div class="detail-row"><span>尚無歷史紀錄</span><span style="font-size:12px;color:var(--text-3)">完成結算後自動寫入 Cookie</span></div>';
            } else {
                historyList.forEach(item => {
                    const statusTag = item.settled
                        ? '<span class="history-badge">已結算</span>'
                        : '<span class="history-badge" style="opacity:0.75">歷史記錄</span>';
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
