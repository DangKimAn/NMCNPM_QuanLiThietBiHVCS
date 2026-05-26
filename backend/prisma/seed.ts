import { PrismaClient, RoomStatus, EquipmentStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Bắt đầu seed dữ liệu phòng học và thiết bị...');

  // 1. Tạo các danh mục thiết bị (Equipment Category)
  const categories = [
    { name: 'Máy chiếu', description: 'Máy chiếu phục vụ giảng dạy' },
    { name: 'Máy lạnh', description: 'Máy điều hòa nhiệt độ' },
    { name: 'Âm thanh', description: 'Loa, amply, micro' },
    { name: 'Bảng từ', description: 'Bảng viết phấn/bút lông' },
    { name: 'Bàn ghế', description: 'Bàn ghế giáo viên và sinh viên' },
  ];

  const createdCategories: Record<string, number> = {};
  for (const cat of categories) {
    let category = await prisma.equipmentCategory.findFirst({
      where: { name: cat.name }
    });
    if (!category) {
      category = await prisma.equipmentCategory.create({
        data: { name: cat.name, description: cat.description }
      });
    }
    createdCategories[cat.name] = category.categoryId;
  }
  console.log('Đã tạo danh mục thiết bị.');

  // 2. Tạo các phòng học
  const roomsToCreate: any[] = [];

  // Khu A
  // Tầng 1: 8 phòng: 2A01 - 2A08
  for (let i = 1; i <= 8; i++) {
    roomsToCreate.push({
      code: `2A0${i}`,
      name: `Phòng 2A0${i}`,
      building: 'A',
      floor: 1,
      capacity: 50,
      status: RoomStatus.AVAILABLE,
    });
  }
  // Tầng 2, 3, 4: Mỗi tầng 6 phòng: 2A11-2A16, 2A21-2A26, 2A31-2A36
  for (let floor = 2; floor <= 4; floor++) {
    for (let i = 1; i <= 6; i++) {
      const fString = floor - 1; // 2A11 for floor 2
      roomsToCreate.push({
        code: `2A${fString}${i}`,
        name: `Phòng 2A${fString}${i}`,
        building: 'A',
        floor: floor,
        capacity: 50,
        status: RoomStatus.AVAILABLE,
      });
    }
  }

  // Khu B: 4 tầng, mỗi tầng 6 phòng: 2B01-2B06, ..., 2B31-2B36
  for (let floor = 1; floor <= 4; floor++) {
    for (let i = 1; i <= 6; i++) {
      const fString = floor - 1;
      roomsToCreate.push({
        code: `2B${fString}${i}`,
        name: `Phòng 2B${fString}${i}`,
        building: 'B',
        floor: floor,
        capacity: 50,
        status: RoomStatus.AVAILABLE,
      });
    }
  }

  // Khu E: 4 tầng, mỗi tầng 6 phòng: 2E01-2E06, ..., 2E31-2E36
  for (let floor = 1; floor <= 4; floor++) {
    for (let i = 1; i <= 6; i++) {
      const fString = floor - 1;
      roomsToCreate.push({
        code: `2E${fString}${i}`,
        name: `Phòng 2E${fString}${i}`,
        building: 'E',
        floor: floor,
        capacity: 50,
        status: RoomStatus.AVAILABLE,
      });
    }
  }

  // Khu D: 1 tầng, 6 phòng: 2D01-2D06
  for (let i = 1; i <= 6; i++) {
    roomsToCreate.push({
      code: `2D0${i}`,
      name: `Phòng 2D0${i}`,
      building: 'D',
      floor: 1,
      capacity: 50,
      status: RoomStatus.AVAILABLE,
    });
  }

  // Phòng kho 01 - 03
  for (let i = 1; i <= 3; i++) {
    roomsToCreate.push({
      code: `Kho 0${i}`,
      name: `Kho Lưu Trữ 0${i}`,
      building: 'Kho',
      floor: 1,
      capacity: 100,
      status: RoomStatus.AVAILABLE,
    });
  }

  const allRooms: Record<string, number> = {};
  for (const room of roomsToCreate) {
    const created = await prisma.room.upsert({
      where: { code: room.code },
      update: {},
      create: room,
    });
    allRooms[room.code] = created.roomId;
  }
  console.log(`Đã tạo ${roomsToCreate.length} phòng học/kho.`);

  // 3. Tạo thiết bị cơ bản & phân bổ
  const equipmentTypes = [
    { name: 'Máy chiếu Panasonic', cat: 'Máy chiếu', unit: 'Cái', qtyPerRoom: 1 },
    { name: 'Máy lạnh Daikin 2HP', cat: 'Máy lạnh', unit: 'Cái', qtyPerRoom: 2 },
    { name: 'Bộ Loa & Amply', cat: 'Âm thanh', unit: 'Bộ', qtyPerRoom: 1 },
    { name: 'Micro không dây', cat: 'Âm thanh', unit: 'Cái', qtyPerRoom: 1 },
    { name: 'Bảng từ chống lóa', cat: 'Bảng từ', unit: 'Cái', qtyPerRoom: 1 },
    { name: 'Bàn ghế giảng viên', cat: 'Bàn ghế', unit: 'Bộ', qtyPerRoom: 1 },
    { name: 'Bàn ghế sinh viên', cat: 'Bàn ghế', unit: 'Bộ', qtyPerRoom: 25 },
  ];

  const classroomCodes = Object.keys(allRooms).filter(c => !c.startsWith('Kho'));
  const totalClassrooms = classroomCodes.length;

  for (const eqType of equipmentTypes) {
    const totalQty = eqType.qtyPerRoom * totalClassrooms + 50; // Dự phòng 50 cái
    const categoryId = createdCategories[eqType.cat];

    const equipment = await prisma.equipment.create({
      data: {
        name: eqType.name,
        categoryId: categoryId,
        quantity: totalQty,
        unit: eqType.unit,
        status: EquipmentStatus.GOOD,
        description: `Trang bị tiêu chuẩn cho các phòng học`,
      },
    });

    console.log(`Tạo thiết bị: ${equipment.name} (SL: ${equipment.quantity})`);

    const allocationsData: any[] = [];
    for (const code of classroomCodes) {
      allocationsData.push({
        equipmentId: equipment.equipmentId,
        roomId: allRooms[code],
        quantity: eqType.qtyPerRoom,
        allocatedAt: new Date(),
        note: 'Cấp phát ban đầu',
      });
    }

    // Kho 01
    allocationsData.push({
      equipmentId: equipment.equipmentId,
      roomId: allRooms['Kho 01'],
      quantity: 50,
      allocatedAt: new Date(),
      note: 'Nhập kho dự phòng',
    });

    await prisma.equipmentAllocation.createMany({
      data: allocationsData
    });
  }

  console.log('Hoàn thành seed dữ liệu!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
