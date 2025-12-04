const ornaments = ['🔴', '🟢', '🔵', '🟡', '🟣', '🟠', '🎁', '🎀', '🔔', '⛄', '🕯️', '🧦','☃️','🧣','🌟'];

// JSONBin.io ayarları - BUNLARI KENDİ BİLGİLERİNLE DEĞİŞTİR
const JSONBIN_BIN_ID = '690c844aae596e708f4832da';
const JSONBIN_API_KEY = '$2a$10$RImoTvTiNscE401AR/YQ5e0dwN7cKMi/uZOvNz6GVt5RmBxOVTIGi';
const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;

// EmailJS Configuration
const EMAILJS_CONFIG = {
    kangal: {
        serviceId: 'kangal',
        templateId: 'ayberkazra', 
        publicKey: 'ycCBODqhlCe7xpORL',
        toEmail: 'onlyalone790@gmail.com'
    },
    tavsan: {
        serviceId: 'tavsan',
        templateId: 'azraayberk',
        publicKey: 'OrGweD_yFY4c5pbtu',
        toEmail: 'azrakaratay743@gmail.com'
    }
};

// Her kullanıcı için unique ID oluştur
function getUserId() {
    let userId = localStorage.getItem('userId');
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('userId', userId);
    }
    return userId;
}

// Global game state
let globalGameState = {
    ornamentCount: 0,
    kangalLastClick: null,
    tavsanLastClick: null,
    lastUpdate: Date.now(),
    kangalMessage: '',
    tavsanMessage: '',
    kangalUser: '',
    tavsanUser: '',
    messagesOpenedNotified: false,
    kangalTimerNotified: false,
    tavsanTimerNotified: false
};

// User-specific game state
let userGameState = {
    selectedCharacter: null,
    userId: getUserId()
};

function showSyncNotification(message) {
    const notification = document.getElementById('syncNotification');
    if (notification) {
        notification.textContent = message;
        notification.style.display = 'block';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }
}

// EmailJS'yi yükle
function loadEmailJS() {
    return new Promise((resolve) => {
        if (typeof emailjs !== 'undefined') {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
        script.onload = function() {
            // İLK OLARAK SENIN PUBLIC KEY ILE INITIALIZE ET
            emailjs.init(EMAILJS_CONFIG.kangal.publicKey);
            console.log('✅ EmailJS yüklendi!');
            resolve();
        };
        script.onerror = function() {
            console.log('❌ EmailJS yüklenemedi!');
            resolve();
        };
        document.head.appendChild(script);
    });
}

// EmailJS'yi farklı public key ile initialize et
async function initEmailJS(publicKey) {
    if (typeof emailjs === 'undefined') {
        await loadEmailJS();
    }
    emailjs.init(publicKey);
}

// Bildirim gönder
async function sendNotification(notificationType, targetPlayer, additionalData = {}) {
    try {
        const config = EMAILJS_CONFIG[targetPlayer];
        
        // HEDEF OYUNCUYA GÖRE DOĞRU PUBLIC KEY ILE INITIALIZE ET
        await initEmailJS(config.publicKey);
        
        let notificationEmoji = '🎄';
        let notificationMessage = '';
        
        switch(notificationType) {
            case 'decorate':
                notificationEmoji = '🎁';
                const decorator = additionalData.decorator === 'kangal' ? '🐕 Kangal' : '🐰 Tavşan';
                notificationMessage = `${decorator} ağacı süsledi!`;
                break;
            case 'timer':
                notificationEmoji = '⏰';
                notificationMessage = 'Süsleme süren doldu!';
                break;
            case 'messages_opened':
                notificationEmoji = '🎊';
                notificationMessage = 'Yılbaşı mesajlarınız açıldı!';
                break;
        }
        
        const templateParams = {
            notification_emoji: notificationEmoji,
            notification_message: notificationMessage,
            additional_info: additionalData.info || '',
            ornament_count: globalGameState.ornamentCount,
            site_url: window.location.href,
            to_email: config.toEmail
        };
        
        console.log('📤 Email gönderiliyor:', targetPlayer, 'to:', config.toEmail);
        await emailjs.send(config.serviceId, config.templateId, templateParams);
        console.log('✅ Email gönderildi!', targetPlayer);
        
    } catch (error) {
        console.error('❌ Email gönderme hatası:', error);
    }
}

// Ağaç süslenince bildirim gönder
async function sendDecorateNotification(playerWhoDecorated) {
    const targetPlayer = playerWhoDecorated === 'kangal' ? 'tavsan' : 'kangal';
    await sendNotification('decorate', targetPlayer, { 
        decorator: playerWhoDecorated,
        info: 'Hemen süslemeye devam et!'
    });
}

// Süre dolunca bildirim gönder
async function sendTimerNotification(player) {
    await sendNotification('timer', player, {
        info: 'Yeni süs ekleyebilirsin!'
    });
}

// Mesajlar açılınca bildirim gönder
async function sendMessagesOpenedNotification() {
    await sendNotification('messages_opened', 'kangal', {
        info: 'Mesajları okumak için siteyi ziyaret et!'
    });
    await sendNotification('messages_opened', 'tavsan', {
        info: 'Mesajları okumak için siteyi ziyaret et!'
    });
}

// Global verileri kaydet
async function saveGlobalGameState() {
    try {
        showSyncNotification('🔄 Kaydediliyor...');
        
        const response = await fetch(JSONBIN_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_API_KEY
            },
            body: JSON.stringify(globalGameState)
        });
        
        const result = await response.json();
        if (result.metadata) {
            showSyncNotification('✅ Kaydedildi!');
        }
    } catch (error) {
        console.error('Global kaydetme hatası:', error);
        showSyncNotification('❌ Kaydetme hatası!');
    }
}

