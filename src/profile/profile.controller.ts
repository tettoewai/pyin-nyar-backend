import { Controller, Get } from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/user.decorator.js";
import type { AccessPayload } from "../auth/token.service.js";
import { ProfileService } from "./profile.service.js";

@Controller("profile")
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}
  @Get()
  async get(@CurrentUser() user: AccessPayload) {
    return this.profileService.getProfile(user.sub);
  }
}
