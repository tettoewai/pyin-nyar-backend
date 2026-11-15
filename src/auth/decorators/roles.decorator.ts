import { SetMetadata } from "@nestjs/common";
import { ROLES_KEY } from "@/auth/decorators/role.guard.js";

export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
