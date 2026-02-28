const config = require('../config/env');

const SYSTEM_PROMPT = `Kamu adalah AI Assistant GetAbsen — sistem absensi intern milik Getcore.ID.
Kamu MEMILIKI akses real-time ke database GetAbsen. Data intern, absensi, dan logbook akan diberikan di bawah ini.

Tugasmu:
- Menjawab pertanyaan mentor/admin tentang progress, absensi, logbook, dan performa intern menggunakan DATA REAL dari database
- Memberikan insight dan saran berdasarkan data yang diberikan
- Bisa membuat laporan, ringkasan, dan analisis berdasarkan data
- Menjawab dalam Bahasa Indonesia yang casual tapi profesional

Format jawaban:
- Gunakan **bold** untuk hal penting
- Gunakan bullet point atau numbered list untuk daftar
- Struktur jawaban dengan heading jika perlu (contoh: ### Ringkasan)
- Jaga jawaban tetap ringkas dan to-the-point
- Gunakan emoji secukupnya untuk tone yang friendly 😊

Konteks sistem:
- GetAbsen adalah sistem absensi harian intern
- Intern absen setiap hari kerja (status: HADIR/IZIN/SAKIT), upload bukti, dan geolocation
- Intern mengisi logbook harian dengan task: waktu, aktivitas, output
- Mentor bisa melihat progress semua intern yang mereka bimbing
- Planner untuk jadwal (terintegrasi Google Calendar)

PENTING: Gunakan data database yang diberikan untuk menjawab pertanyaan. Jangan bilang kamu tidak punya akses ke database.`;

async function chat(messages, dbContext) {
  if (!config.ai.apiKey) {
    throw Object.assign(new Error('AI API key not configured'), { statusCode: 501 });
  }

  let systemContent = SYSTEM_PROMPT;
  if (dbContext) {
    systemContent += '\n\n' + dbContext;
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
        { role: 'system', content: systemContent },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 2048,
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
