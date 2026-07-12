const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const prisma   = require('../../config/db');

function signAccess(user) {
  return jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
}

function signRefresh(user) {
  return jwt.sign(
    { sub: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
}

function safeUser(u) {
  const { passwordHash, ...rest } = u;
  return rest;
}

async function signup({ name, email, password, role }) {
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role: role || 'Driver' },
  });
  return {
    user: safeUser(user),
    accessToken:  signAccess(user),
    refreshToken: signRefresh(user),
  };
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const err = new Error('Invalid email or password'); err.status = 401; throw err;
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    const err = new Error('Invalid email or password'); err.status = 401; throw err;
  }
  return {
    user: safeUser(user),
    accessToken:  signAccess(user),
    refreshToken: signRefresh(user),
  };
}

async function refresh(token) {
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    const err = new Error('Invalid refresh token'); err.status = 401; throw err;
  }
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) { const err = new Error('User not found'); err.status = 401; throw err; }
  return { accessToken: signAccess(user) };
}

module.exports = { signup, login, refresh };
