const crypto = require('crypto');

/**
 * Проверка подписи Telegram WebApp initData
 * @param {string} initData — строка от Telegram WebApp
 * @param {string} botToken — токен твоего Telegram-бота
 * @returns {object|null} — объект initDataUnsafe если подпись корректна, иначе null
 */
function verifyTelegramInitData(initData, botToken) {
  const secret = crypto.createHash('sha256').update(botToken).digest();
  const parsedData = new URLSearchParams(initData);
  const hash = parsedData.get('hash');

  const dataCheckArr = [];
  for (const [key, value] of parsedData.entries()) {
    if (key !== 'hash') {
      dataCheckArr.push(`${key}=${value}`);
    }
  }

  dataCheckArr.sort();
  const dataCheckString = dataCheckArr.join('\n');
  const hmac = crypto
    .createHmac('sha256', secret)
    .update(dataCheckString)
    .digest('hex');

  if (hmac === hash) {
    const result = {};
    for (const [key, value] of parsedData.entries()) {
      if (key === 'user') {
        result.user = JSON.parse(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  } else {
    return null;
  }
}

module.exports = { verifyTelegramInitData };
