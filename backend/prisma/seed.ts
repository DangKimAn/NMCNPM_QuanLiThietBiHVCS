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

  // Xóa dữ liệu cũ trước khi seed (nếu có)
  console.log('Đang xóa dữ liệu thiết bị cũ...');
  await prisma.notificationRead.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.formConfig.deleteMany();
  await prisma.equipmentTransfer.deleteMany();
  await prisma.report.deleteMany();
  await prisma.equipmentAllocation.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.activityLog.deleteMany();
  console.log('Đã xóa dữ liệu cũ.');

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

  // 2. Fetch danh sách phòng qua ROOM_API
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

  // Tìm Kho và các phòng khác
  let targetWarehouse = existingRoomsAPI.find((r: any) => r.name.toLowerCase().includes('kho'));
  if (!targetWarehouse && existingRoomsAPI.length > 0) {
    targetWarehouse = existingRoomsAPI[0];
  }
  if (!targetWarehouse) {
    console.log('Không tìm thấy phòng nào trên ROOM_API. Vui lòng tạo phòng/kho trước.');
    return;
  }

  const otherRooms = existingRoomsAPI.filter((r: any) => r.id !== targetWarehouse.id);
  console.log(`Kho: ${targetWarehouse.name} (ID: ${targetWarehouse.id}), Số phòng khác: ${otherRooms.length}`);

  // 3. Tạo thiết bị & phân bổ vào các phòng (giảm bớt số lượng)
  const equipmentTypes = [
    { name: 'Máy chiếu Panasonic', cat: 'Máy chiếu', unit: 'Cái', qty: 20 },
    { name: 'Máy lạnh Daikin 2HP', cat: 'Máy lạnh', unit: 'Cái', qty: 20 },
    { name: 'Bộ Loa & Amply', cat: 'Âm thanh', unit: 'Bộ', qty: 15 },
    { name: 'Micro không dây', cat: 'Âm thanh', unit: 'Cái', qty: 15 },
    { name: 'Bảng từ chống lóa', cat: 'Bảng từ', unit: 'Cái', qty: 20 },
    { name: 'Bàn ghế giảng viên', cat: 'Bàn ghế', unit: 'Bộ', qty: 20 },
    { name: 'Bàn ghế sinh viên', cat: 'Bàn ghế', unit: 'Bộ', qty: 50 },
  ];

  let totalCreated = 0;
  let seqCounter = 1;
  const roomQuantityMap = new Map<number, number>();

  for (const eqType of equipmentTypes) {
    const categoryId = createdCategories[eqType.cat];
    const acronym = eqType.cat.split(' ').filter((w: string) => w.trim().length > 0).map((w: string) => w.charAt(0).toUpperCase()).join('');

    for (let i = 1; i <= eqType.qty; i++) {
      const formattedCode = `${acronym}-PTITHCM-${String(seqCounter++).padStart(4, '0')}`;

      // Chọn phòng: 1/3 vào kho, 2/3 phân bổ vào các phòng khác
      const assignToWarehouse = (i % 3 === 1) || otherRooms.length === 0;
      const targetRoom = assignToWarehouse ? targetWarehouse : otherRooms[(i - 1) % otherRooms.length];

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

      await prisma.equipmentAllocation.create({
        data: {
          equipmentId: equipment.equipmentId,
          roomId: targetRoom.id,
          allocatedAt: new Date(),
          note: 'Phân bổ ban đầu',
        }
      });

      const currentQty = roomQuantityMap.get(targetRoom.id) || 0;
      roomQuantityMap.set(targetRoom.id, currentQty + 1);
      totalCreated++;
    }

    console.log(`Đã tạo ${eqType.qty} thiết bị: ${eqType.name}`);
  }

  // Cập nhật số lượng trên ROOM_API
  for (const [roomId, totalQuantity] of roomQuantityMap.entries()) {
    try {
      await fetch(`${ROOM_API_URL}/${roomId}/equipment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', amount: totalQuantity }),
      });
    } catch (e) {
      console.error(`Lỗi cập nhật ROOM_API cho phòng ${roomId}:`, e);
    }
  }
  console.log(`Tổng số thiết bị đã tạo: ${totalCreated}`);

  // 4. Tạo cấu hình form mặc định
  console.log('Đang tạo cấu hình form mặc định...');

  const formConfigs: { formKey: string; fieldKey: string; label: string; fieldType: string; required: boolean; visible: boolean; sortOrder: number; options: string | null; placeholder: string | null }[] = [
    { formKey: 'incident_report', fieldKey: 'roomId', label: 'Phòng học', fieldType: 'select', required: true, visible: true, sortOrder: 1, options: null, placeholder: 'Tìm kiếm và chọn phòng...' },
    { formKey: 'incident_report', fieldKey: 'equipmentId', label: 'Thiết bị gặp sự cố', fieldType: 'select', required: true, visible: true, sortOrder: 2, options: null, placeholder: 'Tìm kiếm và chọn thiết bị...' },
    { formKey: 'incident_report', fieldKey: 'reportContent', label: 'Nội dung phản ánh', fieldType: 'textarea', required: true, visible: true, sortOrder: 3, options: null, placeholder: 'Ví dụ: Máy chiếu không lên hình, loa bị rè, điều hòa không hoạt động...' },
    { formKey: 'equipment', fieldKey: 'equipmentCode', label: 'Mã thiết bị', fieldType: 'text', required: true, visible: true, sortOrder: 1, options: null, placeholder: 'Để trống để tự động sinh mã' },
    { formKey: 'equipment', fieldKey: 'name', label: 'Tên thiết bị', fieldType: 'text', required: true, visible: true, sortOrder: 2, options: null, placeholder: 'VD: Máy chiếu Panasonic' },
    { formKey: 'equipment', fieldKey: 'categoryId', label: 'Loại thiết bị', fieldType: 'select', required: true, visible: true, sortOrder: 3, options: null, placeholder: 'Chọn loại...' },
    { formKey: 'equipment', fieldKey: 'room', label: 'Phòng học', fieldType: 'select', required: true, visible: true, sortOrder: 4, options: null, placeholder: 'Chọn phòng...' },
    { formKey: 'equipment', fieldKey: 'status', label: 'Trạng thái', fieldType: 'select', required: true, visible: true, sortOrder: 5, options: JSON.stringify(['Hoạt động', 'Báo hỏng', 'Đang sửa', 'Bảo trì', 'Thanh lý']), placeholder: 'Chọn trạng thái...' },
    { formKey: 'equipment', fieldKey: 'importDate', label: 'Ngày nhập', fieldType: 'date', required: false, visible: true, sortOrder: 6, options: null, placeholder: null },
    { formKey: 'equipment', fieldKey: 'note', label: 'Ghi chú', fieldType: 'textarea', required: false, visible: true, sortOrder: 7, options: null, placeholder: 'Nhập ghi chú...' },
    { formKey: 'user_create', fieldKey: 'fullName', label: 'Họ và tên', fieldType: 'text', required: true, visible: true, sortOrder: 1, options: null, placeholder: 'VD: Nguyễn Văn A' },
    { formKey: 'user_create', fieldKey: 'username', label: 'Tên đăng nhập', fieldType: 'text', required: true, visible: true, sortOrder: 2, options: null, placeholder: 'VD: nguyenvana' },
    { formKey: 'user_create', fieldKey: 'email', label: 'Email', fieldType: 'email', required: true, visible: true, sortOrder: 3, options: null, placeholder: 'VD: a@hvcs.edu.vn' },
    { formKey: 'user_create', fieldKey: 'password', label: 'Mật khẩu', fieldType: 'password', required: true, visible: true, sortOrder: 4, options: null, placeholder: 'Nhập mật khẩu...' },
    { formKey: 'user_create', fieldKey: 'phoneNumber', label: 'Số điện thoại', fieldType: 'text', required: false, visible: true, sortOrder: 5, options: null, placeholder: 'VD: 0123456789' },
    { formKey: 'user_create', fieldKey: 'role', label: 'Vai trò', fieldType: 'select', required: true, visible: true, sortOrder: 6, options: JSON.stringify(['ADMIN', 'MANAGER', 'TEACHER', 'STUDENT']), placeholder: 'Chọn vai trò...' },
    { formKey: 'user_create', fieldKey: 'status', label: 'Trạng thái', fieldType: 'select', required: false, visible: true, sortOrder: 7, options: JSON.stringify(['Hoạt động', 'Đã khóa']), placeholder: 'Chọn trạng thái...' },
    { formKey: 'incident_handle', fieldKey: 'status', label: 'Trạng thái xử lý', fieldType: 'select', required: true, visible: true, sortOrder: 1, options: JSON.stringify(['Mới tiếp nhận', 'Đang xử lý', 'Đã xử lý', 'Từ chối']), placeholder: null },
    { formKey: 'incident_handle', fieldKey: 'handlerName', label: 'Người xử lý', fieldType: 'text', required: true, visible: true, sortOrder: 2, options: null, placeholder: 'VD: Cán bộ QLTB' },
    { formKey: 'incident_handle', fieldKey: 'handlerNote', label: 'Ghi chú xử lý', fieldType: 'textarea', required: false, visible: true, sortOrder: 3, options: null, placeholder: 'VD: Đã kiểm tra, cần thay dây HDMI...' },
    { formKey: 'notification', fieldKey: 'title', label: 'Tiêu đề', fieldType: 'text', required: true, visible: true, sortOrder: 1, options: null, placeholder: 'Nhập tiêu đề thông báo...' },
    { formKey: 'notification', fieldKey: 'targetRole', label: 'Gửi đến', fieldType: 'select', required: false, visible: true, sortOrder: 2, options: JSON.stringify(['ALL', 'ADMIN', 'MANAGER', 'TEACHER', 'STUDENT']), placeholder: 'Chọn đối tượng...' },
    { formKey: 'notification', fieldKey: 'content', label: 'Nội dung', fieldType: 'textarea', required: true, visible: true, sortOrder: 3, options: null, placeholder: 'Nhập nội dung thông báo...' },
  ];

  for (const config of formConfigs) {
    await prisma.formConfig.upsert({
      where: {
        formKey_fieldKey: {
          formKey: config.formKey,
          fieldKey: config.fieldKey,
        },
      },
      update: {
        label: config.label,
        fieldType: config.fieldType,
        required: config.required,
        visible: config.visible,
        sortOrder: config.sortOrder,
        options: config.options,
        placeholder: config.placeholder,
      },
      create: config,
    });
  }
  console.log(`Đã tạo ${formConfigs.length} cấu hình fields cho các form.`);

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
