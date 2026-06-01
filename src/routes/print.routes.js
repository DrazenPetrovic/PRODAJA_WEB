import { Router } from "express";

const router = Router();

const PRINT_AGENT_URL = process.env.PRINT_AGENT_URL || "http://127.0.0.1:4567";

const proxyGet = (agentPath) => async (_req, res) => {
  try {
    const response = await fetch(`${PRINT_AGENT_URL}${agentPath}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(4000),
    });

    const data = await response.json().catch(() => ({}));
    res.status(response.status).json(data);
  } catch {
    res.status(503).json({ error: "Print servis nije dostupan" });
  }
};

router.get("/health", proxyGet("/health"));
router.get("/status", proxyGet("/status"));
router.get("/printers", proxyGet("/printers"));

router.post("/print", async (req, res) => {
  try {
    const response = await fetch(`${PRINT_AGENT_URL}/print`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
      signal: AbortSignal.timeout(30000),
    });

    const data = await response.json().catch(() => ({}));
    res.status(response.status).json(data);
  } catch {
    res.status(503).json({ error: "Print servis nije dostupan" });
  }
});

export default router;
