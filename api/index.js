import app from '../server/app.js';

export default function handler(req, res) {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const route = url.searchParams.get('api_route');
  if (route) {
    url.searchParams.delete('api_route');
    const query = url.searchParams.toString();
    req.url = `/api/${route}${query ? `?${query}` : ''}`;
  }
  return app(req, res);
}
