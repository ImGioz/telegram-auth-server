const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { verifyTelegramInitData } = require('./checkTelegramInitData');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

const sessions = new Map(); // sessionId -> { telegramUser }
const BOT_TOKEN = process.env.BOT_TOKEN;

app.use(bodyParser.json());
app.use(cookieParser());

// CORS (разрешить доступ клиенту, например из React)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.CLIENT_URL || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.post('/auth/telegram', (req, res) => {
  const { initData } = req.body;

  try {
    const parsed = verifyTelegramInitData(initData, BOT_TOKEN);
if (!parsed) {
  return res.status(403).json({ error: 'Invalid signature' });
}


    const user = parsed.user;
    if (!user || !user.id) return res.status(400).json({ error: 'Invalid Telegram user' });

    const sessionId = uuidv4();
    sessions.set(sessionId, {
      userId: user.id,
      userName: user.first_name,
      userImg: user.photo_url || '',
    });

    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      sameSite: 'Lax',
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Auth error:', err);
    res.status(403).json({ error: 'Invalid signature' });
  }
});

app.get('/me', (req, res) => {
  const sessionId = req.cookies.sessionId;
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  res.json({ user: sessions.get(sessionId) });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
