import type { Connect, Plugin } from "vite";
import { defineConfig } from "vite";

interface LiveAgentSessionRecord {
  sessionId: string;
  pageId: string;
  href: string;
  visibilityState: string;
  seenAt: number;
}

interface LiveAgentRequestRecord {
  requestId: string;
  targetSessionId: string;
  method: string;
  payload: unknown;
  createdAt: number;
  claimedAt: number | null;
}

interface LiveAgentResponseRecord {
  requestId: string;
  ok: boolean;
  result?: unknown;
  error?: string;
  respondedAt: number;
}

const LIVE_AGENT_BRIDGE_BASE_PATH = "/__live-agent-bridge";
const LIVE_AGENT_SESSION_TTL_MS = 5000;
const LIVE_AGENT_RESPONSE_TTL_MS = 30000;
const LIVE_AGENT_REQUEST_TTL_MS = 30000;

function createLiveAgentBridgePlugin(): Plugin {
  const sessions = new Map<string, LiveAgentSessionRecord>();
  const requests = new Map<string, LiveAgentRequestRecord>();
  const responses = new Map<string, LiveAgentResponseRecord>();

  const prune = () => {
    const now = Date.now();

    for (const [sessionId, session] of sessions.entries()) {
      if (now - session.seenAt > LIVE_AGENT_SESSION_TTL_MS) {
        sessions.delete(sessionId);
      }
    }

    for (const [requestId, request] of requests.entries()) {
      if (now - request.createdAt > LIVE_AGENT_REQUEST_TTL_MS) {
        requests.delete(requestId);
      }
    }

    for (const [requestId, response] of responses.entries()) {
      if (now - response.respondedAt > LIVE_AGENT_RESPONSE_TTL_MS) {
        responses.delete(requestId);
      }
    }
  };

  const readJsonBody = async (req: Connect.IncomingMessage): Promise<Record<string, unknown>> => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    if (chunks.length <= 0) {
      return {};
    }

    const raw = Buffer.concat(chunks).toString("utf8");
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
  };

  const writeJson = (res: Connect.ServerResponse, statusCode: number, payload: unknown) => {
    res.statusCode = statusCode;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.setHeader("cache-control", "no-store");
    res.end(JSON.stringify(payload));
  };

  const getActiveSessions = (): LiveAgentSessionRecord[] =>
    [...sessions.values()]
      .filter((session) => Date.now() - session.seenAt <= LIVE_AGENT_SESSION_TTL_MS)
      .sort((left, right) => {
        const visibilityScore = (session: LiveAgentSessionRecord) => (session.visibilityState === "visible" ? 1 : 0);
        return visibilityScore(right) - visibilityScore(left) || right.seenAt - left.seenAt;
      });

  const middleware: Connect.NextHandleFunction = (req, res, next) => {
    void (async () => {
      const requestUrl = req.url ? new URL(req.url, "http://127.0.0.1") : null;
      if (!requestUrl || !requestUrl.pathname.startsWith(LIVE_AGENT_BRIDGE_BASE_PATH)) {
        next();
        return;
      }

      prune();

      if (req.method === "POST" && requestUrl.pathname === `${LIVE_AGENT_BRIDGE_BASE_PATH}/heartbeat`) {
        const body = await readJsonBody(req);
        const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
        if (!sessionId) {
          writeJson(res, 400, { ok: false, error: "heartbeat requires sessionId." });
          return;
        }

        sessions.set(sessionId, {
          sessionId,
          pageId: typeof body.pageId === "string" ? body.pageId : sessionId,
          href: typeof body.href === "string" ? body.href : "",
          visibilityState: typeof body.visibilityState === "string" ? body.visibilityState : "unknown",
          seenAt: Date.now()
        });
        writeJson(res, 200, { ok: true });
        return;
      }

      if (req.method === "POST" && requestUrl.pathname === `${LIVE_AGENT_BRIDGE_BASE_PATH}/issue`) {
        const body = await readJsonBody(req);
        const method = typeof body.method === "string" ? body.method : "";
        if (!method) {
          writeJson(res, 400, { ok: false, error: "live-session issue requires method." });
          return;
        }

        const activeSessions = getActiveSessions();
        const targetSession = activeSessions[0];
        if (!targetSession) {
          writeJson(res, 409, { ok: false, error: "No active live game tab is registered on this dev server." });
          return;
        }

        const requestId = `live-request-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        requests.set(requestId, {
          requestId,
          targetSessionId: targetSession.sessionId,
          method,
          payload: body.payload,
          createdAt: Date.now(),
          claimedAt: null
        });
        writeJson(res, 200, { ok: true, requestId, targetSessionId: targetSession.sessionId });
        return;
      }

      if (req.method === "GET" && requestUrl.pathname === `${LIVE_AGENT_BRIDGE_BASE_PATH}/request`) {
        const sessionId = requestUrl.searchParams.get("sessionId") ?? "";
        if (!sessionId) {
          writeJson(res, 400, { ok: false, error: "live-session request poll requires sessionId." });
          return;
        }

        const request = [...requests.values()]
          .filter((entry) => entry.targetSessionId === sessionId)
          .sort((left, right) => left.createdAt - right.createdAt)[0];

        if (!request) {
          writeJson(res, 200, { ok: true, request: null });
          return;
        }

        request.claimedAt = Date.now();
        writeJson(res, 200, {
          ok: true,
          request: {
            requestId: request.requestId,
            method: request.method,
            payload: request.payload
          }
        });
        return;
      }

      if (req.method === "POST" && requestUrl.pathname === `${LIVE_AGENT_BRIDGE_BASE_PATH}/resolve`) {
        const body = await readJsonBody(req);
        const requestId = typeof body.requestId === "string" ? body.requestId : "";
        const ok = body.ok === true;
        if (!requestId) {
          writeJson(res, 400, { ok: false, error: "live-session resolve requires requestId." });
          return;
        }

        const resultPayload =
          body.result && typeof body.result === "object" && "error" in body.result
            ? body.result
            : body.result ?? null;
        const error =
          !ok && resultPayload && typeof resultPayload === "object" && "error" in resultPayload && typeof resultPayload.error === "string"
            ? resultPayload.error
            : !ok
              ? "Live game tab rejected the request."
              : undefined;

        responses.set(requestId, {
          requestId,
          ok,
          result: ok ? resultPayload : undefined,
          error,
          respondedAt: Date.now()
        });
        requests.delete(requestId);
        writeJson(res, 200, { ok: true });
        return;
      }

      if (req.method === "GET" && requestUrl.pathname === `${LIVE_AGENT_BRIDGE_BASE_PATH}/result`) {
        const requestId = requestUrl.searchParams.get("requestId") ?? "";
        if (!requestId) {
          writeJson(res, 400, { ok: false, error: "live-session result poll requires requestId." });
          return;
        }

        const response = responses.get(requestId);
        if (response) {
          writeJson(res, 200, {
            ok: true,
            done: true,
            response: {
              ok: response.ok,
              result: response.result,
              error: response.error
            }
          });
          return;
        }

        if (requests.has(requestId)) {
          writeJson(res, 200, { ok: true, done: false, response: null });
          return;
        }

        writeJson(res, 404, { ok: false, error: "Live-session request was not found or expired." });
        return;
      }

      writeJson(res, 404, { ok: false, error: "Unknown live-agent bridge endpoint." });
    })().catch((error: unknown) => {
      writeJson(res, 500, {
        ok: false,
        error: error instanceof Error ? error.message : String(error)
      });
    });
  };

  return {
    name: "frontline-officer-live-agent-bridge",
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    }
  };
}

export default defineConfig({
  base: "./",
  plugins: [createLiveAgentBridgePlugin()],
  server: {
    host: "127.0.0.1",
    port: 5847,
    strictPort: true
  },
  preview: {
    host: "127.0.0.1",
    port: 5848,
    strictPort: true
  },
  resolve: {
    alias: {
      phaser: "phaser/dist/phaser.esm.js"
    }
  },
  optimizeDeps: {
    exclude: ["phaser"]
  }
});
