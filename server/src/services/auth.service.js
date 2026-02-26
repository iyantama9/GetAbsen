const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { prisma } = require('../middleware/auth');

async function login(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });

  const payload = { id: user.id, name: user.name, email: user.email, role: user.role };
  const accessToken = jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
  const refreshToken = jwt.sign({ id: user.id }, config.jwt.secret, { expiresIn: config.jwt.refreshExpiresIn });

  return { accessToken, refreshToken, user: payload };
}

async function getUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, department: true, mentorId: true, createdAt: true },
  });
}

module.exports = { login, getUserById };
