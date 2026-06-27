import { PrismaClient, RoomStatus, EquipmentStatus } from '@prisma/client';
import { hashPassword } from '../common/bcrypt';
import 'dotenv/config';
import {
  SystemPermission,
  FacilityPermission,
  BorrowRequestPermission,
  IncidentReportPermission,
  DashboardPermission,
  AllPermissions
} from '../common/permissionsName.dto';
import { PassThrough } from 'stream';
import { PrismaService } from './prisma.service';
import { ConfigService } from '@nestjs/config';
// const prisma = new PrismaClient({
//   datasources: {
//     db: {
//       url: process.env.DATABASE_URL, 
//     },
//   },
// });
const prisma = new PrismaService(new ConfigService());
const roleConfigs = [
  {
    roleName: 'ADMIN',
    description: 'Quản trị viên hệ thống - Toàn quyền',
    permissions: Object.values(AllPermissions),
  },
  {
    roleName: 'MANAGER',
    description: 'Quản lý Cơ sở vật chất',
    permissions: [
      SystemPermission.VIEW_USER,
      ...Object.values(FacilityPermission),
      ...Object.values(BorrowRequestPermission),
      ...Object.values(IncidentReportPermission),
      DashboardPermission.VIEW_DASHBOARD,
      DashboardPermission.EXPORT_REPORT,
    ],
  },
  {
    roleName: 'TEACHER',
    description: 'Giáo viên / Giảng viên',
    permissions: [
      FacilityPermission.VIEW_EQUIPMENT,
      FacilityPermission.VIEW_ROOM,
      BorrowRequestPermission.CREATE_BORROW_REQUEST,
      BorrowRequestPermission.VIEW_BORROW_REQUEST,
      IncidentReportPermission.CREATE_REPORT,
      IncidentReportPermission.VIEW_REPORT,
      IncidentReportPermission.SEND_FEEDBACK,
    ],
  },
  {
    roleName: 'STUDENT',
    description: 'Học sinh / Sinh viên',
    permissions: [
      FacilityPermission.VIEW_EQUIPMENT,
      BorrowRequestPermission.CREATE_BORROW_REQUEST,
      BorrowRequestPermission.VIEW_BORROW_REQUEST,
      IncidentReportPermission.CREATE_REPORT,
    ],
  },
];

function prettier(_string: string, width: number) {
  const mid = (width - _string.length) / 2
  var rs = ''
  for (var i = 0; i < mid; i++)
    rs += ' '
  rs += _string
  while (rs.length < width)
    rs += ' '
  return rs
}

