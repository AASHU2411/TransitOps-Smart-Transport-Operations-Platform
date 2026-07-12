const prisma = require('../../config/db');

function safeUser(u) {
  const { passwordHash, ...rest } = u;
  return rest;
}

async function list(query) {
  const { page = 1, limit = 50, search } = query;
  const where = search
    ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }] }
    : {};
  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, skip: (page - 1) * limit, take: +limit, orderBy: { createdAt: 'desc' } }),
    prisma.user.count({ where }),
  ]);
  return { data: users.map(safeUser), total, page: +page, limit: +limit };
}

async function updateRole(id, role) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) { const e = new Error('User not found'); e.status = 404; throw e; }
  return safeUser(await prisma.user.update({ where: { id }, data: { role } }));
}

async function remove(id, requesterId) {
  if (id === requesterId) {
    const e = new Error('Cannot delete your own account'); e.status = 422; throw e;
  }
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) { const e = new Error('User not found'); e.status = 404; throw e; }
  return safeUser(await prisma.user.delete({ where: { id } }));
}

module.exports = { list, updateRole, remove };
