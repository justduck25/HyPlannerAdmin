# HyPlanner Admin Backend

Backend API cho HyPlanner Admin Dashboard với authentication hardcode.

## Thông tin đăng nhập Admin

- **Username**: `admin`
- **Password**: `admin`

## Cài đặt và chạy

```bash
# Cài đặt dependencies
npm install

# Chạy development mode
npm run dev

# Chạy production mode
npm start
```

## Environment Variables

Tạo file `.env` với nội dung:

```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/hyplanner
JWT_SECRET=hyplanner_admin_jwt_secret_key_2024
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Đăng nhập admin
- `GET /api/auth/verify` - Xác thực token
- `POST /api/auth/logout` - Đăng xuất

### User Management
- `GET /api/users` - Lấy danh sách users (có pagination, search, filter)
- `GET /api/users/:id` - Lấy thông tin user theo ID
- `PUT /api/users/:id` - Cập nhật thông tin user
- `DELETE /api/users/:id` - Xóa user
- `PATCH /api/users/:id/toggle-status` - Bật/tắt trạng thái user
- `GET /api/users/stats/overview` - Thống kê users

### Dashboard
- `GET /api/dashboard/overview` - Tổng quan dashboard
- `GET /api/dashboard/user-growth` - Biểu đồ tăng trưởng user
- `GET /api/dashboard/account-distribution` - Phân bố loại tài khoản
- `GET /api/dashboard/system-health` - Trạng thái hệ thống

### Admin System
- `GET /api/admin/profile` - Thông tin admin
- `GET /api/admin/settings` - Cài đặt hệ thống
- `PUT /api/admin/settings` - Cập nhật cài đặt
- `GET /api/admin/logs` - Xem logs hệ thống
- `DELETE /api/admin/logs` - Xóa logs
- `POST /api/admin/backup` - Tạo backup
- `GET /api/admin/backup/:backupId` - Trạng thái backup
- `POST /api/admin/maintenance/enable` - Bật chế độ bảo trì
- `POST /api/admin/maintenance/disable` - Tắt chế độ bảo trì
- `DELETE /api/admin/cache` - Xóa cache
- `POST /api/admin/restart` - Khởi động lại hệ thống

### Health Check
- `GET /api/health` - Kiểm tra trạng thái API

## Authentication

Tất cả các endpoint (trừ `/api/auth/login` và `/api/health`) đều yêu cầu JWT token trong header:

```
Authorization: Bearer <token>
```

## Response Format

Tất cả API response đều có format:

```json
{
  "success": true/false,
  "message": "Thông báo",
  "data": { ... }
}
```

## User Model Schema

```javascript
{
  fullName: String,
  email: String (unique),
  password: String (hashed),
  avatar: String,
  isVerified: Boolean,
  accountType: ['BASIC', 'PREMIUM', 'SUPER'],
  lastLogin: Date,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## Features

- ✅ Hardcode admin authentication (admin/admin)
- ✅ JWT token-based authorization
- ✅ User management (CRUD operations)
- ✅ Dashboard statistics và charts
- ✅ System monitoring và health check
- ✅ Logs management
- ✅ Backup system (mock)
- ✅ Maintenance mode
- ✅ Pagination và filtering
- ✅ Error handling
- ✅ CORS support

## Development

```bash
# Chạy với nodemon để auto-reload
npm run dev

# API sẽ chạy tại http://localhost:3001
# Health check: http://localhost:3001/api/health
```
