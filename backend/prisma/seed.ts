import { PrismaClient, EquipmentStatus } from '@prisma/client';
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

  // 2. Fetch kho đầu tiên qua ROOM_API
  const ROOM_API_URL = process.env.ROOM_API ? `${process.env.ROOM_API}/api/rooms` : 'http://localhost:3000/api/rooms';
  let existingRoomsAPI: any[] = [];
  try {
    const res = await fetch(ROOM_API_URL);
    if (res.ok) {
      const data = await res.json();
      existingRoomsAPI = data.data || [];
    }
  } catch (e) {
    console.error('Không thể kết nối đến ROOM_API:', e);
  }

  // Tìm Kho đầu tiên (dựa vào tên)
  let targetWarehouse = existingRoomsAPI.find((r: any) => r.name.toLowerCase().includes('kho'));
  if (!targetWarehouse && existingRoomsAPI.length > 0) {
    targetWarehouse = existingRoomsAPI[0]; // fallback nếu không có phòng nào tên là Kho
  }

  if (!targetWarehouse) {
    console.log('Không tìm thấy Kho nào trên ROOM_API. Vui lòng tạo phòng/kho trước trên ROOM_API.');
    return;
  }
  console.log(`Đã chọn kho để thêm thiết bị: ${targetWarehouse.name} (ID: ${targetWarehouse.id})`);

  // 3. Tạo thiết bị cơ bản & phân bổ toàn bộ vào kho
  const equipmentTypes = [
    { code: 'mc-PTTITHCM-0001', name: 'Máy chiếu Panasonic', cat: 'Máy chiếu', unit: 'Cái', qty: 50 },
    { code: 'ml-PTTITHCM-0002', name: 'Máy lạnh Daikin 2HP', cat: 'Máy lạnh', unit: 'Cái', qty: 50 },
    { code: 'at-PTTITHCM-0003', name: 'Bộ Loa & Amply', cat: 'Âm thanh', unit: 'Bộ', qty: 30 },
    { code: 'at-PTTITHCM-0004', name: 'Micro không dây', cat: 'Âm thanh', unit: 'Cái', qty: 30 },
    { code: 'bt-PTTITHCM-0005', name: 'Bảng từ chống lóa', cat: 'Bảng từ', unit: 'Cái', qty: 50 },
    { code: 'bc-PTTITHCM-0006', name: 'Bàn ghế giảng viên', cat: 'Bàn ghế', unit: 'Bộ', qty: 50 },
    { code: 'bc-PTTITHCM-0007', name: 'Bàn ghế sinh viên', cat: 'Bàn ghế', unit: 'Bộ', qty: 500 },
  ];

  for (const eqType of equipmentTypes) {
    const categoryId = createdCategories[eqType.cat];
    const acronym = eqType.cat.split(' ').filter((w: string) => w.trim().length > 0).map((w: string) => w.charAt(0).toUpperCase()).join('');

    for (let i = 1; i <= eqType.qty; i++) {
      const formattedCode = `${acronym}-PTITHCM-${eqType.code}-${i.toString().padStart(3, '0')}`;

      // Tạo thiết bị
      const equipment = await prisma.equipment.create({
        data: {
          equipmentCode: formattedCode,
          name: `${eqType.name} #${i}`,
          categoryId: categoryId,
          unit: eqType.unit,
          status: EquipmentStatus.GOOD,
          description: `Trang bị tiêu chuẩn`,
        },
      });

      // Phân bổ toàn bộ thiết bị này vào kho
      await prisma.equipmentAllocation.create({
        data: {
          equipmentId: equipment.equipmentId,
          roomId: targetWarehouse.id,
          allocatedAt: new Date(),
          note: 'Nhập kho ban đầu',
        }
      });
    }

    console.log(`Đã tạo và phân bổ ${eqType.qty} thiết bị: ${eqType.name}`);

    // Cập nhật số lượng trên ROOM_API
    try {
      await fetch(`${ROOM_API_URL}/${targetWarehouse.id}/equipment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', amount: eqType.qty }),
      });
    } catch (e) { }
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
