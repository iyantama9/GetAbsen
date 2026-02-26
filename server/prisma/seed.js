const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create Super User
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@getcore.id' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@getcore.id',
      passwordHash: adminPassword,
      role: 'SUPERUSER',
      department: 'Management',
    },
  });
  console.log('Created admin:', admin.email);

  // Create Mentor
  const mentorPassword = await bcrypt.hash('mentor123', 12);
  const mentor = await prisma.user.upsert({
    where: { email: 'mentor@getcore.id' },
    update: {},
    create: {
      name: 'Mentor One',
      email: 'mentor@getcore.id',
      passwordHash: mentorPassword,
      role: 'MENTOR',
      department: 'AI Engineering',
    },
  });
  console.log('Created mentor:', mentor.email);

  // Create Intern
  const internPassword = await bcrypt.hash('intern123', 12);
  const intern = await prisma.user.upsert({
    where: { email: 'intern@getcore.id' },
    update: {},
    create: {
      name: 'Intern One',
      email: 'intern@getcore.id',
      passwordHash: internPassword,
      role: 'INTERN',
      department: 'Fullstack',
      mentorId: mentor.id,
    },
  });
  console.log('Created intern:', intern.email);

  // Seed App Settings
  const settings = [
    { key: 'absen_start_time', value: '10:00' },
    { key: 'absen_end_time', value: '17:00' },
    { key: 'office_latitude', value: '-6.2088' },
    { key: 'office_longitude', value: '106.8456' },
  ];

  for (const s of settings) {
    await prisma.appSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }
  console.log('Seeded app settings');

  console.log('\n=== Test Accounts ===');
  console.log('Admin:  admin@getcore.id  / admin123');
  console.log('Mentor: mentor@getcore.id / mentor123');
  console.log('Intern: intern@getcore.id / intern123');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
