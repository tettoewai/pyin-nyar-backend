import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "@/auth/decorators/public.decorator.js";
import { TokenService } from "@/auth/token.service.js";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly reflector: Reflector,
  ) {}

  private readonly logger = new Logger(AuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Skip auth for routes explicitly marked @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authorization: string | undefined = request.headers?.authorization;

    if (!authorization) {
      throw new UnauthorizedException("Missing Authorization header.");
    }

    // "Bearer <jwt>" — strict split
    const [scheme, token] = authorization.split(" ");
    if (scheme !== "Bearer" || !token) {
      throw new UnauthorizedException(
        "Invalid Authorization format. Use: Bearer <token>",
      );
    }
    try {
      request.user = await this.tokenService.verifyToken(token.trim());
      return true;
    } catch (error: any) {
      // verifyToken already normalises to UnauthorizedException — preserve it.
      if (error instanceof HttpException) throw error;

      this.logger.warn(
        `auth failure: ${error instanceof Error ? error.name : "unknown"}`,
      );
      throw new UnauthorizedException("Invalid or expired access token.");
    }
  }
}
