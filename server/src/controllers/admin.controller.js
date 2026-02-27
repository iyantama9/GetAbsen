const { prisma } = require('../middleware/auth');
const { success, error } = require('../utils/response');

async function getSettings(req, res, next) {
  try {
    const settings = await prisma.appSetting.findMany();
    const map = {};
    settings.forEach(s => { map[s.key] = s.value; });
    return success(res, map);
  } catch (err) {
    next(err);
  }
}

async function updateSettings(req, res, next) {
  try {
    const updates = req.body;
    const results = [];

    for (const [key, value] of Object.entries(updates)) {
      const setting = await prisma.appSetting.upsert({
        where: { key },
        create: { key, value: String(value) },
        update: { value: String(value) },
      });
      results.push(setting);
    }

    return success(res, results);
  } catch (err) {
    next(err);
  }
}

async function aiQuery(req, res, next) {
  try {
    const { query, messages: history } = req.body;
    if (!query) return error(res, 'Query required', 400);

    const aiService = require('../services/ai.service');

    // Build conversation with history if provided
    const messages = history && history.length > 0
      ? [...history, { role: 'user', content: query }]
      : [{ role: 'user', content: query }];

    const response = await aiService.chat(messages);
    return success(res, { response });
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
}

module.exports = { getSettings, updateSettings, aiQuery };
