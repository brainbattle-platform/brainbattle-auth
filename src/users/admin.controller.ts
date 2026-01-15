import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  NotFoundException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { AdminListQueryDto } from './dto/admin-list-query.dto';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly usersService: UsersService) {}

  @Get('users')
  @ApiOperation({ summary: 'List users with pagination, search, and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'BANNED'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Users list retrieved successfully',
    schema: {
      example: {
        items: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            username: 'john_doe',
            displayName: 'John Doe',
            rankCode: 'BRONZE',
            status: 'ACTIVE',
            role: 'USER',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        total: 100,
        page: 1,
        limit: 20,
      },
    },
  })
  async listUsers(@Query() query: AdminListQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    return this.usersService.listAdminUsers(
      page,
      limit,
      query.status,
      query.search,
    );
  }

  @Get('users/:userId')
  @ApiOperation({ summary: 'Get user by ID (admin view)' })
  @ApiParam({
    name: 'userId',
    description: 'User ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'john_doe',
        email: 'john@example.com',
        displayName: 'John Doe',
        bio: 'Learning English',
        avatarUrl: 'https://example.com/avatar.jpg',
        rankCode: 'BRONZE',
        status: 'ACTIVE',
        role: 'USER',
        emailVerified: '2024-01-01T00:00:00.000Z',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getUser(@Param('userId') userId: string) {
    const user = await this.usersService.getAdminUser(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @Patch('users/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user (admin - all fields allowed)' })
  @ApiParam({
    name: 'userId',
    description: 'User ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: AdminUpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'john_doe',
        email: 'john@example.com',
        displayName: 'John Doe Updated',
        bio: 'Updated bio',
        avatarUrl: 'https://example.com/avatar.jpg',
        rankCode: 'GOLD',
        status: 'ACTIVE',
        role: 'ADMIN',
        emailVerified: '2024-01-01T00:00:00.000Z',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async updateUser(
    @Param('userId') userId: string,
    @Body() dto: AdminUpdateUserDto,
  ) {
    const user = await this.usersService.updateAdminUser(userId, dto);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @Delete('users/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft ban user (set status to BANNED)' })
  @ApiParam({
    name: 'userId',
    description: 'User ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'User banned successfully',
    schema: {
      example: {
        ok: true,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async banUser(@Param('userId') userId: string) {
    const user = await this.usersService.banUser(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return { ok: true };
  }
}

