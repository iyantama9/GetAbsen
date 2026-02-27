const config = require('../config/env');

const SYSTEM_PROMPT = `Kamu adalah AI Assistant GetAbsen — sistem absensi intern milik Getcore.ID.

Tugasmu:
- Menjawab pertanyaan mentor tentang progress, absensi, logbook, dan performa intern
- Memberikan insight dan saran berdasarkan data yang diberikan
- Menjawab dalam Bahasa Indonesia (casual tapi tetap profesional)
- Jika tidak tahu, bilang jujur dan sarankan cara lain

Konteks sistem:
- GetAbsen adalah sistem absensi harian intern
- Intern harus absen (check-in) setiap hari kerja antara jam yang ditentukan
- Intern juga mengisi logbook harian dengan task yang dikerjakan
- Mentor bisa melihat progress semua intern yang mereka bimbing
- Status absensi: HADIR, IZIN, SAKIT`;

async function chat(messages) {
  if (!config.ai.apiKey) {
    throw Object.assign(new Error('AI API key not configured'), { statusCode: 501 });
  }

  const res = await fetch(`${config.ai.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.ai.apiKey}`,
    },
    body: JSON.stringify({
      model: config.ai.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('[AI Service] API error:', res.status, text);
    throw Object.assign(new Error('AI API request failed'), { statusCode: 502 });
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'Tidak ada respons dari AI.';
}

module.exports = { chat };
