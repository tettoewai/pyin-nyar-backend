import {
  Body,
  Controller,
  Get,
  Headers,
  Ip,
  Post,
  UseGuards,
} from "@nestjs/common";
import { Public } from "@/auth/decorators/public.decorator.js";
import { AuthService } from "@/auth/auth.service.js";
import { AuthGuard } from "@/auth/decorators/auth.guard.js";
import { CurrentUser } from "@/auth/decorators/user.decorator.js";
import { LoginDto } from "@/auth/dto/login.dto.js";
import { RefreshDto } from "@/auth/dto/refresh.dto.js";
import { RequestOtpDto } from "@/auth/dto/request-otp.dto.js";
import { SignupDto } from "@/auth/dto/sign-up.dto.js";
import { OtpService } from "@/auth/otp.service.js";
import { TokenService } from "@/auth/token.service.js";
import type { AccessPayload } from "@/auth/token.service.js";
import { GoogleLoginDto } from "@/auth/dto/google-login.dto.js";
import { VerifyResetDto } from "@/auth/dto/verify-reset.dto.js";
import { ConfirmResetDto } from "@/auth/dto/confirm-reset.dto.js";
import { Throttle } from "@nestjs/throttler";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly otpService: OtpService,
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  @Get("/me")
  @UseGuards(AuthGuard)
  me(@CurrentUser() user: AccessPayload) {
    return this.authService.me(user.sub);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post("/otp/request")
  requestOtp(@Body() body: RequestOtpDto) {
    return this.otpService.requestOtp(body.email, body.purpose);
  }

  @Public()
  @Post("/sign-up")
  signUp(
    @Ip() ip: string,
    @Headers("user-agent") ua: string,
    @Body() body: SignupDto,
  ) {
    return this.authService.signup(
      body.email,
      body.password,
      body.userName,
      body.confirmPassword,
      body.otp,
      { ip, userAgent: ua },
    );
  }

  @Public()
  @Post("/login")
  login(
    @Ip() ip: string,
    @Headers("user-agent") ua: string,
    @Body() body: LoginDto,
  ) {
    return this.authService.login(body.email, body.password, {
      ip,
      userAgent: ua,
    });
  }

  @Public()
  @Post("/reset-password/verify")
  verifyReset(@Body() body: VerifyResetDto) {
    return this.authService.verifyResetOtp(body.email, body.otp);
  }

  @Public()
  @Post("/reset-password/confirm")
  confirmReset(@Body() body: ConfirmResetDto) {
    return this.authService.confirmResetPassword(
      body.resetToken,
      body.password,
      body.confirmPassword,
    );
  }

  @Public()
  @Post("/google")
  google(
    @Ip() ip: string,
    @Headers("user-agent") ua: string,
    @Body() body: GoogleLoginDto,
  ) {
    return this.authService.googleLogin(
      body.idToken,
      {
        ip,
        userAgent: ua,
      },
      body.userName,
    );
  }

  @Public()
  @Post("/refresh")
  refresh(
    @Ip() ip: string,
    @Headers("user-agent") ua: string,
    @Body() body: RefreshDto,
  ) {
    return this.tokenService.refreshToken(body.refreshToken, {
      ip,
      userAgent: ua,
    });
  }

  @Public()
  @Post("/logout")
  logout(@Body() body: RefreshDto) {
    return this.tokenService.revoke(body.refreshToken);
  }

  @Post("/logout-all")
  @UseGuards(AuthGuard)
  logoutAll(@CurrentUser() user: AccessPayload) {
    return this.tokenService.revokeAll(user.sub);
  }
}
