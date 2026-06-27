import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateFormConfigDto } from './dto/update-form-config.dto';

@Injectable()
export class FormConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async getConfig(formKey: string) {
    const configs = await this.prisma.formConfig.findMany({
      where: { formKey },
      orderBy: { sortOrder: 'asc' },
    });

    if (configs.length === 0) {
      throw new NotFoundException(`Không tìm thấy cấu hình form: ${formKey}`);
    }

    return configs;
  }

  async getAllForms() {
    const configs = await this.prisma.formConfig.groupBy({
      by: ['formKey'],
    });
    return configs.map((c) => c.formKey);
  }

  async updateConfig(formKey: string, dto: UpdateFormConfigDto) {
    const existing = await this.prisma.formConfig.findMany({
      where: { formKey },
    });

    const existingKeys = new Set(existing.map((f) => f.fieldKey));
    const incomingKeys = new Set(dto.fields.map((f) => f.fieldKey));

    for (const field of dto.fields) {
      if (existingKeys.has(field.fieldKey)) {
        await this.prisma.formConfig.updateMany({
          where: { formKey, fieldKey: field.fieldKey },
          data: {
            label: field.label,
            fieldType: field.fieldType,
            required: field.required,
            visible: field.visible,
            sortOrder: field.sortOrder,
            options: field.options ?? null,
            placeholder: field.placeholder ?? null,
          },
        });
      } else {
        await this.prisma.formConfig.create({
          data: {
            formKey,
            fieldKey: field.fieldKey,
            label: field.label,
            fieldType: field.fieldType,
            required: field.required,
            visible: field.visible,
            sortOrder: field.sortOrder,
            options: field.options ?? null,
            placeholder: field.placeholder ?? null,
          },
        });
      }
    }

    const removedKeys = [...existingKeys].filter((k) => !incomingKeys.has(k));
    if (removedKeys.length > 0) {
      await this.prisma.formConfig.deleteMany({
        where: { formKey, fieldKey: { in: removedKeys } },
      });
    }

    return this.getConfig(formKey);
  }

  async deleteField(formKey: string, fieldKey: string) {
    await this.prisma.formConfig.deleteMany({
      where: { formKey, fieldKey },
    });
    return this.getConfig(formKey);
  }
}
