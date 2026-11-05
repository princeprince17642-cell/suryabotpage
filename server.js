const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const BOT_TOKEN = "8975412628:AAG7wgrp5gHbxLu1dKGatp4jooHZBwL1kF4";
const PIXEL_ID = "1432190382360001";
const ACCESS_TOKEN = "EAAfydwR67hUBSZCKIMIELCEMOThYRWWV7tMEaxqZCRhWBpNnzUp8qsJkkJlUG1hJP4Rx0ft76eJAXS9AXY1SJ8AhuDlZA2N9ZBHT2vmziBUUtatVmhPFe4xAj3jXA84TBvgVEqJ8vry1kryYRRFZBjGTkMZCrQoXz1ZBvZBAeOK2AGfLpqAaDUIey3sSD5UB0ltaxgZDZD";
const CHANNEL_LINK = "https://t.me/+hIBCZJfuZ6Y0Y2U1";

const userClickMapping = {};

app.get('/', (req, res) => {
    res.send("Surya Sureshot King Bot & CAPI Server is Active!");
});

app.post('/api/webhook', async (req, res) => {
    try {
        const update = req.body;
        console.log("📥 Incoming Telegram Update:", JSON.stringify(update));
        
        if (update.message && update.message.text && update.message.text.startsWith('/start')) {
            const chatId = update.message.chat.id;
            const textParts = update.message.text.split(' ');
            
            if (textParts.length > 1) {
                const param = textParts[1];
                if (param.startsWith('fbclid_')) {
                    const fbclidVal = param.replace('fbclid_', '');
                    userClickMapping[chatId] = fbclidVal;
                    console.log(`🔗 Mapped Telegram User ${chatId} with fbclid: ${fbclidVal}`);
                }
            }

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

        const event = update.chat_join_request;
        if (event) {
            const userId = event.from.id;
            const chatId = event.chat.id;
            const date = event.date || Math.floor(Date.now() / 1000);
            console.log("🔥 Chat Join Request detected from User ID:", userId);

            const storedFbclid = userClickMapping[userId] || userClickMapping[chatId];

            const userData = {
                external_id: crypto.createHash('sha256').update(String(userId)).digest('hex')
            };

            if (storedFbclid) {
                userData.fbc = `fb.1.${Date.now()}.${storedFbclid}`;
                console.log("🎯 Attached fbc to CAPI payload:", userData.fbc);
            }

            const capiPayload = {
                data: [{
                    event_name: "Subscribe",
                    event_time: date,
                    action_source: "system_generated",
                    event_id: `sub_${userId}_${date}`,
                    user_data: userData
                }]
            };

            const capiRes = andFetch = await fetch(`https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`, {
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
