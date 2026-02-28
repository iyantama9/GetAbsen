const { prisma } = require('../middleware/auth');

async function buildContext(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, name: true } });
  if (!user) return '';

  const lines = ['--- DATA REAL-TIME DARI DATABASE GETABSEN ---'];
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  // Get interns (for mentor: their interns, for superuser: all)
  const internWhere = user.role === 'MENTOR' ? { mentorId: userId, role: 'INTERN' } : { role: 'INTERN' };
  const interns = await prisma.user.findMany({
    where: internWhere,
    select: { id: true, name: true, email: true, department: true },
  });

  lines.push(`\n### Daftar Intern (${interns.length} orang)`);
  if (interns.length === 0) {
    lines.push('- Tidak ada intern yang terdaftar');
  } else {
    interns.forEach(i => lines.push(`- ${i.name} (${i.email})${i.department ? ` — ${i.department}` : ''}`));
  }

  if (interns.length > 0) {
    const internIds = interns.map(i => i.id);

    // Today's attendance
    const todayStart = new Date(todayStr);
    const todayEnd = new Date(todayStr);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const todayAttendance = await prisma.attendance.findMany({
      where: { userId: { in: internIds }, date: { gte: todayStart, lt: todayEnd } },
      include: { user: { select: { name: true } } },
    });

    lines.push(`\n### Absensi Hari Ini (${todayStr})`);
    const checkedIn = todayAttendance.map(a => `- ${a.user.name}: **${a.status}** (${a.checkInTime ? new Date(a.checkInTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'})`);
    const notCheckedIn = interns.filter(i => !todayAttendance.find(a => a.userId === i.id)).map(i => `- ${i.name}: **BELUM ABSEN**`);
    lines.push(`Sudah absen: ${todayAttendance.length}/${interns.length}`);
    checkedIn.forEach(l => lines.push(l));
    notCheckedIn.forEach(l => lines.push(l));

    // This week's summary
    const weekAttendance = await prisma.attendance.findMany({
      where: { userId: { in: internIds }, date: { gte: weekAgo } },
      include: { user: { select: { name: true } } },
    });

    lines.push(`\n### Rekap Absensi 7 Hari Terakhir`);
    interns.forEach(intern => {
      const records = weekAttendance.filter(a => a.userId === intern.id);
      const hadir = records.filter(a => a.status === 'HADIR').length;
      const izin = records.filter(a => a.status === 'IZIN').length;
      const sakit = records.filter(a => a.status === 'SAKIT').length;
      lines.push(`- ${intern.name}: Hadir ${hadir}x, Izin ${izin}x, Sakit ${sakit}x (total ${records.length} hari)`);
    });

    // Recent logbook
    const recentLogbooks = await prisma.logbookEntry.findMany({
      where: { userId: { in: internIds }, date: { gte: weekAgo } },
      include: { user: { select: { name: true } }, tasks: true },
      orderBy: { date: 'desc' },
      take: 20,
    });

    if (recentLogbooks.length > 0) {
      lines.push(`\n### Logbook Terbaru (7 hari)`);
      recentLogbooks.forEach(entry => {
        const d = entry.date.toISOString().split('T')[0];
        const taskSummary = entry.tasks.map(t => t.activity || t.output).filter(Boolean).join(', ');
        lines.push(`- ${entry.user.name} (${d}): ${taskSummary || 'Tidak ada detail'}`);
      });
    }
  }

  lines.push('\n--- AKHIR DATA DATABASE ---');
  return lines.join('\n');
}

module.exports = { buildContext };
