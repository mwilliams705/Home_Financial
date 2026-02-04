import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET;
const expiresIn = process.env.JWT_EXPIRES_IN || '12h';

if (!secret) {
  throw new Error('JWT_SECRET is required');
}

export function signAccessToken(payload) {
  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, secret);
}
