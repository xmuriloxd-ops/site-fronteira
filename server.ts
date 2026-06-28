import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

interface AccessLog {
  id: string;
  timestamp: string;
  userAgent: string;
  platform: string;
  language: string;
  screenWidth: number;
  screenHeight: number;
  isMobile: boolean;
  ip: string;
  operatorId?: string;
  operatorName?: string;
}

const LOGS_FILE_PATH = path.join(process.cwd(), "btz_access_logs.json");

// Helper to load logs from file
function loadLogs(): AccessLog[] {
  try {
    if (fs.existsSync(LOGS_FILE_PATH)) {
      const data = fs.readFileSync(LOGS_FILE_PATH, "utf8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Erro ao carregar logs de acesso:", error);
  }
  return [];
}

// Helper to save logs to file
function saveLogs(logs: AccessLog[]) {
  try {
    fs.writeFileSync(LOGS_FILE_PATH, JSON.stringify(logs, null, 2), "utf8");
  } catch (error) {
    console.error("Erro ao salvar logs de acesso:", error);
  }
}

interface OperatorAccount {
  operatorId: string;
  operatorName: string;
  password?: string;
  isAdmin?: boolean;
}

const OPERATORS_FILE_PATH = path.join(process.cwd(), "btz_operators.json");

const DEFAULT_OPERATORS: OperatorAccount[] = [
  { operatorId: '86887', operatorName: 'MURILO MENDES', password: '123' },
  { operatorId: 'admin', operatorName: 'Administrador', password: 'admin', isAdmin: true },
  { operatorId: 'administrador', operatorName: 'Administrador', password: 'admin', isAdmin: true }
];

function loadOperators(): OperatorAccount[] {
  try {
    if (fs.existsSync(OPERATORS_FILE_PATH)) {
      const data = fs.readFileSync(OPERATORS_FILE_PATH, "utf8");
      return JSON.parse(data);
    } else {
      fs.writeFileSync(OPERATORS_FILE_PATH, JSON.stringify(DEFAULT_OPERATORS, null, 2), "utf8");
      return DEFAULT_OPERATORS;
    }
  } catch (error) {
    console.error("Erro ao carregar operadores:", error);
  }
  return DEFAULT_OPERATORS;
}

function saveOperators(operators: OperatorAccount[]) {
  try {
    fs.writeFileSync(OPERATORS_FILE_PATH, JSON.stringify(operators, null, 2), "utf8");
  } catch (error) {
    console.error("Erro ao salvar operadores:", error);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON bodies
  app.use(express.json());

  let accessLogs: AccessLog[] = loadLogs();
  let operatorsList: OperatorAccount[] = loadOperators();

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Get list of registered operators
  app.get("/api/operators", (req, res) => {
    try {
      operatorsList = loadOperators();
      res.json({ success: true, operators: operatorsList });
    } catch (err) {
      console.error("Erro ao obter operadores:", err);
      res.status(500).json({ error: "Erro ao carregar operadores" });
    }
  });

  // Save/Update list of operators
  app.post("/api/operators", (req, res) => {
    try {
      const { operators } = req.body;
      if (Array.isArray(operators)) {
        operatorsList = operators;
        saveOperators(operatorsList);
        res.json({ success: true, operators: operatorsList });
      } else {
        res.status(400).json({ error: "Parâmetro 'operators' deve ser uma lista" });
      }
    } catch (err) {
      console.error("Erro ao salvar operadores:", err);
      res.status(500).json({ error: "Erro ao salvar operadores" });
    }
  });

  // Register access log
  app.post("/api/access-log", (req, res) => {
    try {
      const { userAgent, platform, language, screenWidth, screenHeight, isMobile, operatorId, operatorName } = req.body;
      
      // Get client IP address safely
      let ip = (req.headers["x-forwarded-for"] as string) || req.ip || req.socket.remoteAddress || "Desconhecido";
      if (ip.includes(",")) {
        ip = ip.split(",")[0].trim();
      }
      // Remove IPv6 prefix if present
      if (ip.startsWith("::ffff:")) {
        ip = ip.slice(7);
      }

      const newLog: AccessLog = {
        id: Math.random().toString(36).substring(2, 15) + Date.now().toString(36),
        timestamp: new Date().toISOString(),
        userAgent: userAgent || "Desconhecido",
        platform: platform || "Desconhecido",
        language: language || "Desconhecido",
        screenWidth: Number(screenWidth) || 0,
        screenHeight: Number(screenHeight) || 0,
        isMobile: !!isMobile,
        ip,
        operatorId,
        operatorName
      };

      accessLogs.unshift(newLog);
      
      // Keep only last 1000 logs
      if (accessLogs.length > 1000) {
        accessLogs = accessLogs.slice(0, 1000);
      }

      saveLogs(accessLogs);

      res.status(201).json({ success: true, log: newLog });
    } catch (err) {
      console.error("Erro ao registrar acesso:", err);
      res.status(500).json({ error: "Erro interno ao processar acesso" });
    }
  });

  // Retrieve access logs
  app.get("/api/access-logs", (req, res) => {
    try {
      res.json({ success: true, logs: accessLogs });
    } catch (err) {
      console.error("Erro ao listar acessos:", err);
      res.status(500).json({ error: "Erro interno ao listar acessos" });
    }
  });

  // Clear access logs
  app.post("/api/clear-access-logs", (req, res) => {
    try {
      accessLogs = [];
      saveLogs([]);
      res.json({ success: true });
    } catch (err) {
      console.error("Erro ao limpar acessos:", err);
      res.status(500).json({ error: "Erro interno ao limpar acessos" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
