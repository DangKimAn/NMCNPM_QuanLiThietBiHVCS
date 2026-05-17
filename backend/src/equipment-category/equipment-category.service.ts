import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateEquipmentCategoryDto } from './dto/create-equipment-category.dto';
import { UpdateEquipmentCategoryDto } from './dto/update-equipment-category.dto';

@Injectable()
export class EquipmentCategoryService {
  constructor(private readonly prisma: PrismaService) {}

  // Lấy danh sách loại thiết bị
  async findAll(search?: string) {
    const where: Prisma.EquipmentCategoryWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.equipmentCategory.findMany({
      where,
      orderBy: { categoryId: 'asc' },
      include: {
        // Đếm số thiết bị thuộc loại này
        _count: {
          select: {
            equipments: true,
          },
        },
      },
    });
  }

  // Lấy chi tiết một loại thiết bị
  async findOne(categoryId: number) {
    const category = await this.prisma.equipmentCategory.findUnique({
      where: { categoryId },
      include: {
        equipments: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Không tìm thấy loại thiết bị');
    }

    return category;
  }

  // Thêm loại thiết bị
  async create(dto: CreateEquipmentCategoryDto) {
    return this.prisma.equipmentCategory.create({
      data: dto,
    });
  }

  // Cập nhật loại thiết bị
  async update(categoryId: number, dto: UpdateEquipmentCategoryDto) {
    await this.findOne(categoryId);

    return this.prisma.equipmentCategory.update({
      where: { categoryId },
      data: dto,
    });
  }

  // Xóa loại thiết bị
  async remove(categoryId: number) {
    await this.findOne(categoryId);

    return this.prisma.equipmentCategory.delete({
      where: { categoryId },
    });
  }
}