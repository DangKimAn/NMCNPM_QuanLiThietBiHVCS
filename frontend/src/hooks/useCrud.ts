import { useState } from 'react';

// Khai báo kiểu dữ liệu: T là kiểu dữ liệu bất kỳ (Device hoặc User), idKey là khóa chính (thường là 'id')
export function useCrud<T extends { [key: string]: any }>(initialData: T[], idKey: string = 'id') {
  // 1. State quản lý danh sách
  const [data, setData] = useState<T[]>(initialData);
  
  // 2. State quản lý Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);

  // 3. Hàm Mở Modal Thêm mới
  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  // 4. Hàm Mở Modal Cập nhật
  const handleOpenEdit = (item: T) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  // 5. Hàm Lưu (Xử lý cả Thêm và Sửa)
  const handleSave = (itemData: T) => {
    if (editingItem) {
      // Nếu có editingItem -> Đang Sửa -> Tìm và ghi đè
      setData(data.map(item => item[idKey] === itemData[idKey] ? itemData : item));
    } else {
      // Nếu không có -> Đang Thêm mới -> Đẩy lên đầu danh sách
      setData([itemData, ...data]);
    }
    setIsModalOpen(false);
  };

  // 6. Hàm Xóa (Có nhận vào thông báo xác nhận riêng)
  const handleDelete = (id: string, confirmMessage: string) => {
    const isConfirm = window.confirm(confirmMessage);
    if (isConfirm) {
      setData(data.filter(item => item[idKey] !== id));
    }
  };

  const handleCloseModal = () => setIsModalOpen(false);

  // Trả ra những state và function để các Component sử dụng
  return {
    data,
    setData, // Trả ra setData nếu cần thao tác đặc thù (như filter)
    isModalOpen,
    editingItem,
    handleOpenAdd,
    handleOpenEdit,
    handleCloseModal,
    handleSave,
    handleDelete,
    setIsModalOpen
  };
}