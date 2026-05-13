
export enum SystemPermission {
  VIEW_USER = 'VIEW_USER',
  CREATE_USER = 'CREATE_USER',
  UPDATE_USER = 'UPDATE_USER',
  DELETE_USER = 'DELETE_USER',
  VIEW_ROLE_PERMISSION = 'VIEW_ROLE_PERMISSION',
  ASSIGN_PERMISSION = 'ASSIGN_PERMISSION',
  VIEW_ACTIVITY_LOG = 'VIEW_ACTIVITY_LOG',
}


export enum FacilityPermission {
  VIEW_EQUIPMENT = 'VIEW_EQUIPMENT',
  CREATE_EQUIPMENT = 'CREATE_EQUIPMENT',
  UPDATE_EQUIPMENT = 'UPDATE_EQUIPMENT',
  DELETE_EQUIPMENT = 'DELETE_EQUIPMENT',
  VIEW_ROOM = 'VIEW_ROOM',
  ALLOCATE_EQUIPMENT = 'ALLOCATE_EQUIPMENT',
  TRANSFER_EQUIPMENT = 'TRANSFER_EQUIPMENT',
}


export enum BorrowRequestPermission {
  CREATE_BORROW_REQUEST = 'CREATE_BORROW_REQUEST',
  VIEW_BORROW_REQUEST = 'VIEW_BORROW_REQUEST',
  APPROVE_BORROW_REQUEST = 'APPROVE_BORROW_REQUEST', // Bao gồm cả duyệt mượn và xác nhận trả
}


export enum IncidentReportPermission {
  CREATE_REPORT = 'CREATE_REPORT',
  VIEW_REPORT = 'VIEW_REPORT',
  PROCESS_REPORT = 'PROCESS_REPORT', // Tiếp nhận và cập nhật trạng thái sửa chữa
  SEND_FEEDBACK = 'SEND_FEEDBACK',
}


export enum DashboardPermission {
  VIEW_DASHBOARD = 'VIEW_DASHBOARD',
  EXPORT_REPORT = 'EXPORT_REPORT',
}


export const AllPermissions = {
  ...SystemPermission,
  ...FacilityPermission,
  ...BorrowRequestPermission,
  ...IncidentReportPermission,
  ...DashboardPermission,
};

export type PermissionType = 
  | SystemPermission 
  | FacilityPermission 
  | BorrowRequestPermission 
  | IncidentReportPermission 
  | DashboardPermission;