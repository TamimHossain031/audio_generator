import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createApiApp } from './api/_app';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = createApiApp();
const portArgIdx = process.argv.indexOf('--port');
const cliPort =
  portArgIdx !== -1 && process.argv[portArgIdx + 1]
    ? parseInt(process.argv[portArgIdx + 1], 10)
    : NaN;
const PORT = !Number.isNaN(cliPort)
  ? cliPort
  : process.env.PORT
    ? parseInt(process.env.PORT, 10)
    : 3000;

// Setup Vite middleware in dev or static server in prod
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    let viteMiddlewares: ((req: any, res: any, next: any) => void) | null = null;
    let initVite: (() => Promise<void>) | null = null;
    let viteReady: Promise<void> | null = null;

    initVite = async () => {
      try {
        const { createServer: createViteServer } = await import('vite');
        const vite = await createViteServer({
          server: { middlewareMode: true, allowedHosts: true, hmr: false, ws: false },
          appType: 'spa',
        });
        viteMiddlewares = vite.middlewares;
      } catch (err) {
        console.error('Vite middleware initialization failed:', err);
        process.exit(1);
      }
    };

    app.use(async (req, res, next) => {
      try {
        if (!viteMiddlewares) {
          if (!viteReady && initVite) {
            viteReady = initVite();
          }
          await viteReady;
        }
        if (viteMiddlewares) {
          return viteMiddlewares(req, res, next);
        }
        next();
      } catch (err) {
        next(err);
      }
    });

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Bangla AI Voice Studio server running on http://0.0.0.0:${PORT}`);
      if (!viteReady && initVite) {
        viteReady = initVite();
      }
    });
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Bangla AI Voice Studio server running on http://0.0.0.0:${PORT}`);
    });
  }
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
