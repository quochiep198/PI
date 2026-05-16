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
  postXpHandler,
  progressHandler,
  registerHandler,
} from '../server/handlers.mjs';

function getPathname(request: Request): string {
  const url = new URL(request.url);
  return url.pathname;
}

function parseCookies(request: Request): Record<string, string> {
  const header = request.headers.get('cookie');
  if (!header) {
    return {};
  }

  return header.split(';').reduce((cookies: Record<string, string>, pair) => {
    const separatorIndex = pair.indexOf('=');
    if (separatorIndex < 0) {
      return cookies;
    }

    const key = pair.slice(0, separatorIndex).trim();
    const value = pair.slice(separatorIndex + 1).trim();
    cookies[key] = decodeURIComponent(value);
    return cookies;
  }, {});
}

// Wrapper to convert Next.js-style (req, res) to native Request/Response
function wrapHandler(
  handler: (req: any, res: any) => Promise<void> | void,
) {
  return async (request: Request) => {
    const url = new URL(request.url);
    const method = request.method;
    let body: any = {};

    try {
      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        body = await request.json();
      }
    } catch {
      // ignore json parse errors
    }

    const cookies = parseCookies(request);

    // Mock Express req/res objects
    const mockReq = {
      method,
      headers: Object.fromEntries(request.headers.entries()),
      body,
      cookies,
      query: Object.fromEntries(url.searchParams.entries()),
      url: url.pathname,
    };

    let statusCode = 200;
    let responseBody: any = null;
    let headers: Array<[string, string]> = [];
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
        headers.push([name, value]);
        return mockRes;
      },
      getHeader: (name: string) => {
        return headers.find(([k]) => k === name)?.[1];
      },
    };

    try {
      await handler(mockReq, mockRes);
    } catch (error) {
      console.error('[Handler Error]', error);
      return new Response(JSON.stringify({ message: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const responseHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    for (const [name, value] of headers) {
      responseHeaders[name] = value;
    }

    return new Response(JSON.stringify(responseBody), {
      status: statusCode,
      headers: responseHeaders,
    });
  };
}

export async function GET(request: Request) {
  const pathname = getPathname(request);

  console.log('[API Debug] GET pathname:', pathname);

  try {
    switch (pathname) {
      case '/api/health':
        return new Response(JSON.stringify({ status: 'ok' }), {
          headers: { 'Content-Type': 'application/json' },
        });

      case '/api/auth/me':
        return wrapHandler(authMeHandler)(request);

      case '/api/lessons':
        return wrapHandler(lessonsHandler)(request);

      case '/api/progress':
        return wrapHandler(progressHandler)(request);

      case '/api/xp':
        return wrapHandler(getXpHandler)(request);

      default:
        return new Response(JSON.stringify({ message: 'Not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('[API Error]', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(request: Request) {
  const pathname = getPathname(request);

  console.log('[API Debug] POST pathname:', pathname);

  try {
    switch (pathname) {
      case '/api/auth/login':
        return wrapHandler(loginHandler)(request);

      case '/api/auth/logout':
        return wrapHandler(logoutHandler)(request);

      case '/api/auth/register':
        return wrapHandler(registerHandler)(request);

      case '/api/lessons':
        return wrapHandler(createLessonHandler)(request);

      case '/api/progress/complete':
        return wrapHandler(completeProgressHandler)(request);

      case '/api/xp':
        return wrapHandler(postXpHandler)(request);

      case '/api/hint':
        return wrapHandler(hintHandler)(request);

      case '/api/error-feedback':
        return wrapHandler(errorFeedbackHandler)(request);

      default:
        return new Response(JSON.stringify({ message: 'Not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('[API Error]', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}