const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../frontend/public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// User Template
const userHeaders = ['Họ tên', 'Username', 'Email', 'Số điện thoại', 'Vai trò', 'Mật khẩu tạm thời'];
const userSample = ['Nguyễn Văn A', 'nva', 'nva@example.com', '0123456789', 'STUDENT', '123456aA@'];
const userWs = xlsx.utils.aoa_to_sheet([userHeaders, userSample]);
const userWb = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(userWb, userWs, 'Users');
xlsx.writeFile(userWb, path.join(publicDir, 'User_Import_Mau.xlsx'));

// Device Template
const deviceHeaders = ['Tên thiết bị', 'Loại thiết bị', 'Phòng học', 'Số lượng', 'Trạng thái', 'Ghi chú'];
const deviceSample = ['Máy chiếu Panasonic', 'Máy chiếu', '2A01', '1', 'Hoạt động', 'Thiết bị mới'];
const deviceWs = xlsx.utils.aoa_to_sheet([deviceHeaders, deviceSample]);
const deviceWb = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(deviceWb, deviceWs, 'Devices');
xlsx.writeFile(deviceWb, path.join(publicDir, 'Device_Import_Mau.xlsx'));

console.log('Successfully generated .xlsx templates in frontend/public');
