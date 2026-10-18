import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AccessPayload } from "../token.service.js";

export const ROLES_KEY = "roles";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const requiredRole = this.reflector.get<string[]>(
      ROLES_KEY,
      context.getHandler(),
    );
    if (!requiredRole) return true; // no rules required, allow

    const { user } = context.switchToHttp().getRequest();
    const payload = user as AccessPayload;
    return requiredRole.includes(payload.role);
  }
}
