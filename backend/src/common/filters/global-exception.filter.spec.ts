import { HttpException, HttpStatus } from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockLogger: any;

  beforeEach(() => {
    mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
    };
    filter = new GlobalExceptionFilter(mockLogger);
  });

  const createMockHost = () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const getResponse = jest.fn().mockReturnValue({ status, json });
    const getRequest = jest.fn().mockReturnValue({
      method: 'POST',
      url: '/api/test',
    });

    return {
      switchToHttp: () => ({
        getResponse,
        getRequest,
      }),
      status,
      json,
    };
  };

  it('TC-FILTER-01: Bắt HttpException và trả về định dạng response JSON chuẩn', () => {
    const host = createMockHost();
    const exception = new HttpException('Dữ liệu không hợp lệ', HttpStatus.BAD_REQUEST);

    filter.catch(exception, host as any);

    expect(host.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(host.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: 'Dữ liệu không hợp lệ',
        path: '/api/test',
      }),
    );
  });

  it('TC-FILTER-02: Bắt Error không mong muốn và che giấu chi tiết trong Production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const host = createMockHost();
    const exception = new Error('Database connection failed: password wrong at 10.0.0.1');

    filter.catch(exception, host as any);

    expect(host.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(host.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'Lỗi hệ thống nội bộ. Vui lòng liên hệ quản trị viên.',
        error: 'Internal Server Error',
      }),
    );

    process.env.NODE_ENV = originalEnv;
  });
});
