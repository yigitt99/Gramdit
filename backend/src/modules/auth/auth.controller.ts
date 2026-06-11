import { Body, Controller, HttpCode, HttpStatus, Post, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  async sendOtp(@Body() sendOtpDto: SendOtpDto) {
    return this.authService.sendVerificationCode(sendOtpDto.email, sendOtpDto.password);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.CREATED)
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyAndRegister(verifyOtpDto.email, verifyOtpDto.code);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Guards handle redirection to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: any, @Res() res: Response) {
    const { user, accessToken, isNewUser } = req.user;
    const redirectUrl = this.configService.get<string>('FRONTEND_OAUTH_REDIRECT_URL', 'http://localhost:5173/login');
    const target = `${redirectUrl}?token=${accessToken}&user=${encodeURIComponent(JSON.stringify(user))}${isNewUser ? '&isNewUser=true' : ''}`;
    return res.redirect(target);
  }

  @Get('apple')
  @UseGuards(AuthGuard('apple'))
  async appleAuth() {
    // Guards handle redirection to Apple
  }

  @Post('apple/callback')
  @UseGuards(AuthGuard('apple'))
  async appleAuthCallback(@Req() req: any, @Res() res: Response) {
    const { user, accessToken, isNewUser } = req.user;
    const redirectUrl = this.configService.get<string>('FRONTEND_OAUTH_REDIRECT_URL', 'http://localhost:5173/login');
    const target = `${redirectUrl}?token=${accessToken}&user=${encodeURIComponent(JSON.stringify(user))}${isNewUser ? '&isNewUser=true' : ''}`;
    return res.redirect(target);
  }
}
