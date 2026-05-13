import { PrismaClient } from '@prisma/client';
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