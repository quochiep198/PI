import {
  getXpHandler,
  postXpHandler,
} from '../../server/handlers.mjs';

export default async function handler(request, response) {
  if (request.method === 'GET') {
    return getXpHandler(request, response);
  }

  if (request.method === 'POST') {
    return postXpHandler(request, response);
  }

  response.setHeader('Allow', 'GET, POST');
  return response.status(405).json({ message: 'Method Not Allowed' });
}