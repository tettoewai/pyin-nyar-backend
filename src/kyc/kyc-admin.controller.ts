import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "../auth/decorators/auth.guard.js";
import { RolesGuard } from "../auth/decorators/role.guard.js";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { GetKycQueryDto } from "./dto/kyc-query.dto.js";
import { KycService } from "./kyc.service.js";
import { UpdateKycStatusDto } from "./dto/update-kyc-status.dto.js";
import { CurrentUser } from "../auth/decorators/user.decorator.js";
import type { AccessPayload } from "../auth/token.service.js";

@Controller("admin/kyc")
export class AdminKycController {
  constructor(private readonly kycService: KycService) {}

  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  getAll(@Query() query: GetKycQueryDto) {
    return this.kycService.getAll(
      query.search,
      query.status,
      query.grade,
      query.page,
      query.limit,
    );
  }

  @Get(":id")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  getKyc(@Param("id") id: string) {
    return this.kycService.get(id);
  }

  @Patch(":id/status")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateKycStatusDto,
    @CurrentUser() user: AccessPayload,
  ) {
    return this.kycService.updateStatus(id, dto.status, user.sub, dto.note);
  }
}
