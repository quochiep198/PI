import { onlinePresenceStreamHandler } from '../../server/handlers.mjs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  return onlinePresenceStreamHandler(request, response);
}
