const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const BOT_TOKEN = "8975412628:AAG7wgrp5gHbxLu1dKGatp4jooHZBwL1kF4";
const PIXEL_ID = "1432190382360001";
const ACCESS_TOKEN = "EAGk1ypOn8IwBSwtvAEZCm2AQZClEdxRuvF2wvQhZBoZB7XqBlbM73uPC12NXvq5XsyEj5y3DhpiRDKJK3UMPAWwuvZAdKUlAuGlyTwo02iLbT6GT7ZAgfNBjk59ZAo7QZCbbwvorJ8AkvZBMW8esZARPjfZCGsCOPwzBmWjA5z1RpbsYIkSMQ1bysgzeoSMScmY1QZDZD";
const CHANNEL_LINK = "https://t.me/+hIBCZJfuZ6Y0Y2U1";

app.get('/', (req, res) => {
    res.send("Surya Sureshot King Bot & CAPI Server is Active!");
});

// Telegram Webhook Endpoint
app.post('/api/webhook', async (req, res) => {
    try {
        const update = req.body;
        console.log("📥 Incoming Telegram Update:", JSON.stringify(update));
        
        // Handle /start command from user
        if (update.message && update.message.text && update.message.text.startsWith('/start')) {
            const chatId = update.message.chat.id;
            const payload = {
                chat_id: chatId,
                text: "🔥 *Welcome to SURYA SURESHOT KING!*\n\nClick below to access our exclusive channel:",
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "🚀 Join Exclusive Channel", url: CHANNEL_LINK }]
                    ]
                }
            };
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            console.log("✅ Welcome message sent to chat:", chatId);
        }

        // Handle Chat Join Request (Jab user request bhejega, tab Subscribe event fire hoga)
        const event = update.chat_join_request;
        if (event) {
            const userId = event.from.id;
            const date = event.date || Math.floor(Date.now() / 1000);
            console.log("🔥 Chat Join Request detected from User ID:", userId);

            const capiPayload = {
                data: [{
                    event_name: "Subscribe",
                    event_time: date,
                    action_source: "system_generated",
                    event_id: `sub_${userId}_${date}`,
                    user_data: {
                        external_id: crypto.createHash('sha256').update(String(userId)).digest('hex')
                    }
                }]
            };

            const capiRes = await fetch(`https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(capiPayload)
            });
            
            const capiData = await capiRes.json();
            console.log("🚀 Meta CAPI Response for Subscribe Event:", capiData);
        }

        res.json({ ok: true });
    } catch (err) {
        console.error("❌ Webhook Error:", err);
        res.status(500).json({ ok: false });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    
    // Auto set webhook on Railway deployment
    if (process.env.RAILWAY_STATIC_URL) {
        try {
            const webhookUrl = `https://${process.env.RAILWAY_STATIC_URL}/api/webhook`;
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
            console.log("Telegram Webhook Automatically Set Successfully!");
        } catch (e) {
            console.error("Webhook setup failed:", e);
        }
    }
});
