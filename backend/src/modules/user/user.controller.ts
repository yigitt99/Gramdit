import {
  Body,
  Controller,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

const UPLOADS_DIR = join(process.cwd(), 'uploads', 'avatars');

// Ensure uploads directory exists
if (!existsSync(UPLOADS_DIR)) {
  mkdirSync(UPLOADS_DIR, { recursive: true });
}

const multerStorage = diskStorage({
  destination: (_req: any, _file: any, cb: any) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req: any, file: any, cb: any) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + extname(file.originalname));
  },
});

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  private extractUserId(req: Request): string {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }
    const token = authHeader.split(' ')[1];
    const payload = this.userService.verifyToken(token);
    return payload.sub;
  }

  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  async updateProfile(@Req() req: Request, @Body() dto: UpdateProfileDto) {
    const userId = this.extractUserId(req);
    return this.userService.updateProfile(userId, dto);
  }

  @Post('avatar')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: multerStorage,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (_req: any, file: any, cb: any) => {
        const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
        if (!allowed.test(extname(file.originalname))) {
          return cb(new BadRequestException('Only image files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadAvatar(
    @Req() req: Request,
    @UploadedFile() file: any,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const userId = this.extractUserId(req);

    // Build public URL — served statically from /uploads/avatars/
    const avatarUrl = `http://localhost:3000/uploads/avatars/${file.filename}`;

    // Persist the URL in the database
    const updated = await this.userService.updateProfile(userId, { avatarUrl });
    return { avatarUrl: updated.avatarUrl };
  }
}
