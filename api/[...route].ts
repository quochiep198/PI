/* eslint-disable @typescript-eslint/no-explicit-any */
import type { VercelRequest, VercelResponse } from '@vercel/node';
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
  postXpHandler,
  progressHandler,
  registerHandler,
} from '../server/handlers.mjs';

export const config = {
  api: {
    bodyParser: false,
  },
};

function getPathname(req: VercelRequest): string {
  const url = new URL(req.url || '', 'http://localhost');
  return url.pathname;
}

function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};

  return cookieHeader.split(';').reduce((cookies: Record<string, string>, pair) => {
    const separatorIndex = pair.indexOf('=');
    if (separatorIndex < 0) return cookies;

    const key = pair.slice(0, separatorIndex).trim();
    const value = pair.slice(separatorIndex + 1).trim();
    cookies[key] = decodeURIComponent(value);
    return cookies;
  }, {});
}

function wrapHandler(handler: (req: any, res: any) => Promise<void> | void) {
  return async (req: VercelRequest, res: VercelResponse) => {
    const pathname = getPathname(req);
    const method = req.method || 'GET';
    let body: any = {};

    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        body = req.body;
      } catch {}
    }

    const cookies = parseCookies(req.headers.cookie || null);

    const mockReq = {
      method,
      headers: req.headers,
      body,
      cookies,
      query: req.query,
      url: pathname,
    };

    let statusCode = 200;
    let responseBody: any = null;
    const responseHeaders: Array<[string, string]> = [];
    let isEnded = false;

    const mockRes = {
      status: (code: number) => {
        statusCode = code;
        return mockRes;
      },
      json: (data: any) => {
        if (!isEnded) {
          responseBody = data;
          isEnded = true;
        }
        return mockRes;
      },
      send: (data: any) => {
        if (!isEnded) {
          responseBody = data;
          isEnded = true;
        }
        return mockRes;
      },
      setHeader: (name: string, value: string) => {
        responseHeaders.push([name, value]);
        return mockRes;
      },
      getHeader: (name: string) => {
        return responseHeaders.find(([k]) => k === name)?.[1];
      },
    };

    try {
      await handler(mockReq, mockRes);
    } catch (error) {
      console.error('[Handler Error]', error);
      res.status(500).json({ message: 'Internal server error' });
      return;
    }

    for (const [name, value] of responseHeaders) {
      res.setHeader(name, value);
    }

    res.status(statusCode).json(responseBody);
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pathname = getPathname(req);
  const method = req.method || 'GET';

  console.log('[API Debug]', method, pathname);

  try {
    if (method === 'GET') {
      switch (pathname) {
        case '/api/health':
          return res.status(200).json({ status: 'ok' });

        case '/api/auth/me':
          return wrapHandler(authMeHandler)(req, res);

        case '/api/lessons':
          return wrapHandler(lessonsHandler)(req, res);

        case '/api/progress':
          return wrapHandler(progressHandler)(req, res);

        case '/api/xp':
          return wrapHandler(getXpHandler)(req, res);

        default:
          return res.status(404).json({ message: 'Not found' });
      }
    }

    if (method === 'POST') {
      switch (pathname) {
        case '/api/auth/login':
          return wrapHandler(loginHandler)(req, res);

        case '/api/auth/logout':
          return wrapHandler(logoutHandler)(req, res);

        case '/api/auth/register':
          return wrapHandler(registerHandler)(req, res);

        case '/api/lessons':
          return wrapHandler(createLessonHandler)(req, res);

        case '/api/progress/complete':
          return wrapHandler(completeProgressHandler)(req, res);

        case '/api/xp':
          return wrapHandler(postXpHandler)(req, res);

        case '/api/hint':
          return wrapHandler(hintHandler)(req, res);

        case '/api/error-feedback':
          return wrapHandler(errorFeedbackHandler)(req, res);

        default:
          return res.status(404).json({ message: 'Not found' });
      }
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (error) {
    console.error('[API Error]', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}