// User-specific verileri localStorage'a kaydet
function saveUserGameState() {
    try {
        localStorage.setItem('userGameState', JSON.stringify(userGameState));
    } catch (error) {
        console.error('User kaydetme hatası:', error);
    }
}

// Global verileri yükle
async function loadGlobalGameState() {
    try {
        showSyncNotification('🔄 Yükleniyor...');
        
        const response = await fetch(JSONBIN_URL + '/latest', {
            method: 'GET',
            headers: {
                'X-Master-Key': JSONBIN_API_KEY
            }
        });
        
        const result = await response.json();
        const loaded = result.record;
        
        if (loaded && typeof loaded === 'object') {
            globalGameState = { ...globalGameState, ...loaded };
            updateOrnamentCount();
            renderOrnaments();
            
            showSyncNotification('✅ Veriler yüklendi!');
        }
    } catch (error) {
        console.error('Global yükleme hatası:', error);
        showSyncNotification('❌ Yükleme hatası!');
    }
}

// User-specific verileri yükle
function loadUserGameState() {
    try {
        const saved = localStorage.getItem('userGameState');
        if (saved) {
            const loaded = JSON.parse(saved);
            userGameState = { ...userGameState, ...loaded };
            loadMessages();
            
            if (userGameState.selectedCharacter) {
                showMainContent();
            }
        }
    } catch (error) {
        console.error('User yükleme hatası:', error);
    }
}

function selectCharacter(character) {
    userGameState.selectedCharacter = character;
    saveUserGameState();
    showMainContent();
}

function showMainContent() {
    const charSelection = document.getElementById('characterSelection');
    const mainContent = document.getElementById('mainContent');

    if (charSelection) charSelection.classList.add('hidden');
    if (mainContent) mainContent.style.display = 'block';

    const kangalBtn = document.getElementById('kangalBtn');
    const tavsanBtn = document.getElementById('tavsanBtn');
    const kangalSaveBtn = document.getElementById('kangalSaveBtn');
    const tavsanSaveBtn = document.getElementById('tavsanSaveBtn');

    const messageGroups = document.querySelectorAll('.message-input-group');
    const kangalMessageGroup = messageGroups[0];
    const tavsanMessageGroup = messageGroups[1];

    if (userGameState.selectedCharacter === 'kangal') {
        if (tavsanBtn) {
            tavsanBtn.disabled = true;
            tavsanBtn.style.opacity = '0.3';
            tavsanBtn.style.cursor = 'not-allowed';
            tavsanBtn.title = 'Tavşan olarak giriş yapmadın!';
        }

        if (tavsanSaveBtn) {
            tavsanSaveBtn.disabled = true;
            tavsanSaveBtn.style.opacity = '0.3';
            tavsanSaveBtn.style.cursor = 'not-allowed';
        }

        if (tavsanMessageGroup) {
            tavsanMessageGroup.style.opacity = '0.5';
            tavsanMessageGroup.style.pointerEvents = 'none';
        }
    } else if (userGameState.selectedCharacter === 'tavsan') {
        if (kangalBtn) {
            kangalBtn.disabled = true;
            kangalBtn.style.opacity = '0.3';
            kangalBtn.style.cursor = 'not-allowed';
            kangalBtn.title = 'Kangal olarak giriş yapmadın!';
        }

        if (kangalSaveBtn) {
            kangalSaveBtn.disabled = true;
            kangalSaveBtn.style.opacity = '0.3';
            kangalSaveBtn.style.cursor = 'not-allowed';
        }

        if (kangalMessageGroup) {
            kangalMessageGroup.style.opacity = '0.5';
            kangalMessageGroup.style.pointerEvents = 'none';
        }
    }
}

