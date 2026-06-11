import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import { User } from '../user/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RedisService } from '../../redis/redis.service';

const OTP_TTL = 600; // 10 minutes
const OTP_DATA_PREFIX = 'otp_data:';
const OTP_CODE_PREFIX = 'otp_code:';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  // ─── Internal helper ──────────────────────────────────────────────────────

  private createTransporter() {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  // ─── OTP flow ─────────────────────────────────────────────────────────────

  async sendVerificationCode(email: string, password: string) {
    // Check if email is already registered
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store pending registration data in Redis (password will be hashed at register time)
    await this.redisService.set(
      OTP_DATA_PREFIX + email,
      JSON.stringify({ email, password }),
      OTP_TTL,
    );
    await this.redisService.set(OTP_CODE_PREFIX + email, code, OTP_TTL);

    // Send email
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');

    if (!smtpUser || !smtpPass) {
      this.logger.warn('SMTP credentials not configured — skipping email send. OTP code: ' + code);
      return { message: 'Verification code generated (email not sent — SMTP not configured)', devCode: code };
    }

    const transporter = this.createTransporter();
    await transporter.sendMail({
      from: `"Gramdit" <${smtpUser}>`,
      to: email,
      subject: 'Gramdit — Email Verification Code',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a0a; color: #f0f0f0; border-radius: 16px; padding: 40px; border: 1px solid #1f1f1f;">
          <h1 style="font-size: 28px; font-weight: 300; letter-spacing: -0.5px; margin: 0 0 8px 0;">Gramdit</h1>
          <p style="color: #888; margin: 0 0 32px 0; font-size: 14px;">Email Verification</p>
          <p style="font-size: 16px; color: #ccc; margin: 0 0 24px 0;">Use the following 6-digit code to verify your email address. It expires in <strong style="color: #fff;">10 minutes</strong>.</p>
          <div style="background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px 0;">
            <span style="font-size: 40px; font-weight: 700; letter-spacing: 12px; color: #fff;">${code}</span>
          </div>
          <p style="font-size: 13px; color: #555; margin: 0;">If you did not request this code, you can safely ignore this email.</p>
        </div>
      `,
    });

    return { message: 'Verification code sent successfully' };
  }

  async verifyAndRegister(email: string, code: string) {
    // Retrieve stored OTP code
    const storedCode = await this.redisService.get(OTP_CODE_PREFIX + email);
    if (!storedCode) {
      throw new BadRequestException('Verification code has expired. Please request a new one.');
    }
    if (storedCode !== code) {
      throw new BadRequestException('Invalid verification code.');
    }

    // Retrieve pending registration data
    const dataRaw = await this.redisService.get(OTP_DATA_PREFIX + email);
    if (!dataRaw) {
      throw new BadRequestException('Registration data expired. Please start over.');
    }

    const { password } = JSON.parse(dataRaw) as { email: string; password: string };

    // Clean up Redis keys
    await this.redisService.del(OTP_CODE_PREFIX + email);
    await this.redisService.del(OTP_DATA_PREFIX + email);

    // Generate username from email prefix
    let cleanPrefix = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
    if (cleanPrefix.length < 3) cleanPrefix = 'user_' + cleanPrefix;
    const generatedUsername = (cleanPrefix + '_' + Math.random().toString(36).substring(2, 7)).substring(0, 30);

    const registerDto: RegisterDto = {
      username: generatedUsername,
      email,
      password,
    };

    return this.register(registerDto);
  }

  // ─── Core auth ────────────────────────────────────────────────────────────

  async register(registerDto: RegisterDto) {
    const { username, email, password, fullName } = registerDto;

    // Check if username or email already exists
    const existingUser = await this.userRepository.findOne({
      where: [{ username }, { email }],
    });

    if (existingUser) {
      if (existingUser.username === username) {
        throw new ConflictException('Username is already taken');
      }
      if (existingUser.email === email) {
        throw new ConflictException('Email is already registered');
      }
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = this.userRepository.create({
      username,
      email,
      passwordHash,
      fullName: fullName || null,
      isActive: true,
    });

    try {
      const savedUser = await this.userRepository.save(user);

      // Generate JWT for direct login after registration
      const payload = { sub: savedUser.id, username: savedUser.username, email: savedUser.email, role: savedUser.role };
      const accessToken = this.jwtService.sign(payload);

      return {
        user: {
          id: savedUser.id,
          username: savedUser.username,
          email: savedUser.email,
          fullName: savedUser.fullName,
          avatarUrl: savedUser.avatarUrl,
          role: savedUser.role,
        },
        accessToken,
      };
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Username or email already exists');
      }
      throw error;
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is deactivated');
    }

    const payload = { sub: user.id, username: user.username, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
      accessToken,
    };
  }

  async validateOAuthUser(profile: { email: string; fullName?: string; avatarUrl?: string }) {
    const { email, fullName, avatarUrl } = profile;

    let user = await this.userRepository.findOne({ where: { email } });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      // Generate username from email prefix
      let cleanPrefix = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
      if (cleanPrefix.length < 3) cleanPrefix = 'user_' + cleanPrefix;
      const generatedUsername = (cleanPrefix + '_' + Math.random().toString(36).substring(2, 7)).substring(0, 30);

      // Generate a secure random password hash
      const randomPassword = Math.random().toString(36) + Math.random().toString(36);
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(randomPassword, saltRounds);

      user = this.userRepository.create({
        username: generatedUsername,
        email,
        passwordHash,
        fullName: fullName || null,
        avatarUrl: avatarUrl || null,
        isActive: true,
      });

      user = await this.userRepository.save(user);
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is deactivated');
    }

    const payload = { sub: user.id, username: user.username, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
      accessToken,
      isNewUser,
    };
  }
}
