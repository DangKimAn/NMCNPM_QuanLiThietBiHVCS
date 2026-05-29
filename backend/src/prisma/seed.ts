import { PrismaClient, EquipmentStatus } from '@prisma/client';
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
    roleName: 'LEADER',
    description: 'Trưởng phòng / Trưởng bộ phận',
    permissions: [
      SystemPermission.VIEW_USER,
      FacilityPermission.VIEW_EQUIPMENT,
      FacilityPermission.VIEW_ROOM,
      BorrowRequestPermission.CREATE_BORROW_REQUEST,
      BorrowRequestPermission.VIEW_BORROW_REQUEST,
      BorrowRequestPermission.APPROVE_BORROW_REQUEST,
      IncidentReportPermission.CREATE_REPORT,
      IncidentReportPermission.VIEW_REPORT,
      DashboardPermission.VIEW_DASHBOARD,
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
  // 3. TẠO DỮ LIỆU USER MẪU (MANAGER, LEADER)
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
      username: 'leader_01',
      email: 'leader@system.com',
      roleName: 'LEADER',
      password: 'passwordleaderdefault'
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

  // Đồng bộ: Reset số lượng thiết bị trên ROOM_API về 0 do DB ở đây vừa bị wipe sạch
  console.log('Đang đồng bộ lại số lượng thiết bị trên ROOM_API về 0...');
  for (const room of existingRoomsAPI) {
    if (room.equipmentCount && room.equipmentCount > 0) {
      try {
        await fetch(`${ROOM_API_URL}/${room.id}/equipment`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'sub', amount: room.equipmentCount }),
        });
      } catch (e) {
        console.error(`Không thể reset phòng ${room.name}:`, e);
      }
    }
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

  // --------------------------------------------------------
  // 5. TẠO VÀ PHÂN BỔ THIẾT BỊ VÀO KHO
  // --------------------------------------------------------
  const equipmentTypes = [
    { code: 'TB0001', name: 'Máy chiếu Panasonic', cat: 'Máy chiếu', unit: 'Cái', qty: 50 },
    { code: 'TB0002', name: 'Máy lạnh Daikin 2HP', cat: 'Máy lạnh', unit: 'Cái', qty: 50 },
    { code: 'TB0003', name: 'Bộ Loa & Amply', cat: 'Âm thanh', unit: 'Bộ', qty: 30 },
    { code: 'TB0004', name: 'Micro không dây', cat: 'Âm thanh', unit: 'Cái', qty: 30 },
    { code: 'TB0005', name: 'Bảng từ chống lóa', cat: 'Bảng từ', unit: 'Cái', qty: 50 },
    { code: 'TB0006', name: 'Bàn ghế giảng viên', cat: 'Bàn ghế', unit: 'Bộ', qty: 50 },
    { code: 'TB0007', name: 'Bàn ghế sinh viên', cat: 'Bàn ghế', unit: 'Bộ', qty: 500 },
  ];

  for (const eqType of equipmentTypes) {
    const categoryId = createdCategories[eqType.cat];
    const acronym = eqType.cat.split(' ').filter((w: string) => w.trim().length > 0).map((w: string) => w.charAt(0).toUpperCase()).join('');

    // Cập nhật số lượng trên ROOM_API 1 lần cho eqType.qty
    try {
      await fetch(`${ROOM_API_URL}/${targetWarehouse.id}/equipment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', amount: eqType.qty }),
      });
    } catch(e) {}

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
  }
  console.log(`Đã tạo và phân bổ thiết bị thành công!`);

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