function updateOrnamentCount() {
    const counter = document.getElementById('ornamentCount');
    if (counter) counter.textContent = globalGameState.ornamentCount;
}

function renderOrnaments() {
    const container = document.getElementById('ornaments');
    if (!container) return;

    container.innerHTML = '';
    for (let i = 0; i < globalGameState.ornamentCount; i++) {
        addOrnamentToTree();
    }
}

function addOrnamentToTree() {
    const container = document.getElementById('ornaments');
    if (!container) return;

    const ornament = document.createElement('div');
    ornament.className = 'ornament';
    ornament.textContent = ornaments[Math.floor(Math.random() * ornaments.length)];

    const screenWidth = window.innerWidth;
    let positions;

    if (screenWidth <= 480) {
        positions = [
            { x: -80, y: 320 }, { x: -60, y: 310 }, { x: -40, y: 300 }, { x: -20, y: 290 },
            { x: 0, y: 285 }, { x: 20, y: 290 }, { x: 40, y: 300 }, { x: 60, y: 310 }, { x: 80, y: 320 },
            { x: -70, y: 340 }, { x: -50, y: 330 }, { x: -30, y: 320 }, { x: -10, y: 310 },
            { x: 10, y: 310 }, { x: 30, y: 320 }, { x: 50, y: 330 }, { x: 70, y: 340 },
            { x: -60, y: 250 }, { x: -40, y: 240 }, { x: -20, y: 230 }, { x: 0, y: 225 },
            { x: 20, y: 230 }, { x: 40, y: 240 }, { x: 60, y: 250 },
            { x: -50, y: 270 }, { x: -30, y: 260 }, { x: -10, y: 250 }, { x: 10, y: 250 }, { x: 30, y: 260 }, { x: 50, y: 270 },
            { x: -40, y: 180 }, { x: -20, y: 170 }, { x: 0, y: 165 }, { x: 20, y: 170 }, { x: 40, y: 180 },
            { x: -30, y: 200 }, { x: -10, y: 190 }, { x: 10, y: 190 }, { x: 30, y: 200 }
        ];
    } else if (screenWidth <= 768) {
        positions = [
            { x: -90, y: 340 }, { x: -70, y: 330 }, { x: -50, y: 320 }, { x: -30, y: 310 }, { x: -10, y: 300 },
            { x: 10, y: 300 }, { x: 30, y: 310 }, { x: 50, y: 320 }, { x: 70, y: 330 }, { x: 90, y: 340 },
            { x: -80, y: 360 }, { x: -60, y: 350 }, { x: -40, y: 340 }, { x: -20, y: 330 },
            { x: 20, y: 330 }, { x: 40, y: 340 }, { x: 60, y: 350 }, { x: 80, y: 360 },
            { x: -70, y: 270 }, { x: -50, y: 260 }, { x: -30, y: 250 }, { x: -10, y: 240 }, { x: 10, y: 240 },
            { x: 30, y: 250 }, { x: 50, y: 260 }, { x: 70, y: 270 },
            { x: -60, y: 290 }, { x: -40, y: 280 }, { x: -20, y: 270 }, { x: 20, y: 270 }, { x: 40, y: 280 }, { x: 60, y: 290 },
            { x: -50, y: 200 }, { x: -30, y: 190 }, { x: -10, y: 180 }, { x: 10, y: 180 }, { x: 30, y: 190 }, { x: 50, y: 200 },
            { x: -40, y: 220 }, { x: -20, y: 210 }, { x: 20, y: 210 }, { x: 40, y: 220 }
        ];
    } else {
        positions = [
            { x: -120, y: 380 }, { x: -100, y: 370 }, { x: -80, y: 360 }, { x: -60, y: 350 }, { x: -40, y: 340 }, { x: -20, y: 330 },
            { x: 0, y: 325 }, { x: 20, y: 330 }, { x: 40, y: 340 }, { x: 60, y: 350 }, { x: 80, y: 360 }, { x: 100, y: 370 }, { x: 120, y: 380 },
            { x: -110, y: 400 }, { x: -90, y: 390 }, { x: -70, y: 380 }, { x: -50, y: 370 }, { x: -30, y: 360 },
            { x: 30, y: 360 }, { x: 50, y: 370 }, { x: 70, y: 380 }, { x: 90, y: 390 }, { x: 110, y: 400 },
            { x: -90, y: 300 }, { x: -70, y: 290 }, { x: -50, y: 280 }, { x: -30, y: 270 }, { x: -10, y: 260 },
            { x: 10, y: 260 }, { x: 30, y: 270 }, { x: 50, y: 280 }, { x: 70, y: 290 }, { x: 90, y: 300 },
            { x: -80, y: 320 }, { x: -60, y: 310 }, { x: -40, y: 300 }, { x: -20, y: 290 },
            { x: 20, y: 290 }, { x: 40, y: 300 }, { x: 60, y: 310 }, { x: 80, y: 320 },
            { x: -60, y: 220 }, { x: -40, y: 210 }, { x: -20, y: 200 }, { x: 0, y: 195 }, { x: 20, y: 200 }, { x: 40, y: 210 }, { x: 60, y: 220 },
            { x: -50, y: 240 }, { x: -30, y: 230 }, { x: -10, y: 220 }, { x: 10, y: 220 }, { x: 30, y: 230 }, { x: 50, y: 240 }
        ];
    }

    const randomPos = positions[Math.floor(Math.random() * positions.length)];
    ornament.style.left = `calc(50% + ${randomPos.x}px)`;
    ornament.style.top = `${randomPos.y}px`;
    container.appendChild(ornament);
}

