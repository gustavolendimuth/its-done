import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  RegisterDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { UserResponse } from '../types';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
  ) {}

  async register(registerDto: RegisterDto) {
    console.log('Starting registration for:', { email: registerDto.email });
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      console.log('User already exists:', { email: registerDto.email });
      throw new ConflictException('User already exists with this email');
    }

    console.log('Hashing password for new user');
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    console.log('Password hashed successfully');

    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });
    console.log('User created successfully:', {
      id: user.id,
      email: user.email,
    });

    // Send welcome email
    await this.notificationsService.sendWelcomeEmail(user.email, user.name);

    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<UserResponse | null> {
    console.log('Validating user:', { email });
    const user = await this.usersService.findByEmail(email);
    console.log('User found:', user ? 'yes' : 'no');

    if (!user) {
      console.log('User not found');
      return null;
    }

    console.log('Comparing passwords');
    console.log('Provided password length:', password.length);
    console.log('Stored hash length:', user.password.length);
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('Invalid password');
      return null;
    }

    console.log('User validated successfully');
    const { password: _, ...result } = user;
    return {
      ...result,
      role: user.role,
    } as UserResponse;
  }

  async login(user: UserResponse) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async validateToken(token: string): Promise<UserResponse> {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findOne(payload.sub);
      return user;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async googleAuth(googleAuthDto: {
    email: string;
    name: string;
    googleId: string;
  }) {
    console.log('GoogleAuth called with:', googleAuthDto);

    if (!googleAuthDto.email) {
      console.error('Email is undefined in googleAuthDto');
      throw new Error('Email is required for Google authentication');
    }

    const existingUser = await this.usersService.findByEmail(
      googleAuthDto.email,
    );

    console.log('Existing user found:', existingUser);

    if (!existingUser) {
      // Criar usuário se não existir
      console.log('Creating new user from Google auth');
      const randomPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      const user = await this.usersService.create({
        email: googleAuthDto.email,
        name: googleAuthDto.name,
        password: hashedPassword,
        googleId: googleAuthDto.googleId,
      });

      console.log('New user created:', user);

      const payload = { email: user.email, sub: user.id };
      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    }

    // Atualizar googleId se o usuário já existir
    console.log('Updating existing user with Google ID');
    console.log('Existing user role:', existingUser.role);

    const user = await this.usersService.update(existingUser.id, {
      googleId: googleAuthDto.googleId,
    });

    console.log('Updated user:', user);

    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Por segurança, não revelamos se o email existe ou não
      return { message: 'If the email exists, a reset link has been sent.' };
    }

    // Gerar token de reset que expira em 1 hora
    const resetToken = this.jwtService.sign(
      { email: user.email, sub: user.id, type: 'password-reset' },
      { expiresIn: '1h' },
    );

    // Enviar email com link de reset
    await this.notificationsService.sendPasswordResetEmail(
      user.email,
      user.name,
      resetToken,
    );

    return { message: 'If the email exists, a reset link has been sent.' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;

    try {
      const payload = this.jwtService.verify(token);

      if (payload.type !== 'password-reset') {
        throw new BadRequestException('Invalid reset token');
      }

      const user = await this.usersService.findByEmail(payload.email);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.usersService.update(user.id, { password: hashedPassword });

      return { message: 'Password reset successfully' };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new BadRequestException('Reset token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new BadRequestException('Invalid reset token');
      }
      throw error;
    }
  }
}
