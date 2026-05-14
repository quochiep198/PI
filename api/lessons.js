import { createLessonHandler, lessonsHandler } from '../server/handlers.mjs';

export default async function handler(request, response) {
  if (request.method === 'GET') {
    return lessonsHandler(request, response);
  }

  if (request.method === 'POST') {
    return createLessonHandler(request, response);
  }

  response.setHeader('Allow', 'GET, POST');
  return response.status(405).json({ message: 'Method Not Allowed' });
}
