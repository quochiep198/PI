/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  authMeHandler,
  completeProgressHandler,
  createLessonHandler,
  errorFeedbackHandler,
  getXpHandler,
  hintHandler,
  lessonsHandler,
  loginHandler,
  logoutHandler,
  onlinePresenceStreamHandler,
  postXpHandler,
  progressHandler,
  registerHandler,
} from '../server/handlers.mjs';

export default async function handler(req: any, res: any) {
  // Build pathname from route query param
  const routeParam = req.query.route;
  const routeArray = Array.isArray(routeParam)
    ? routeParam
    : [routeParam].filter(Boolean);
  const pathname = '/' + routeArray.join('/');

  console.log('[API Debug] pathname:', pathname, 'method:', req.method);

  try {
    switch (pathname) {
      case '/health':
        if (req.method !== 'GET') return methodNotAllowed(res, 'GET');
        return res.status(200).json({ status: 'ok' });

      case '/auth/login':
        if (req.method !== 'POST') return methodNotAllowed(res, 'POST');
        return loginHandler(req, res);

      case '/auth/logout':
        if (req.method !== 'POST') return methodNotAllowed(res, 'POST');
        return logoutHandler(req, res);

      case '/auth/me':
        if (req.method !== 'GET') return methodNotAllowed(res, 'GET');
        return authMeHandler(req, res);

      case '/auth/register':
        if (req.method !== 'POST') return methodNotAllowed(res, 'POST');
        return registerHandler(req, res);

      case '/presence/stream':
        if (req.method !== 'GET') return methodNotAllowed(res, 'GET');
        return onlinePresenceStreamHandler(req, res);

      case '/lessons':
        if (req.method === 'GET') return lessonsHandler(req, res);
        if (req.method === 'POST') return createLessonHandler(req, res);
        return methodNotAllowed(res, 'GET, POST');

      case '/progress':
        if (req.method !== 'GET') return methodNotAllowed(res, 'GET');
        return progressHandler(req, res);

      case '/progress/complete':
        if (req.method !== 'POST') return methodNotAllowed(res, 'POST');
        return completeProgressHandler(req, res);

      case '/xp':
        if (req.method === 'GET') return getXpHandler(req, res);
        if (req.method === 'POST') return postXpHandler(req, res);
        return methodNotAllowed(res, 'GET, POST');

      case '/hint':
        if (req.method !== 'POST') return methodNotAllowed(res, 'POST');
        return hintHandler(req, res);

      case '/error-feedback':
        if (req.method !== 'POST') return methodNotAllowed(res, 'POST');
        return errorFeedbackHandler(req, res);

      default:
        if (pathname.startsWith('/progress/')) {
          if (req.method !== 'GET') return methodNotAllowed(res, 'GET');
          return progressHandler(req, res);
        }
        return res.status(404).json({ message: 'Not found' });
    }
  } catch (error) {
    console.error('[API Error]', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

function methodNotAllowed(res: any, allowed: string) {
  res.setHeader('Allow', allowed);
  return res.status(405).json({ message: 'Method Not Allowed' });
}