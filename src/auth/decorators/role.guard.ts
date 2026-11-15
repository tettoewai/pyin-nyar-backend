import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AccessPayload } from "@/auth/token.service.js";

export const ROLES_KEY = "roles";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;

    const { user }: any = context.switchToHttp().getRequest();
    if (!user) throw new UnauthorizedException(); // defencive; AuthGuard runs first
    if (!required.includes(user.role)) {
      throw new ForbiddenException("Insufficient permissions.");
    }
    return true;
  }
}
