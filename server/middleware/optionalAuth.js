// Optional Auth Middleware — Attaches req.user if Bearer token is provided, without blocking guests

export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) return next();

  try {
    if (token.startsWith('fb_token_')) {
      const payloadStr = token.replace('fb_token_', '');
      let uidPart = payloadStr;
      let emailPart = `${payloadStr}@scrollnom.com`;
      if (payloadStr.includes('::')) {
        const parts = payloadStr.split('::');
        uidPart = parts[0];
        emailPart = decodeURIComponent(parts[1]);
      }
      req.user = {
        uid: uidPart,
        email: emailPart,
        name: emailPart.split('@')[0]
      };
    } else {
      const payloadBase64 = token.split('.')[1];
      if (payloadBase64) {
        const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf8');
        const payload = JSON.parse(payloadJson);
        const uid = payload.sub || payload.user_id || payload.uid;
        if (uid) {
          req.user = {
            uid,
            email: payload.email || `${uid}@scrollnom.com`,
            name: payload.name || 'User'
          };
        }
      }
    }
  } catch (e) {
    // Ignore invalid token in optional auth
  }

  next();
};
