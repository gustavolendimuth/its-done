import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  RegisterDto,
  LoginDto,
  GoogleAuthDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  // MW-27 — 10 tentativas/min por IP: mais restritivo que o teto global,
  // freia brute-force de senha sem travar um usuário legítimo se enganando.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    this.logger.debug(`Login attempt for email: ${loginDto.email}`);

    try {
      const user = await this.authService.validateUser(
        loginDto.email,
        loginDto.password,
      );

      if (!user) {
        this.logger.warn(`Invalid credentials for email: ${loginDto.email}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      this.logger.debug(`User validated successfully: ${user.email}`);
      const result = await this.authService.login(user);
      this.logger.debug(`Login successful for user: ${user.email}`);

      return result;
    } catch (error) {
      this.logger.error(
        `Login failed for email: ${loginDto.email}`,
        error.stack,
      );
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @Post('google')
  async googleAuth(@Body() googleAuthDto: GoogleAuthDto) {
    this.logger.debug(`Google auth attempt for email: ${googleAuthDto.email}`);
    return this.authService.googleAuth(googleAuthDto);
  }

  // MW-27 — 5 tentativas/min por IP: fluxo de reset é raro em uso legítimo,
  // limite baixo reduz enumeração de emails e spam de envio.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    this.logger.debug(
      `Forgot password request for email: ${forgotPasswordDto.email}`,
    );
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  // MW-27 — 5 tentativas/min por IP: mesma lógica do forgot-password, evita
  // força bruta contra o token de reset.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    this.logger.debug(`Reset password request`);
    return this.authService.resetPassword(resetPasswordDto);
  }
}