async function decorateTree(player) {
    if (userGameState.selectedCharacter !== player) {
        alert('Bu butonu kullanamazsın! Sen ' + (userGameState.selectedCharacter === 'kangal' ? '🐕 Kangal' : '🐰 Tavşan') + ' olarak oynuyorsun!');
        return;
    }

    const now = Date.now();
    const lastClick = player === 'kangal' ? globalGameState.kangalLastClick : globalGameState.tavsanLastClick;

    if (lastClick && (now - lastClick < 24 * 60 * 60 * 1000)) {
        alert('24 saat geçmeden tekrar süsleyemezsin! ⏰');
        return;
    }

    globalGameState.ornamentCount++;
    globalGameState[player + 'LastClick'] = now;
    globalGameState.lastUpdate = now;
    
    // SÜRE BİLDİRİMİNİ SIFIRLA (yeni süre başlayınca)
    globalGameState[`${player}TimerNotified`] = false;

    addOrnamentToTree();
    updateOrnamentCount();
    await saveGlobalGameState();
    updateTimers();

    await sendDecorateNotification(player);
    console.log(`${player} ağacı süsledi!`);
}

function updateTimers() {
    const now = Date.now();
    const warningEl = document.getElementById('warning');

    for (const player of ['kangal', 'tavsan']) {
        const lastClick = globalGameState[player + 'LastClick'];
        const btn = document.getElementById(player + 'Btn');
        const timer = document.getElementById(player + 'Timer');

        if (!btn || !timer) continue;

        if (userGameState.selectedCharacter !== player) {
            btn.disabled = true;
            btn.style.opacity = '0.3';
            btn.style.cursor = 'not-allowed';
            timer.textContent = 'Başka karakter!';
            continue;
        }

        if (!lastClick) {
            btn.disabled = false;
            timer.textContent = 'Hazır!';
            continue;
        }

        const elapsed = now - lastClick;
        const hour24 = 24 * 60 * 60 * 1000;
        const hour48 = 48 * 60 * 60 * 1000;

        if (elapsed >= hour48) {
            globalGameState.ornamentCount = 0;
            globalGameState.kangalLastClick = null;
            globalGameState.tavsanLastClick = null;
            saveGlobalGameState();
            renderOrnaments();
            updateOrnamentCount();
            btn.disabled = false;
            timer.textContent = 'Hazır!';
            if (warningEl) warningEl.style.display = 'none';
            continue;
        }

        if (elapsed < hour24) {
            // 24 SAAT DOLMADI - BUTON KİLİTLİ
            const remaining = hour24 - elapsed;
            const hours = Math.floor(remaining / (60 * 60 * 1000));
            const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
            btn.disabled = true;
            timer.textContent = `${hours}s ${minutes}dk`;
        } else {
            // 24 SAAT DOLDU - BUTON AKTİF
            btn.disabled = false;
            const remaining = hour48 - elapsed;
            const hours = Math.floor(remaining / (60 * 60 * 1000));
            const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
            timer.textContent = `Süre: ${hours}s ${minutes}dk`;
            if (warningEl) warningEl.style.display = 'block';
            
            // 🎯 核心 FİX: BUTON AKTİF OLDU VE DAHA ÖNCE BİLDİRİM GÖNDERİLMEDİYSE GÖNDER
            const notifiedKey = `${player}TimerNotified`;
            if (!globalGameState[notifiedKey]) {
                console.log(`🔔 ${player} için süre doldu bildirimi gönderiliyor...`);
                sendTimerNotification(player);
                globalGameState[notifiedKey] = true;
                saveGlobalGameState();
            }
        }
    }
}

