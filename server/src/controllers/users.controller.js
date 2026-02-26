const bcrypt = require('bcryptjs');
const { prisma } = require('../middleware/auth');
const { success, error } = require('../utils/response');

async function getAll(req, res, next) {
  try {
    const { role, search } = req.query;
    const where = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, role: true, department: true, mentorId: true, createdAt: true },
      orderBy: { name: 'asc' },
    });
    return success(res, users);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { name, email, password, role, department, mentorId } = req.body;
    if (!name || !email || !password) return error(res, 'name, email, password required', 400);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return error(res, 'Email already exists', 409);

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: role || 'INTERN', department, mentorId },
      select: { id: true, name: true, email: true, role: true, department: true, createdAt: true },
    });
    return success(res, user, 201);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { name, email, password, role, department, mentorId } = req.body;
    const data = {};
    if (name) data.name = name;
    if (email) data.email = email;
    if (role) data.role = role;
    if (department !== undefined) data.department = department;
    if (mentorId !== undefined) data.mentorId = mentorId;
    if (password) data.passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, name: true, email: true, role: true, department: true, createdAt: true },
    });
    return success(res, user);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    return success(res, { message: 'User deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, create, update, remove };
