import { progressHandler } from '../../server/handlers.mjs';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  return progressHandler(request, response);
}
