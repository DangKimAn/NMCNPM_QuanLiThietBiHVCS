import { PartialType } from '@nestjs/mapped-types';
import { CreateRoomDto } from './create-room.dto';

// DTO cập nhật phòng học
// PartialType nghĩa là tất cả field của CreateRoomDto đều không bắt buộc
export class UpdateRoomDto extends PartialType(CreateRoomDto) {}