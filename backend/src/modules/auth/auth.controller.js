const authService = require('./auth.service');

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

async function signup(req, res, next) {
  try {
    const result = await authService.signup(req.body);
    res.cookie('refreshToken', result.refreshToken, COOKIE_OPTS);
    res.status(201).json({ user: result.user, accessToken: result.accessToken });
  } catch (e) { next(e); }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    res.cookie('refreshToken', result.refreshToken, COOKIE_OPTS);
    res.json({ user: result.user, accessToken: result.accessToken });
  } catch (e) { next(e); }
}

async function refresh(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ error: 'No refresh token' });
    const result = await authService.refresh(token);
    res.json(result);
  } catch (e) { next(e); }
}

function logout(req, res) {
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out' });
}

module.exports = { signup, login, refresh, logout };
