import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const USER_PUBLIC_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  isEmailVerified: true,
  phone: true,
  documentNumber: true,
  createdAt: true,
} as const;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('El email ya está registrado');
    }

    const password = await bcrypt.hash(dto.password, 10);
    const verificationToken = randomBytes(32).toString('hex');

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password,
        role: Role.CLIENT,
        isEmailVerified: false,
        verificationToken,
      },
      select: USER_PUBLIC_SELECT,
    });

    const verificationUrl = await this.mail.sendVerificationEmail(
      user.email,
      verificationToken,
    );

    return {
      user,
      requiresVerification: true,
      message:
        'Te enviamos un correo de confirmación. Revisá tu bandeja de entrada para activar la cuenta.',
      // Solo se expone cuando no hay SMTP configurado (entorno de desarrollo).
      devVerificationUrl: this.mail.isConfigured ? undefined : verificationUrl,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.isEmailVerified) {
      throw new ForbiddenException(
        'Tu cuenta todavía no está verificada. Revisá el correo de confirmación para activarla.',
      );
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        phone: user.phone,
        documentNumber: user.documentNumber,
      },
      ...this.buildToken(user.id, user.email, user.role),
    };
  }

  async verifyEmail(token: string) {
    if (!token) {
      throw new BadRequestException('Falta el token de verificación');
    }

    const user = await this.prisma.user.findUnique({
      where: { verificationToken: token },
    });

    if (!user) {
      throw new BadRequestException(
        'El token de verificación es inválido o ya fue utilizado',
      );
    }

    const verified = await this.prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true, verificationToken: null },
      select: USER_PUBLIC_SELECT,
    });

    return {
      message: 'Cuenta verificada correctamente. Ya podés iniciar sesión.',
      user: verified,
    };
  }

  me(userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: USER_PUBLIC_SELECT,
    });
  }

  private buildToken(sub: number, email: string, role: Role) {
    const accessToken = this.jwt.sign({ sub, email, role });
    return {
      accessToken,
      expiresIn: this.config.get<string>('JWT_EXPIRES_IN') ?? '1d',
    };
  }
}
