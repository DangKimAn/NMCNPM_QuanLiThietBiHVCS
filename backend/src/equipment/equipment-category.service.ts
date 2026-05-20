import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateEquipmentCategoryDto } from './dto/create-equipment-category.dto';
import { UpdateEquipmentCategoryDto } from './dto/update-equipment-category.dto';

@Injectable()
export class EquipmentCategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateEquipmentCategoryDto) {
    return this.prisma.equipmentCategory.create({
      data: {
        name: createDto.name,
        description: createDto.description,
      },
    });
  }

  async findAll() {
    return this.prisma.equipmentCategory.findMany({
      orderBy: {
        categoryId: 'asc',
      },
    });
  }

  async findOne(id: number) {
    const category = await this.prisma.equipmentCategory.findUnique({
      where: {
        categoryId: id,
      },
    });

    if (!category) {
      throw new NotFoundException(`Không tìm thấy loại thiết bị có id = ${id}`);
    }

    return category;
  }

  async update(id: number, updateDto: UpdateEquipmentCategoryDto) {
    await this.findOne(id);

    return this.prisma.equipmentCategory.update({
      where: {
        categoryId: id,
      },
      data: {
        name: updateDto.name,
        description: updateDto.description,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    const equipmentCount = await this.prisma.equipment.count({
      where: {
        categoryId: id,
      },
    });

    if (equipmentCount > 0) {
      throw new BadRequestException(
        'Không thể xóa loại thiết bị này vì đang có thiết bị thuộc loại này.',
      );
    }

    return this.prisma.equipmentCategory.delete({
      where: {
        categoryId: id,
      },
    });
  }
}