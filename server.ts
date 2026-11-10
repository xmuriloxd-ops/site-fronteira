import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const PORT = Number(process.env.PORT ?? 3000);

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, app: "rone-edital" });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        // aceita o domínio de preview do Arena
        allowedHosts: true as any,
        hmr: process.env.DISABLE_HMR === "true" ? false : undefined,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`RONE site running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
