import { createApiApp } from './_app';

const app = createApiApp();

export default function handler(req: any, res: any) {
  if (req.url && !req.url.startsWith('/api')) {
    req.url = req.url.startsWith('/') ? `/api${req.url}` : `/api/${req.url}`;
  }
  return app(req, res);
}
