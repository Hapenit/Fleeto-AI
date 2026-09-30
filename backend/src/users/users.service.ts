import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto.js';
import * as bcrypt from 'bcrypt';
import { Role, Status } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        email: createUserDto.email,
        phone: createUserDto.phone,
        passwordHash,
        role: createUserDto.role as Role,
        status: createUserDto.status as Status,
      },
    });

    // Exclude password hash
    const { passwordHash: _, ...result } = user;
    return result;
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        avatarUrl: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
    return users;
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...updateUserDto,
        ...(updateUserDto.role && { role: updateUserDto.role as Role }),
        ...(updateUserDto.status && { status: updateUserDto.status as Status }),
      },
    });
    const { passwordHash: _, ...result } = user;
    return result;
  }

  async updateStatus(id: string, status: string) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { status: status as Status },
    });
    const { passwordHash: _, ...result } = user;
    return result;
  }

  async updateLastLogin(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  async remove(id: string) {
    // Soft deactivate per requirements
    const user = await this.prisma.user.update({
      where: { id },
      data: { status: Status.INACTIVE },
    });
    const { passwordHash: _, ...result } = user;
    return result;
  }
}
