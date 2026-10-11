import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { TokenService } from "../token.service.js";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  private readonly logger = new Logger(AuthGuard.name);
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();
      const { authorization }: any = request.headers;

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
      request.user = await this.tokenService.verifyToken(token.trim());
      return true;
    } catch (error: any) {
      this.logger.error(`auth error - ${error.message}`);
      throw new ForbiddenException(
        error.message || "Session expired! Please sign in",
      );
    }
  }
}