async function saveMessage(player) {
    if (userGameState.selectedCharacter !== player) {
        alert('Bu mesajı yazamazsın! Sen ' + (userGameState.selectedCharacter === 'kangal' ? '🐕 Kangal' : '🐰 Tavşan') + ' olarak oynuyorsun!');
        return;
    }

    const textarea = document.getElementById(player + 'Message');
    const saveBtn = document.getElementById(player + 'SaveBtn');
    const savedDiv = document.getElementById(player + 'Saved');

    if (!textarea || !saveBtn || !savedDiv) return;

    if (textarea.style.display === 'none') {
        textarea.style.display = 'block';
        textarea.focus();
        saveBtn.textContent = 'Mesajı Kaydet';
        savedDiv.style.display = 'none';

        if (globalGameState[player + 'Message']) {
            textarea.value = globalGameState[player + 'Message'];
        }
        return;
    }

    const message = textarea.value;
    if (!message.trim()) {
        alert('Lütfen bir mesaj yaz! 📝');
        return;
    }

    globalGameState[player + 'Message'] = message;
    globalGameState[player + 'User'] = userGameState.userId;
    await saveGlobalGameState();

    textarea.value = '';
    textarea.style.display = 'none';
    savedDiv.style.display = 'block';
    saveBtn.textContent = 'Mesajı Düzenle';
}

function loadMessages() {
    ['kangal', 'tavsan'].forEach(player => {
        const savedDiv = document.getElementById(player + 'Saved');
        const saveBtn = document.getElementById(player + 'SaveBtn');

        if (globalGameState[player + 'Message'] && savedDiv && saveBtn) {
            savedDiv.style.display = 'block';
            saveBtn.textContent = 'Mesajı Düzenle';
        }
    });
}

function updateCountdown() {
    const now = new Date();
    const newYear = new Date('2026-01-01T00:00:00');
    const diff = newYear - now;

    const messagesDisplayContainer = document.getElementById('messagesDisplayContainer');
    const messagesLockedContainer = document.getElementById('messagesLockedContainer');
    const countdownEl = document.getElementById('countdown');

    if (!countdownEl) return;

    if (diff <= 0) {
        if (messagesDisplayContainer) messagesDisplayContainer.style.display = 'block';
        if (messagesLockedContainer) messagesLockedContainer.style.display = 'none';

        const displayKangal = document.getElementById('displayKangalMessage');
        const displayTavsan = document.getElementById('displayTavsanMessage');

        if (displayKangal) displayKangal.textContent = globalGameState.kangalMessage || 'Kangal mesaj yazmamış';
        if (displayTavsan) displayTavsan.textContent = globalGameState.tavsanMessage || 'Tavşan mesaj yazmamış';

        countdownEl.textContent = '🎊 Mutlu Yıllar! 🎊';
        
        if (!globalGameState.messagesOpenedNotified) {
            sendMessagesOpenedNotification();
            globalGameState.messagesOpenedNotified = true;
            saveGlobalGameState();
        }
        
    } else {
        if (messagesDisplayContainer) messagesDisplayContainer.style.display = 'none';
        if (messagesLockedContainer) messagesLockedContainer.style.display = 'block';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        countdownEl.textContent = `Mesajlar açılıyor: ${days} gün ${hours} saat ${minutes} dakika ${seconds} saniye`;
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    const kangalBtn = document.getElementById('kangalBtn');
    const tavsanBtn = document.getElementById('tavsanBtn');

    if (kangalBtn) kangalBtn.addEventListener('click', () => decorateTree('kangal'));
    if (tavsanBtn) tavsanBtn.addEventListener('click', () => decorateTree('tavsan'));

    loadEmailJS();
    loadGlobalGameState();
    loadUserGameState();
    updateTimers();
    updateCountdown();

    setInterval(() => {
        updateTimers();
        updateCountdown();
    }, 1000);

    setInterval(() => {
        loadGlobalGameState();
    }, 30000);
});