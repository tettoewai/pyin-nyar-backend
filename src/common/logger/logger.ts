import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import pino from "pino";
import { pinoHttp } from "pino-http";
import type { Options } from "pino-http";

const require = createRequire(import.meta.url);

export const isProduction = process.env.NODE_ENV === "production";

const canUsePretty =
  !isProduction &&
  (() => {
    try {
      require.resolve("pino-pretty");
      return true;
    } catch {
      return false;
    }
  })();

const redactPaths = [
  "req.headers.authorization",
  "req.headers.cookie",
  "req.headers['x-api-key']",
  "res.headers['set-cookie']",
  "password",
  "*.password",
  "confirmPassword",
  "*.confirmPassword",
  "token",
  "*.token",
  "accessToken",
  "*.accessToken",
  "refreshToken",
  "*.refreshToken",
  "otp",
  "*.otp",
];

export const pinoLogger = pino({
  level: process.env.LOG_LEVEL ?? (isProduction ? "info" : "debug"),
  base: {
    service: "pyin-nyar-backend",
    env: process.env.NODE_ENV ?? "development",
  },
  messageKey: "message",
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
  redact: { paths: redactPaths, censor: "[REDACTED]" },
  ...(canUsePretty
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:HH:MM:ss.l",
            ignore: "pid,hostname,service,env",
          },
        },
      }
    : {}),
});

export function setLogLevel(level: string): void {
  pinoLogger.level = level;
}

const httpOptions: Options = {
  logger: pinoLogger,
  genReqId: (req, res) => {
    const header = req.headers["x-request-id"];
    const id = (Array.isArray(header) ? header[0] : header) ?? randomUUID();
    res.setHeader("x-request-id", id);
    return id;
  },
  customLogLevel: (_req, res, error) => {
    if (error || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  customSuccessMessage: (req, res) =>
    `${req.method ?? "-"} ${req.url ?? "-"} ${res.statusCode}`,
  customErrorMessage: (req, res) =>
    `${req.method ?? "-"} ${req.url ?? "-"} ${res.statusCode}`,
  autoLogging: {
    ignore: (req) => {
      const url = req.url ?? "";
      return url.startsWith("/api") || url === "/favicon.ico";
    },
  },
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      id: req.id,
      remoteAddress: req.remoteAddress,
    }),
    res: (res) => ({ statusCode: res.statusCode }),
    err: pino.stdSerializers.err,
  },
};

export const httpLogger = pinoHttp(httpOptions);
