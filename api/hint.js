import { hintHandler } from '../server/handlers.mjs';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  return hintHandler(request, response);
}
