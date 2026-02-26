const { prisma } = require('../middleware/auth');

async function createEvent(userId, data) {
  return prisma.plannerEvent.create({
    data: { userId, ...data },
  });
}

async function getEvents(userId, role, query) {
  const { startDate, endDate, targetUserId } = query;
  const where = {};

  if (role === 'INTERN') {
    where.userId = userId;
  } else if (targetUserId) {
    where.userId = targetUserId;
  }

  if (startDate || endDate) {
    where.startDate = {};
    if (startDate) where.startDate.gte = new Date(startDate);
    if (endDate) where.startDate.lte = new Date(endDate);
  }

  return prisma.plannerEvent.findMany({
    where,
    include: { user: { select: { id: true, name: true } } },
    orderBy: { startDate: 'asc' },
  });
}

async function updateEvent(id, userId, data) {
  const event = await prisma.plannerEvent.findUnique({ where: { id } });
  if (!event || event.userId !== userId) return null;
  return prisma.plannerEvent.update({ where: { id }, data });
}

async function deleteEvent(id, userId) {
  const event = await prisma.plannerEvent.findUnique({ where: { id } });
  if (!event || event.userId !== userId) return null;
  return prisma.plannerEvent.delete({ where: { id } });
}

module.exports = { createEvent, getEvents, updateEvent, deleteEvent };
