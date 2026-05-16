/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  authMeHandler,
  completeProgressHandler,
  createLessonHandler,
  errorFeedbackHandler,
  healthHandler,
  hintHandler,
  lessonsHandler,
  loginHandler,
  logoutHandler,
  onlinePresenceStreamHandler,
  postXpHandler,
  progressHandler,
  getXpHandler,
  registerHandler,
} from '../server/handlers.mjs';

export const config = {
  api: {
    bodyParser: true,
  },
};

interface ApiRequest {
  method: string;
  query: { route: string[] };
}

interface ApiResponse {
  status(code: number): ApiResponse;
  setHeader(name: string, value: string): void;
  json(data: unknown): boolean;
  write(data: string): boolean;
  writableEnded: boolean;
  end(): void;
}

export default async function handler(
  request: ApiRequest,
  response: ApiResponse,
) {
  const pathname = `/${(request.query.route as string[]).join('/')}`;

  if (pathname === '/health') {
    if (request.method !== 'GET') breakMethodNotAllowed(response, 'GET');
    return healthHandler(request, response);
  }

  if (pathname === '/auth/login') {
    if (request.method !== 'POST') breakMethodNotAllowed(response, 'POST');
    return loginHandler(request, response);
  }

  if (pathname === '/auth/logout') {
    if (request.method !== 'POST') breakMethodNotAllowed(response, 'POST');
    return logoutHandler(request, response);
  }

  if (pathname === '/auth/me') {
    if (request.method !== 'GET') breakMethodNotAllowed(response, 'GET');
    return authMeHandler(request, response);
  }

  if (pathname === '/auth/register') {
    if (request.method !== 'POST') breakMethodNotAllowed(response, 'POST');
    return registerHandler(request, response);
  }

  if (pathname === '/presence/stream') {
    if (request.method !== 'GET') breakMethodNotAllowed(response, 'GET');
    return onlinePresenceStreamHandler(request, response);
  }

  if (pathname === '/lessons') {
    if (request.method === 'GET') return lessonsHandler(request, response);
    if (request.method === 'POST') return createLessonHandler(request, response);
    breakMethodNotAllowed(response, 'GET, POST');
    return;
  }

  if (pathname === '/progress') {
    if (request.method !== 'GET') breakMethodNotAllowed(response, 'GET');
    return progressHandler(request, response);
  }

  if (pathname === '/progress/complete') {
    if (request.method !== 'POST') breakMethodNotAllowed(response, 'POST');
    return completeProgressHandler(request, response);
  }

  if (pathname === '/progress/:learnerKey' || pathname.startsWith('/progress/')) {
    if (request.method !== 'GET') breakMethodNotAllowed(response, 'GET');
    return progressHandler(request, response);
  }

  if (pathname === '/xp') {
    if (request.method === 'GET') return getXpHandler(request, response);
    if (request.method === 'POST') return postXpHandler(request, response);
    breakMethodNotAllowed(response, 'GET, POST');
    return;
  }

  if (pathname === '/hint') {
    if (request.method !== 'POST') breakMethodNotAllowed(response, 'POST');
    return hintHandler(request, response);
  }

  if (pathname === '/error-feedback') {
    if (request.method !== 'POST') breakMethodNotAllowed(response, 'POST');
    return errorFeedbackHandler(request, response);
  }

  return response.status(404).json({ message: 'Not found' });
}

function breakMethodNotAllowed(response: ApiResponse, allowed: string) {
  response.setHeader('Allow', allowed);
  response.status(405).json({ message: 'Method Not Allowed' });
}