import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  NotFoundException,
  BadRequestException,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { MinioService } from '../storage/minio.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly minioService: MinioService,
  ) {}

  @Get(':userId/profile')
  @ApiOperation({ summary: 'Get user profile by ID' })
  @ApiParam({
    name: 'userId',
    description: 'User ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'john_doe',
        displayName: 'John Doe',
        bio: 'Learning English through BrainBattle!',
        avatarUrl: 'https://example.com/avatar.jpg',
        rankCode: 'BRONZE',
        status: 'ACTIVE',
        role: 'USER',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getProfile(@Param('userId') userId: string) {
    const profile = await this.usersService.getProfile(userId);
    if (!profile) {
      throw new NotFoundException('User not found');
    }
    return profile;
  }

  @Patch(':userId/profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user profile (displayName, bio only)' })
  @ApiParam({
    name: 'userId',
    description: 'User ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'john_doe',
        displayName: 'John Doe Updated',
        bio: 'Updated bio',
        avatarUrl: 'https://example.com/avatar.jpg',
        rankCode: 'BRONZE',
        status: 'ACTIVE',
        role: 'USER',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async updateProfile(
    @Param('userId') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    const profile = await this.usersService.updateProfile(userId, dto);
    if (!profile) {
      throw new NotFoundException('User not found');
    }
    return profile;
  }

  @Post(':userId/avatar')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiParam({
    name: 'userId',
    description: 'User ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file (max 5MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Avatar uploaded successfully',
    schema: {
      example: {
        avatarUrl: 'http://localhost:9000/brainbattle/avatars/user-id/1234567890-abc123.jpg',
        objectKey: 'avatars/user-id/1234567890-abc123.jpg',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request (missing file, invalid file type, file too large)',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async uploadAvatar(
    @Param('userId') userId: string,
    @UploadedFile() file?: {
      fieldname: string;
      originalname: string;
      encoding: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
    },
  ) {
    // Validate file
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Validate file type (image only)
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      throw new BadRequestException('File must be an image');
    }

    // Check if user exists
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate object key
    const objectKey = this.minioService.generateAvatarKey(
      userId,
      file.originalname,
    );

    // Upload to MinIO
    const avatarUrl = await this.minioService.uploadFile(
      objectKey,
      file.buffer,
      file.mimetype,
    );

    // Update user avatarUrl
    await this.usersService.updateAvatarUrl(userId, avatarUrl);

    return {
      avatarUrl,
      objectKey,
    };
  }
}

