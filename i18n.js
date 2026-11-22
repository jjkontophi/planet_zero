/* ==========================================================
   PLANET ZERO — Internationalization (i18n) Module
   Supports: zh-TW (Traditional Chinese), en (English)
   ========================================================== */

const LANG_KEY = 'pz_lang';

const translations = {
    'zh-TW': {
        // Page title
        pageTitle: 'Planet Zero — 每日減碳行動追蹤',

        // Sidebar nav
        navPlanet: '星球培育',
        navCamera: '光盤打卡',
        navSummary: '零碳結算',
        toggleTheme: '切換主題',

        // Home view
        stageBadge: '清理程度 0% · 初始荒蕪',
        progressNextTip25: '🌱 距離 25% 升級還需 {pts} Pts',
        progressNextTip50: '🌿 距離 50% 升級還需 {pts} Pts',
        progressNextTip75: '🌳 距離 75% 升級還需 {pts} Pts',
        progressNextTip100: '🌟 距離 100% 升級還需 {pts} Pts',
        progressNextTipMax: '🏆 已達最高清潔度！',
        btnExplore: '淨化階段圖鑑',
        dailyHabitsTitle: '🌿 今日綠色習慣',

        // Task names (original 5)
        taskCupName: '自備環保杯',
        taskCupDesc: '減少一次性紙杯使用',
        taskBagName: '使用環保袋',
        taskBagDesc: '購物自備環保袋',
        taskTransportName: '搭乘大眾運輸',
        taskTransportDesc: '選擇公車或捷運出行',
        taskStairsName: '爬樓梯取代電梯',
        taskStairsDesc: '節能減碳從小事做起',
        taskLightName: '隨手關燈省電',
        taskLightDesc: '離開房間即關閉電源',

        // Task names (new 15 — total pool = 20)
        taskUtensilsName: '自備環保餐具',
        taskUtensilsDesc: '外食少用免洗筷和塑膠湯匙',
        taskVegName: '多吃蔬食少吃肉',
        taskVegDesc: '減少畜牧產生的碳排放',
        taskCleanPlateName: '把飯菜吃光光',
        taskCleanPlateDesc: '吃多少點多少，不浪費食物',
        taskLocalName: '買當季在地食材',
        taskLocalDesc: '減少長途運送與冷藏耗電',
        taskBikeName: '騎腳踏車或 YouBike',
        taskBikeDesc: '短程代步零碳排又健康',
        taskWalkName: '走路代替騎車開車',
        taskWalkDesc: '近距離移動用雙腳最環保',
        taskUnplugName: '拔掉沒在用的插頭',
        taskUnplugDesc: '減少電器待機偷偷耗電',
        taskAcName: '冷氣調成 26–28 度',
        taskAcDesc: '涼爽省電又減少碳排放',
        taskDripName: '衣服自然曬乾少用烘衣機',
        taskDripDesc: '減少高耗電家電使用',
        taskRecycleName: '確實做好垃圾分類',
        taskRecycleDesc: '讓資源回收順利再利用',
        taskNopackName: '挑選沒有過度包裝的商品',
        taskNopackDesc: '少拿塑膠袋和多餘紙盒',
        taskPaperlessName: '用手機看電子檔少列印',
        taskPaperlessDesc: '省紙張也省印表機耗電',
        taskShowerName: '縮短淋浴時間',
        taskShowerDesc: '每少一分鐘省約 10 升熱水',
        taskColdwashName: '衣物用冷水洗滌',
        taskColdwashDesc: '冷水洗衣省去加熱耗電',
        taskLeftoverName: '剩菜打包帶回家',
        taskLeftoverDesc: '減少廚餘，讓食物不浪費',

        // Camera view
        previewEmptyText: '拍攝空盤以獲取能量',
        cameraTitle: '📸 光盤行動',
        aiAnalyzing: 'AI 辨識分析中…',
        aiResultVerdict: '分析中…',
        btnOpenCamera: '開啟相機',
        btnAISubmit: 'AI 審核上傳',

        // Summary view
        summaryTitle: '📊 零碳總結',
        statLabel: '今日減碳總量',
        lifetimeCarbonLabel: '歷程累計減碳',
        lifetimePtsLabel: '歷程累計點數',
        cookieStatus: 'Cookie 已儲存歷史進度',
        cookieSynced: '進度已自動同步',
        accCamera: '光盤行動',
        accHabits: '習慣養成',
        accHistory: '過去紀錄 (Cookie 儲存)',
        noRecord: '尚無紀錄',
        noHistory: '尚無歷史紀錄',
        historyAfterSettle: '結算後存入',
        historyDays: '{n} 天紀錄',
        btnCheckout: '確認結算，注入星球能量',
        shareLabel: '分享你的環保成就！',

        // Bottom nav
        bnavCamera: '光盤打卡',
        bnavSummary: '零碳結算',
        bnavEvents: '近期活動',

        // Sidebar nav
        navEvents: '近期活動',

        // Events view
        eventsTitle: '📅 近期減碳活動',
        eventsPlatformName: '淨零綠生活資訊平台',
        eventsPlatformSub: '環境部官方減碳活動資訊',
        eventsBrowseAll: '瀏覽全部活動',
        eventsLoading: '載入活動中…',
        eventsFallbackNotice: '顯示備援活動資料，點擊「瀏覽全部活動」可查看最新內容',
        eventsGotoBtn: '前往活動頁面',
        eventsFooterBtn: '前往淨零綠生活資訊平台',

        // Gallery modal
        galleryTitle: '🪐 星球淨化階段圖鑑',
        gallerySub: '累積減碳點數以淨化星球，共 5 個進化階段',
        galleryTag0: '初始',
        galleryStage0: '0% 荒蕪污染',
        galleryPts0: '0 Pts 解鎖',
        galleryStage25: '25% 微光復甦',
        galleryPts25: '50 Pts 解鎖',
        galleryNeed25: '需 50 pt',
        galleryStage50: '50% 生機萌發',
        galleryPts50: '200 Pts 解鎖',
        galleryNeed50: '需 200 pt',
        galleryStage75: '75% 綠意盎然',
        galleryPts75: '500 Pts 解鎖',
        galleryNeed75: '需 500 pt',
        galleryStage100: '100% 璀璨零碳星',
        galleryPts100: '1000 Pts 解鎖',
        galleryNeed100: '需 1000 pt',

        // Level-up modal
        levelupTitle: '🎉 星球淨化升級！',
        levelupStage25: '清理程度已提升至 25%',
        levelupStage50: '清理程度已提升至 50%',
        levelupStage75: '清理程度已提升至 75%',
        levelupStage100: '清理程度已提升至 100%',
        levelupDesc25: '大氣層透出第一線微光，地表污染正在消退！感謝您的減碳行動！',
        levelupDesc50: '大地開始萌生綠意，生態系統逐步恢復！繼續加油！',
        levelupDesc75: '星球已是一片翠綠，繁盛的生命重返大地！',
        levelupDesc100: '🌟 恭喜！璀璨零碳星誕生，宇宙因你而更美麗！',
        lmLabelPct: '當前清理程度',
        lmLabelNext: '下一階段目標',
        btnCloseLevelup: '太棒了，繼續守護星球！',

        // Success modal
        successTitle: '🤖 AI 審核通過！',
        successReason: 'AI 確認您的餐盤已清空',
        fbLabelCarbon: '減碳量',
        fbLabelPts: '獲得點數',
        btnContinue: '繼續探索',

        // Reject modal
        rejectTitle: '❌ AI 審核未通過',
        rejectReason: 'AI 判定餐盤中仍有剩餘食物',
        rejectTipsTitle: '小提示',
        rejectTip1: '請確保食物已完全吃完',
        rejectTip2: '拍攝時請將餐盤置中',
        rejectTip3: '確保光線充足、畫面清晰',
        btnRetake: '重新拍照',

        // AI Assistant
        aiTooltip: '有減碳疑問？點我問 AI 助手！',
        aiChatTitle: 'Planet Zero 減碳小助手',
        aiChatSub: '在線解答 · 零碳生活顧問',
        aiClearTitle: '清空對話紀錄',
        aiCloseTitle: '收起小助手',
        aiPresetHeader: '推薦減碳提問：',
        aiPlaceholder: '問問減碳、光盤或綠色生活問題...',
        aiChip1: '🥗 吃素一天減多少碳？',
        aiChip1Q: '吃素一天可以減少多少碳排放？',
        aiChip2: '🍱 光盤行動為什麼能減碳？',
        aiChip2Q: '光盤行動對減緩氣候暖化有什麼具體幫助？',
        aiChip3: '💡 日常減碳小妙招',
        aiChip3Q: '日常生活中大家最容易做到的零碳生活妙招有哪些？',
        aiChip4: '⚡ 剩食對氣候的衝擊',
        aiChip4Q: '食物浪費造成的全球碳排放有多嚴重？',
        aiChip5: '🥤 自備環保杯餐具效益',
        aiChip5Q: '自備環保杯與環保餐具有哪些實質減碳效益？',
        aiChip6: '🪐 Planet Zero 升級攻略',
        aiChip6Q: '如何在 Planet Zero 最快提升綠化進度並升級星球？',
        aiWelcome: '👋 您好！我是 **Planet Zero 減碳小助手** 🌱\n\n有任何關於日常減碳、光盤行動或綠色生活的疑問，都可以隨時問我喔！\n\n您可以點擊下方的**推薦減碳提問**，或直接輸入任何問題向我提問 ✨',
        aiClearedToast: '已清空對話紀錄',
        aiErrorMsg: '抱歉，小助手剛剛網路連線有點波動 😅 請稍後再試一次，或檢查網路設定！',
        aiSystemPrompt: `你是一位熱情、專業且友善的「Planet Zero 減碳環保小助手」，專門為用戶解答與日常生活減碳、光盤行動（吃完不浪費）、碳足跡計算、蔬食環保、能源節約與綠色生活相關的問題。

回覆風格與規則：
1. 親切友善、鼓勵性強，適當使用 emoji（🌱、🥗、🌍、💡、✨）。
2. 回答務求具體實用、數據精確（例如：吃一餐素約可減碳 1.5 公斤；生產 1 公斤牛肉約排放 27 公斤 CO2 等；剩食占全球溫室氣體 8-10%）。
3. 條理分明，善用粗體關鍵字與列點排版，長度控制在 150~250 字內，讓手機與桌面端閱讀舒適。
4. 結合 Planet Zero 理念，鼓勵用戶完成每日減碳打卡、拍照光盤來培育個人專屬星球！
5. 熟知 Planet Zero 的星球淨化升級機制：初始為 0% 荒蕪狀態，累積達 50 pt 升級為 25% (微光復甦)、200 pt 升級為 50% (生機萌發)、500 pt 升級為 75% (繁盛綠洲)、1000 pt 升級為 100% (璀璨零碳星)。若用戶詢問升級方法，請熱情說明這些門檻與集點技巧！`,

        // Toast messages
        toastGallery: '已切換星球外觀至：{name}',
        toastCheckout: '🎉 結算完成！進度已永久存入 Cookie',
        toastCopied: '已複製到剪貼簿！',
        toastAIFail: '⚠️ AI 分析失敗，請稍後重試',

        // AI result panel
        aiPassVerdict: '✅ 通過！信心度 {conf}%',
        aiFailVerdict: '❌ 未通過 — 信心度 {conf}%',
        aiErrorVerdict: '⚠️ 連線錯誤',
        aiErrorDetail: '無法連接 AI 服務，請檢查網路後重試',

        // History badges
        badgeSettled: '已結算',
        badgeHistory: '歷史記錄',

        // Summary dynamic
        summaryNoRecord: '尚無紀錄',
        summaryNoHistory: '尚無歷史紀錄',
        summaryHistoryNote: '完成結算後自動寫入 Cookie',

        // Camera task name in state
        cameraDishName: '餐盤光光 (AI驗證)',

        // Share
        shareTitle: 'Planet Zero 減碳成果',
        shareText: '🌍 我今天透過 Planet Zero 減少了 {total} kg CO₂e 的碳排放！一起加入環保行列吧！',

        // Planet names
        planet0: '荒蕪星球 (0%)',
        planet25: '微光星球 (25%)',
        planet50: '萌發星球 (50%)',
        planet75: '繁盛綠洲 (75%)',
        planet100: '璀璨零碳星 (100%)',

        // Progress tips
        stageName0: '清理程度 0% · 初始荒蕪',
        stageName25: '清理程度 25% · 微光復甦',
        stageName50: '清理程度 50% · 生機萌發',
        stageName75: '清理程度 75% · 繁盛綠洲',
        stageName100: '清理程度 100% · 璀璨零碳星',

        // Lang toggle label
        langLabel: '語言',
    },

    'en': {
        pageTitle: 'Planet Zero — Daily Carbon Reduction Tracker',

        navPlanet: 'My Planet',
        navCamera: 'Clean Plate',
        navSummary: 'Zero Carbon',
        toggleTheme: 'Toggle Theme',

        stageBadge: '0% Clean · Barren Start',
        progressNextTip25: '🌱 Need {pts} Pts to reach 25%',
        progressNextTip50: '🌿 Need {pts} Pts to reach 50%',
        progressNextTip75: '🌳 Need {pts} Pts to reach 75%',
        progressNextTip100: '🌟 Need {pts} Pts to reach 100%',
        progressNextTipMax: '🏆 Max purification reached!',
        btnExplore: 'Planet Stage Gallery',
        dailyHabitsTitle: '🌿 Today\'s Green Habits',

        taskCupName: 'Bring a Reusable Cup',
        taskCupDesc: 'Avoid single-use paper cups',
        taskBagName: 'Use a Reusable Bag',
        taskBagDesc: 'Bring your own bag when shopping',
        taskTransportName: 'Take Public Transit',
        taskTransportDesc: 'Choose bus or metro over driving',
        taskStairsName: 'Take the Stairs',
        taskStairsDesc: 'Save energy, skip the elevator',
        taskLightName: 'Turn Off Lights',
        taskLightDesc: 'Switch off when leaving the room',

        // New habits (EN) — pool of 20
        taskUtensilsName: 'Bring Reusable Utensils',
        taskUtensilsDesc: 'Skip disposable chopsticks & plastic spoons',
        taskVegName: 'Eat More Plants, Less Meat',
        taskVegDesc: 'Cut carbon from livestock farming',
        taskCleanPlateName: 'Finish Every Bite',
        taskCleanPlateDesc: 'Order only what you can eat — zero food waste',
        taskLocalName: 'Buy Seasonal & Local Food',
        taskLocalDesc: 'Cut transport miles and cold-chain energy use',
        taskBikeName: 'Ride a Bike or YouBike',
        taskBikeDesc: 'Zero-emission short trips — good for you too!',
        taskWalkName: 'Walk Instead of Driving',
        taskWalkDesc: 'The greenest way to travel short distances',
        taskUnplugName: 'Unplug Idle Electronics',
        taskUnplugDesc: 'Stop standby power drain when not in use',
        taskAcName: 'Set AC to 26–28 °C',
        taskAcDesc: 'Stay cool and reduce your carbon footprint',
        taskDripName: 'Air-Dry Clothes',
        taskDripDesc: 'Skip the dryer and save high-energy appliance use',
        taskRecycleName: 'Sort Waste Correctly',
        taskRecycleDesc: 'Help recyclables find their second life',
        taskNopackName: 'Choose Minimal Packaging',
        taskNopackDesc: 'Avoid excess plastic bags and cardboard boxes',
        taskPaperlessName: 'Go Paperless',
        taskPaperlessDesc: 'Read on your phone instead of printing',
        taskShowerName: 'Take a Shorter Shower',
        taskShowerDesc: 'Each minute saved = ~10 L of hot water',
        taskColdwashName: 'Wash Clothes in Cold Water',
        taskColdwashDesc: 'Cold cycles skip the heating energy cost',
        taskLeftoverName: 'Take Leftovers Home',
        taskLeftoverDesc: 'Pack up unfinished food — reduce kitchen waste',

        cameraTitle: '📸 Clean Plate Action',
        previewEmptyText: 'Take a photo of your clean plate to earn energy',
        aiAnalyzing: 'AI analyzing photo…',
        aiResultVerdict: 'Analyzing…',
        btnOpenCamera: 'Open Camera',
        btnAISubmit: 'AI Review & Submit',

        summaryTitle: '📊 Zero Carbon Summary',
        statLabel: 'Today\'s Total Carbon Saved',
        lifetimeCarbonLabel: 'Lifetime Carbon Saved',
        lifetimePtsLabel: 'Lifetime Points Earned',
        cookieStatus: 'Cookie progress saved',
        cookieSynced: 'Auto-synced',
        accCamera: 'Clean Plate Action',
        accHabits: 'Habit Building',
        accHistory: 'Past Records (Cookie)',
        noRecord: 'No records yet',
        noHistory: 'No history yet',
        historyAfterSettle: 'Added after checkout',
        historyDays: '{n} day(s)',
        btnCheckout: 'Confirm & Power Up Your Planet',
        shareLabel: 'Share your eco achievement!',

        bnavCamera: 'Clean Plate',
        bnavSummary: 'Zero Carbon',
        bnavEvents: 'Events',

        navEvents: 'Events',

        // Events view
        eventsTitle: '📅 Green Events',
        eventsPlatformName: 'Net Zero Green Lifestyle Platform',
        eventsPlatformSub: "Taiwan EPA's official eco events portal",
        eventsBrowseAll: 'Browse All Events',
        eventsLoading: 'Loading events…',
        eventsFallbackNotice: 'Showing sample events — click "Browse All Events" for the latest.',
        eventsGotoBtn: 'View Event',
        eventsFooterBtn: 'Visit Net Zero Green Lifestyle Platform',

        galleryTitle: '🪐 Planet Purification Gallery',
        gallerySub: 'Earn carbon points to purify your planet — 5 evolution stages',
        galleryTag0: 'Start',
        galleryStage0: '0% Barren Wasteland',
        galleryPts0: 'Unlocked at 0 Pts',
        galleryStage25: '25% First Light',
        galleryPts25: 'Unlocked at 50 Pts',
        galleryNeed25: 'Need 50 pt',
        galleryStage50: '50% Life Sprouting',
        galleryPts50: 'Unlocked at 200 Pts',
        galleryNeed50: 'Need 200 pt',
        galleryStage75: '75% Lush Oasis',
        galleryPts75: 'Unlocked at 500 Pts',
        galleryNeed75: 'Need 500 pt',
        galleryStage100: '100% Zero Carbon Star',
        galleryPts100: 'Unlocked at 1000 Pts',
        galleryNeed100: 'Need 1000 pt',

        levelupTitle: '🎉 Planet Purified — Level Up!',
        levelupStage25: 'Purification upgraded to 25%',
        levelupStage50: 'Purification upgraded to 50%',
        levelupStage75: 'Purification upgraded to 75%',
        levelupStage100: 'Purification upgraded to 100%',
        levelupDesc25: 'The first rays of light break through the atmosphere — pollution is fading! Thank you for your actions!',
        levelupDesc50: 'Green shoots emerge on the surface as the ecosystem begins to recover!',
        levelupDesc75: 'The planet is lush and green — life has returned in full force!',
        levelupDesc100: '🌟 Congratulations! The Zero Carbon Star is born — the universe shines brighter because of you!',
        lmLabelPct: 'Current Purification',
        lmLabelNext: 'Next Stage Goal',
        btnCloseLevelup: 'Awesome, keep protecting the planet!',

        successTitle: '🤖 AI Approved!',
        successReason: 'AI confirmed your plate is clean',
        fbLabelCarbon: 'Carbon Saved',
        fbLabelPts: 'Points Earned',
        btnContinue: 'Keep Exploring',

        rejectTitle: '❌ AI Review Failed',
        rejectReason: 'AI detected food remaining on the plate',
        rejectTipsTitle: 'Tips',
        rejectTip1: 'Make sure all food is fully eaten',
        rejectTip2: 'Center the plate in the frame',
        rejectTip3: 'Ensure good lighting and a clear shot',
        btnRetake: 'Retake Photo',

        aiTooltip: 'Got carbon questions? Ask the AI Assistant!',
        aiChatTitle: 'Planet Zero Eco Assistant',
        aiChatSub: 'Live Answers · Zero-Carbon Lifestyle Advisor',
        aiClearTitle: 'Clear chat history',
        aiCloseTitle: 'Close assistant',
        aiPresetHeader: 'Suggested questions:',
        aiPlaceholder: 'Ask about carbon, clean plates, green living...',
        aiChip1: '🥗 How much carbon does a veggie day save?',
        aiChip1Q: 'How much carbon emission can one vegetarian day reduce?',
        aiChip2: '🍱 Why does clean plate reduce carbon?',
        aiChip2Q: 'How does the clean plate action concretely help slow climate change?',
        aiChip3: '💡 Easy daily carbon tips',
        aiChip3Q: 'What are the easiest zero-carbon life tips anyone can do daily?',
        aiChip4: '⚡ Impact of food waste on climate',
        aiChip4Q: 'How severe is the global carbon footprint of food waste?',
        aiChip5: '🥤 Benefits of reusable cups & utensils',
        aiChip5Q: 'What are the real carbon-saving benefits of bringing your own cup and utensils?',
        aiChip6: '🪐 Planet Zero upgrade guide',
        aiChip6Q: 'How can I level up my planet in Planet Zero as fast as possible?',
        aiWelcome: '👋 Hi! I\'m the **Planet Zero Eco Assistant** 🌱\n\nAsk me anything about daily carbon reduction, clean plate action, or green living!\n\nTap a **suggested question** below or type your own ✨',
        aiClearedToast: 'Chat history cleared',
        aiErrorMsg: 'Sorry, the assistant had a connection hiccup 😅 Please try again later!',
        aiSystemPrompt: `You are an enthusiastic, professional, and friendly "Planet Zero Eco Assistant" dedicated to helping users with questions about daily carbon reduction, the clean plate movement (finishing food to avoid waste), carbon footprint calculation, plant-based diets, energy saving, and green living.

Response style and rules:
1. Warm, encouraging, and use appropriate emojis (🌱, 🥗, 🌍, 💡, ✨).
2. Be specific and accurate with data (e.g., one vegetarian meal saves ~1.5 kg CO₂; producing 1 kg of beef emits ~27 kg CO₂; food waste accounts for 8–10% of global greenhouse gases).
3. Organized with bold keywords and bullet points; keep responses to 150–250 words for comfortable reading on mobile and desktop.
4. Connect answers to Planet Zero's mission — encourage users to complete daily carbon check-ins and clean plate photos to grow their personal planet!
5. Know Planet Zero's purification upgrade system: start at 0% (Barren), 50 pt → 25% (First Light), 200 pt → 50% (Life Sprouting), 500 pt → 75% (Lush Oasis), 1000 pt → 100% (Zero Carbon Star). Explain these thresholds enthusiastically when users ask!`,

        toastGallery: 'Switched planet appearance to: {name}',
        toastCheckout: '🎉 Checkout complete! Progress saved to Cookie',
        toastCopied: 'Copied to clipboard!',
        toastAIFail: '⚠️ AI analysis failed, please try again',

        aiPassVerdict: '✅ Passed! Confidence {conf}%',
        aiFailVerdict: '❌ Not passed — Confidence {conf}%',
        aiErrorVerdict: '⚠️ Connection Error',
        aiErrorDetail: 'Could not reach AI service, please check your connection',

        badgeSettled: 'Settled',
        badgeHistory: 'History',

        summaryNoRecord: 'No records yet',
        summaryNoHistory: 'No history yet',
        summaryHistoryNote: 'Added to Cookie after checkout',

        cameraDishName: 'Clean Plate (AI Verified)',

        shareTitle: 'Planet Zero — My Carbon Result',
        shareText: '🌍 I saved {total} kg CO₂e through Planet Zero today! Join the eco movement!',

        planet0: 'Barren Planet (0%)',
        planet25: 'First Light Planet (25%)',
        planet50: 'Sprouting Planet (50%)',
        planet75: 'Lush Oasis (75%)',
        planet100: 'Zero Carbon Star (100%)',

        stageName0: '0% Clean · Barren Start',
        stageName25: '25% Clean · First Light',
        stageName50: '50% Clean · Life Sprouting',
        stageName75: '75% Clean · Lush Oasis',
        stageName100: '100% Clean · Zero Carbon Star',

        langLabel: 'Language',
    }
};

// Current active language
let currentLang = localStorage.getItem(LANG_KEY) || 'zh-TW';

function t(key, replacements) {
    const dict = translations[currentLang] || translations['zh-TW'];
    let str = dict[key] || translations['zh-TW'][key] || key;
    if (replacements) {
        Object.keys(replacements).forEach(k => {
            str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), replacements[k]);
        });
    }
    return str;
}

function setLang(lang) {
    currentLang = lang;
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.lang = lang === 'zh-TW' ? 'zh-TW' : 'en';
}

function getLang() {
    return currentLang;
}

// Export
window.i18n = { t, setLang, getLang, translations };

