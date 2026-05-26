import { PrismaClient, RoomStatus, EquipmentStatus } from '@prisma/client';
import { hashPassword } from '../common/bcrypt';
import 'dotenv/config'; 
import { SystemPermission, 
  FacilityPermission, 
  BorrowRequestPermission, 
  IncidentReportPermission, 
  DashboardPermission, 
  AllPermissions } from '../common/permissionsName.dto';
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
const prisma = new PrismaService( new ConfigService()); 
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

function prettier(_string : string , width: number){
    const mid = (width - _string.length)/2
    var rs = ''
    for ( var i = 0 ; i< mid ; i++)
        rs+=' '
    rs += _string
    while(rs.length < width)
        rs+=' '
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
      password :'passwordmanagerdefault'
    },
    {
      username: 'leader_01',
      email: 'leader@system.com',
      roleName: 'LEADER',
      password :'passwordleaderdefault'
    },
    {
      username: 'admin_super',
      email: 'admin@system.com',
      roleName: 'ADMIN',
      password :'passwordadmindefault'
    },
    {
      username: 'teacher_01',
      email: 'teacher@system.com',
      roleName: 'TEACHER',
      password :'passwordteacherdefault'
    },
    {
      username: 'student_01',
      email: 'student@system.com',
      roleName: 'STUDENT',
      password :'passwordstudentdefault'
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

  console.log("==========================USER TEST==========================")
  console.log('+------------------------------+------------------------------+------------------------------+')
  console.log(`|${prettier('role', 30)}|${prettier('username' , 30 )}|${prettier('password', 30)}|`)
  console.log('+------------------------------+------------------------------+------------------------------+')


  for(var user  of  defaultUsers)
    console.log(`|${prettier(user.roleName,30)}|${prettier(user.username,30)}|${prettier(user.password,30)}|`)
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