async function main() {
  console.log(' Bắt đầu chạy Seed dữ liệu...');

  // --------------------------------------------------------
  // 1. TẠO PERMISSIONS (QUYỀN)
  // --------------------------------------------------------
  const permissionValues = Object.values(AllPermissions);
  for (const pName of permissionValues) {
    await prisma.permission.upsert({
      where: { permissionName: pName },
      update: {},
      create: {
        permissionName: pName,
        description: `Quyền: ${pName}`,
      },
    });
  }
  console.log(' Đã nạp xong bảng Permission!');

  // Lấy danh sách Permission từ DB để map ID
  const allDbPermissions = await prisma.permission.findMany();

  const roleIds: Record<string, number> = {};

  // --------------------------------------------------------
  // 2. TẠO ROLES VÀ GÁN QUYỀN VÀO BẢNG TRUNG GIAN
  // --------------------------------------------------------
  for (const config of roleConfigs) {
    const role = await prisma.role.upsert({
      where: { roleName: config.roleName },
      update: { description: config.description },
      create: {
        roleName: config.roleName,
        description: config.description,
      },
    });

    roleIds[config.roleName] = role.roleId;

    const permsToAssign = allDbPermissions.filter((p) =>
      config.permissions.includes(p.permissionName as any)
    );

    for (const perm of permsToAssign) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.roleId,
            permissionId: perm.permissionId,
          },
        },
        update: {},
        create: {
          roleId: role.roleId,
          permissionId: perm.permissionId,
        },
      });
    }
    console.log(`Đã tạo Role [${config.roleName}] và cấp ${permsToAssign.length} quyền.`);
  }

  // --------------------------------------------------------
  // 3. TẠO DỮ LIỆU USER MẪU
  // --------------------------------------------------------
  console.log('Đang khởi tạo các User mặc định...');



  const defaultUsers = [
    {
      username: 'manager_01',
      email: 'manager@system.com',
      roleName: 'MANAGER',
      password: 'passwordmanagerdefault'
    },
    {
      username: 'admin_super',
      email: 'admin@system.com',
      roleName: 'ADMIN',
      password: 'passwordadmindefault'
    },
    {
      username: 'teacher_01',
      email: 'teacher@system.com',
      roleName: 'TEACHER',
      password: 'passwordteacherdefault'
    },
    {
      username: 'student_01',
      email: 'student@system.com',
      roleName: 'STUDENT',
      password: 'passwordstudentdefault'
    }
  ];

  for (const user of defaultUsers) {
    const roleId = roleIds[user.roleName];

    await prisma.user.upsert({
      where: { username: user.username },
      update: {},
      create: {
        username: user.username,
        email: user.email,
        hashedPassword: await hashPassword(user.password),
        roleId: roleId,
        status: 'ACTIVE',
      },
    });
  }

  // --------------------------------------------------------
  // 4. TẠO CÁC DANH MỤC THIẾT BỊ VÀ PHÒNG HỌC
  // --------------------------------------------------------
  console.log('Bắt đầu seed dữ liệu phòng học và thiết bị...');
  const categories = [
    { name: 'Máy chiếu', description: 'Máy chiếu phục vụ giảng dạy' },
    { name: 'Máy lạnh', description: 'Máy điều hòa nhiệt độ' },
    { name: 'Âm thanh', description: 'Loa, amply, micro' },
    { name: 'Bảng từ', description: 'Bảng viết phấn/bút lông' },
    { name: 'Bàn ghế', description: 'Bàn ghế giáo viên và sinh viên' },
  ];

  const createdCategories: Record<string, number> = {};
  for (const cat of categories) {
    const existingCat = await prisma.equipmentCategory.findFirst({
      where: { name: cat.name }
    });
    if (existingCat) {
      createdCategories[cat.name] = existingCat.categoryId;
    } else {
      const newCat = await prisma.equipmentCategory.create({
        data: { name: cat.name, description: cat.description }
      });
      createdCategories[cat.name] = newCat.categoryId;
    }
  }

  const roomsToCreate: any[] = [];
  for (let i = 1; i <= 8; i++) { roomsToCreate.push({ code: `2A0${i}`, name: `Phòng 2A0${i}`, building: 'A', floor: 1, capacity: 50, status: RoomStatus.AVAILABLE }); }
  for (let floor = 2; floor <= 4; floor++) { for (let i = 1; i <= 6; i++) { roomsToCreate.push({ code: `2A${floor - 1}${i}`, name: `Phòng 2A${floor - 1}${i}`, building: 'A', floor: floor, capacity: 50, status: RoomStatus.AVAILABLE }); } }
  for (let floor = 1; floor <= 4; floor++) { for (let i = 1; i <= 6; i++) { roomsToCreate.push({ code: `2B${floor - 1}${i}`, name: `Phòng 2B${floor - 1}${i}`, building: 'B', floor: floor, capacity: 50, status: RoomStatus.AVAILABLE }); } }
  for (let floor = 1; floor <= 4; floor++) { for (let i = 1; i <= 6; i++) { roomsToCreate.push({ code: `2E${floor - 1}${i}`, name: `Phòng 2E${floor - 1}${i}`, building: 'E', floor: floor, capacity: 50, status: RoomStatus.AVAILABLE }); } }
  for (let i = 1; i <= 6; i++) { roomsToCreate.push({ code: `2D0${i}`, name: `Phòng 2D0${i}`, building: 'D', floor: 1, capacity: 50, status: RoomStatus.AVAILABLE }); }
  for (let i = 1; i <= 3; i++) { roomsToCreate.push({ code: `Kho 0${i}`, name: `Kho Lưu Trữ 0${i}`, building: 'Kho', floor: 1, capacity: 100, status: RoomStatus.AVAILABLE }); }

  const allRooms: Record<string, number> = {};
  for (const room of roomsToCreate) {
    const created = await prisma.room.upsert({ where: { code: room.code }, update: {}, create: room });
    allRooms[room.code] = created.roomId;
  }
  console.log(`Đã tạo ${roomsToCreate.length} phòng học/kho.`);

  // --------------------------------------------------------
  // 5. TẠO VÀ PHÂN BỔ THIẾT BỊ
  // --------------------------------------------------------
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
  for (const eqType of equipmentTypes) {
    const existingEquipment = await prisma.equipment.findFirst({ where: { name: eqType.name } });
    if (!existingEquipment) {
      const newEquipment = await prisma.equipment.create({
        data: {
          name: eqType.name,
          categoryId: createdCategories[eqType.cat],
          quantity: eqType.qtyPerRoom * classroomCodes.length + 50,
          unit: eqType.unit,
          status: EquipmentStatus.GOOD,
          description: `Trang bị tiêu chuẩn`,
        },
      });

      const allocationsData: any[] = classroomCodes.map(code => ({
        equipmentId: newEquipment.equipmentId,
        roomId: allRooms[code],
        quantity: eqType.qtyPerRoom,
        allocatedAt: new Date(),
        note: 'Cấp phát ban đầu',
      }));
      allocationsData.push({
        equipmentId: newEquipment.equipmentId,
        roomId: allRooms['Kho 01'],
        quantity: 50,
        allocatedAt: new Date(),
        note: 'Nhập kho dự phòng',
      });
      await prisma.equipmentAllocation.createMany({ data: allocationsData });
    }
  }
  console.log(`Đã tạo và phân bổ thiết bị thành công!`);

  // --------------------------------------------------------
  // 6. TẠO CẤU HÌNH FORM MẶC ĐỊNH
  // --------------------------------------------------------
  console.log('Đang tạo cấu hình form mặc định...');

  const formConfigs: { formKey: string; fieldKey: string; label: string; fieldType: string; required: boolean; visible: boolean; sortOrder: number; options: string | null; placeholder: string | null }[] = [
    // Form báo cáo sự cố
    { formKey: 'incident_report', fieldKey: 'roomId', label: 'Phòng học', fieldType: 'select', required: true, visible: true, sortOrder: 1, options: null, placeholder: 'Tìm kiếm và chọn phòng...' },
    { formKey: 'incident_report', fieldKey: 'equipmentId', label: 'Thiết bị gặp sự cố', fieldType: 'select', required: true, visible: true, sortOrder: 2, options: null, placeholder: 'Tìm kiếm và chọn thiết bị...' },
    { formKey: 'incident_report', fieldKey: 'reportContent', label: 'Nội dung phản ánh', fieldType: 'textarea', required: true, visible: true, sortOrder: 3, options: null, placeholder: 'Ví dụ: Máy chiếu không lên hình, loa bị rè, điều hòa không hoạt động...' },

    // Form nhập thiết bị
    { formKey: 'equipment', fieldKey: 'equipmentCode', label: 'Mã thiết bị', fieldType: 'text', required: true, visible: true, sortOrder: 1, options: null, placeholder: 'VD: TB000001' },
    { formKey: 'equipment', fieldKey: 'name', label: 'Tên thiết bị', fieldType: 'text', required: true, visible: true, sortOrder: 2, options: null, placeholder: 'VD: Máy chiếu Panasonic' },
    { formKey: 'equipment', fieldKey: 'categoryId', label: 'Loại thiết bị', fieldType: 'select', required: true, visible: true, sortOrder: 3, options: null, placeholder: 'Chọn loại...' },
    { formKey: 'equipment', fieldKey: 'room', label: 'Phòng học', fieldType: 'select', required: true, visible: true, sortOrder: 4, options: null, placeholder: 'Chọn phòng...' },
    { formKey: 'equipment', fieldKey: 'status', label: 'Trạng thái', fieldType: 'select', required: true, visible: true, sortOrder: 5, options: JSON.stringify(['Hoạt động', 'Báo hỏng', 'Đang sửa', 'Bảo trì', 'Thanh lý']), placeholder: 'Chọn trạng thái...' },
    { formKey: 'equipment', fieldKey: 'importDate', label: 'Ngày nhập', fieldType: 'date', required: false, visible: true, sortOrder: 6, options: null, placeholder: null },
    { formKey: 'equipment', fieldKey: 'note', label: 'Ghi chú', fieldType: 'textarea', required: false, visible: true, sortOrder: 7, options: null, placeholder: 'Nhập ghi chú...' },

    // Form tạo user
    { formKey: 'user_create', fieldKey: 'fullName', label: 'Họ và tên', fieldType: 'text', required: true, visible: true, sortOrder: 1, options: null, placeholder: 'VD: Nguyễn Văn A' },
    { formKey: 'user_create', fieldKey: 'username', label: 'Tên đăng nhập', fieldType: 'text', required: true, visible: true, sortOrder: 2, options: null, placeholder: 'VD: nguyenvana' },
    { formKey: 'user_create', fieldKey: 'email', label: 'Email', fieldType: 'email', required: true, visible: true, sortOrder: 3, options: null, placeholder: 'VD: a@hvcs.edu.vn' },
    { formKey: 'user_create', fieldKey: 'password', label: 'Mật khẩu', fieldType: 'password', required: true, visible: true, sortOrder: 4, options: null, placeholder: 'Nhập mật khẩu...' },
    { formKey: 'user_create', fieldKey: 'phoneNumber', label: 'Số điện thoại', fieldType: 'text', required: false, visible: true, sortOrder: 5, options: null, placeholder: 'VD: 0123456789' },
    { formKey: 'user_create', fieldKey: 'role', label: 'Vai trò', fieldType: 'select', required: true, visible: true, sortOrder: 6, options: JSON.stringify(['ADMIN', 'MANAGER', 'TEACHER', 'STUDENT']), placeholder: 'Chọn vai trò...' },
    { formKey: 'user_create', fieldKey: 'status', label: 'Trạng thái', fieldType: 'select', required: false, visible: true, sortOrder: 7, options: JSON.stringify(['Hoạt động', 'Đã khóa']), placeholder: 'Chọn trạng thái...' },

    // Form xử lý báo cáo (Manager)
    { formKey: 'incident_handle', fieldKey: 'status', label: 'Trạng thái xử lý', fieldType: 'select', required: true, visible: true, sortOrder: 1, options: JSON.stringify(['Mới tiếp nhận', 'Đang xử lý', 'Đã xử lý', 'Từ chối']), placeholder: null },
    { formKey: 'incident_handle', fieldKey: 'handlerName', label: 'Người xử lý', fieldType: 'text', required: true, visible: true, sortOrder: 2, options: null, placeholder: 'VD: Cán bộ QLTB' },
    { formKey: 'incident_handle', fieldKey: 'handlerNote', label: 'Ghi chú xử lý', fieldType: 'textarea', required: false, visible: true, sortOrder: 3, options: null, placeholder: 'VD: Đã kiểm tra, cần thay dây HDMI...' },

    // Form thông báo
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

  console.log("==========================USER TEST==========================")
  console.log('+------------------------------+------------------------------+------------------------------+')
  console.log(`|${prettier('role', 30)}|${prettier('username', 30)}|${prettier('password', 30)}|`)
  console.log('+------------------------------+------------------------------+------------------------------+')


  for (var user of defaultUsers)
    console.log(`|${prettier(user.roleName, 30)}|${prettier(user.username, 30)}|${prettier(user.password, 30)}|`)
  console.log('+------------------------------+------------------------------+------------------------------+')

}

main()
  .catch((e) => {
    console.error(' Lỗi khi chạy seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('Đã ngắt kết nối database.');
  });