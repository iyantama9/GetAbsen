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
    const { query } = req.body;
    if (!query) return error(res, 'Query required', 400);

    // Placeholder response — AI engineer will replace this handler
    return success(res, {
      query,
      response: `[AI Placeholder] Received query: "${query}". This endpoint is a placeholder for the AI assistant. The AI engineer will integrate the actual model here.`,
      timestamp: new Date().toISOString(),
      note: 'This is a mock response. Replace ai.service.js handler with actual AI integration.',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSettings, updateSettings, aiQuery };
