import { healthHandler } from '../server/handlers.mjs';

export default async function handler(request, response) {
  return healthHandler(request, response);
}
