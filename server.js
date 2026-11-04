const express = require('express');
const cors = require('cors');
const path = require('path'); // أضف هذا السطر
const app = express();

app.use(cors());
app.use(express.json());

// قراءة ملفات الواجهة (index.html) من نفس المجلد
app.use(express.static(__dirname)); // أضف هذا السطر

// In-memory store for active pairing codes
// Production tip: Use Redis or Firebase Realtime DB
const sessions = {};

// Helper: Generate 8-character code
function generateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        if (i === 4) code += '-';
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// API 1: Generate Code for Roblox Player
app.post('/api/generate-code', (req, res) => {
    const { userId, username } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    const code = generateCode();
    sessions[code] = {
        userId,
        username,
        connected: false,
        createdAt: Date.now()
    };

    res.json({ code });
});

// API 2: Validate and Connect from Web Frontend
app.post('/api/connect-mic', (req, res) => {
    const { code } = req.body;
    if (sessions[code]) {
        sessions[code].connected = true;
        return res.json({ success: true, message: 'Mic connected successfully', user: sessions[code].username });
    }
    res.status(404).json({ success: false, message: 'Invalid or expired code' });
});

// API 3: Poll Connection Status for Roblox
app.get('/api/check-status', (req, res) => {
    const { code } = req.query;
    if (sessions[code]) {
        return res.json({ connected: sessions[code].connected });
    }
    res.json({ connected: false });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Voice Bridge Server running on port ${PORT}`);
});
