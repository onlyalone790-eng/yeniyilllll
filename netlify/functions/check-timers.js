exports.handler = async (event, context) => {
    const JSONBIN_BIN_ID = '690c844aae596e708f4832da';
    const JSONBIN_API_KEY = '$2a$10$RImoTvTiNscE401AR/YQ5e0dwN7cKMi/uZOvNz6GVt5RmBxOVTIGi';
    const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;

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

    try {
        // JSONBin'den veriyi çek
        const response = await fetch(JSONBIN_URL + '/latest', {
            headers: { 'X-Master-Key': JSONBIN_API_KEY }
        });
        
        const data = await response.json();
        const gameState = data.record;

        const now = Date.now();
        const hour24 = 24 * 60 * 60 * 1000;
        let notifications = [];
        let updated = false;

        // Kangal kontrolü
        if (gameState.kangalLastClick) {
            const elapsed = now - gameState.kangalLastClick;
            if (elapsed >= hour24 && !gameState.kangalTimerNotified) {
                await sendEmail('kangal', EMAILJS_CONFIG.kangal);
                gameState.kangalTimerNotified = true;
                notifications.push('kangal');
                updated = true;
            }
        }

        // Tavşan kontrolü
        if (gameState.tavsanLastClick) {
            const elapsed = now - gameState.tavsanLastClick;
            if (elapsed >= hour24 && !gameState.tavsanTimerNotified) {
                await sendEmail('tavsan', EMAILJS_CONFIG.tavsan);
                gameState.tavsanTimerNotified = true;
                notifications.push('tavsan');
                updated = true;
            }
        }

        // Güncelleme varsa kaydet
        if (updated) {
            await fetch(JSONBIN_URL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': JSONBIN_API_KEY
                },
                body: JSON.stringify(gameState)
            });
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                notifications: notifications,
                message: notifications.length > 0 ? `${notifications.length} bildirim gönderildi` : 'Gönderilecek bildirim yok'
            })
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};

async function sendEmail(player, config) {
    await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            service_id: config.serviceId,
            template_id: config.templateId,
            user_id: config.publicKey,
            template_params: {
                notification_emoji: '⏰',
                notification_message: 'Süsleme süren doldu!',
                additional_info: 'Yeni süs ekleyebilirsin!',
                to_email: config.toEmail
            }
        })
    });
}