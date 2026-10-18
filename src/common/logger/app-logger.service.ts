import { Injectable, LoggerService } from "@nestjs/common";
import { isProduction, pinoLogger } from "./logger.js";

type PinoLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

/**
 * Nest's noisy bootstrap loggers. Muted in production since they only announce
 * module/route wiring on every startup.
 */
const BOOTSTRAP_CONTEXTS = new Set([
  "NestFactory",
  "InstanceLoader",
  "RoutesResolver",
  "RouterExplorer",
]);

function serializeError(error: Error): Record<string, unknown> {
  const serialized: Record<string, unknown> = {
    type: error.name,
    message: error.message,
    stack: error.stack,
  };

  const cause = (error as { cause?: unknown }).cause;
  if (cause instanceof Error) {
    serialized.cause = serializeError(cause);
  }

  return serialized;
}

/**
 * Routes Nest's built-in logger (and every `new Logger(context)` call) into
 * pino so all output is structured JSON in production.
 */
@Injectable()
export class AppLogger implements LoggerService {
  log(message: unknown, ...optionalParams: unknown[]): void {
    this.write("info", message, optionalParams);
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    this.write("error", message, optionalParams);
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    this.write("warn", message, optionalParams);
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    this.write("debug", message, optionalParams);
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    this.write("trace", message, optionalParams);
  }

  fatal(message: unknown, ...optionalParams: unknown[]): void {
    this.write("fatal", message, optionalParams);
  }

  private write(
    level: PinoLevel,
    message: unknown,
    optionalParams: unknown[],
  ): void {
    const params = [...optionalParams];
    const bindings: Record<string, unknown> = {};

    const last = params.at(-1);
    if (typeof last === "string") {
      bindings.context = last;
      params.pop();
    } else if (last && typeof last === "object" && "context" in last) {
      const context = (last as { context?: unknown }).context;
      if (typeof context === "string") {
        bindings.context = context;
      }
      params.pop();
    }

    if (
      isProduction &&
      typeof bindings.context === "string" &&
      BOOTSTRAP_CONTEXTS.has(bindings.context)
    ) {
      return;
    }

    const textParts: string[] = [];

    const collect = (value: unknown): void => {
      if (value === undefined || value === null) return;

      if (value instanceof Error) {
        bindings.err = serializeError(value);
        return;
      }

      if (typeof value === "object") {
        Object.assign(bindings, value);
        return;
      }

      if (typeof value === "string") {
        textParts.push(value);
        return;
      }

      if (typeof value === "function") {
        textParts.push(value.name || "function");
        return;
      }

      if (
        typeof value === "number" ||
        typeof value === "boolean" ||
        typeof value === "bigint" ||
        typeof value === "symbol"
      ) {
        textParts.push(value.toString());
      }
    };

    collect(message);
    params.forEach(collect);

    pinoLogger[level](bindings, textParts.join(" "));
  }
}
