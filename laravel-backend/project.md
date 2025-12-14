# System/Admin Module - UI Builder Documentation

## Project Overview

This is the frontend specification for an ERP System's Admin Module built with **Next.js**. The backend is a Laravel API using Laravel Sanctum for authentication. This document provides all the information needed to build a complete admin dashboard UI.

### Tech Stack
- **Frontend**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **State Management**: React Context or Zustand
- **HTTP Client**: Axios
- **Authentication**: Bearer Token (Laravel Sanctum)
- **UI Components**: shadcn/ui (recommended)

### Base API URL
```
http://localhost:8000/api
```

### Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer {token}
```

---

## API Endpoints Reference

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | User login | No |
| POST | `/auth/logout` | User logout | Yes |
| GET | `/auth/verify-email/{token}` | Verify email | No |
| POST | `/auth/forgot-password` | Request password reset | No |
| POST | `/auth/reset-password` | Reset password | No |

### User Management Endpoints (Admin Only)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/users` | List all users (paginated) | Yes (Admin) |
| POST | `/users` | Create new user | Yes (Admin) |
| GET | `/users/{id}` | Get user details | Yes (Admin) |
| PUT | `/users/{id}` | Update user | Yes (Admin) |
| DELETE | `/users/{id}` | Soft delete user | Yes (Admin) |
| POST | `/users/{id}/roles` | Assign roles to user | Yes (Admin) |

### Profile Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/profile` | Get current user profile | Yes |
| PUT | `/profile` | Update profile | Yes |
| PUT | `/profile/password` | Change password | Yes |
| POST | `/profile/avatar` | Upload avatar | Yes |

### Role Management Endpoints (Admin Only)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/roles` | List all roles | Yes (Admin) |
| POST | `/roles` | Create new role | Yes (Admin) |
| GET | `/roles/{id}` | Get role details | Yes (Admin) |
| PUT | `/roles/{id}` | Update role | Yes (Admin) |
| DELETE | `/roles/{id}` | Delete role | Yes (Admin) |
| POST | `/roles/{id}/permissions` | Assign permissions | Yes (Admin) |

### Permission Endpoints (Admin Only)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/permissions` | List all permissions | Yes (Admin) |
| GET | `/permissions/grouped` | Permissions grouped by module | Yes (Admin) |

### Audit Log Endpoints (Admin Only)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/audit-logs` | List audit logs (paginated, filterable) | Yes (Admin) |

### System Settings Endpoints (Admin Only)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/settings` | Get all settings | Yes (Admin) |
| PUT | `/settings` | Update settings | Yes (Admin) |
| GET | `/settings/{key}` | Get specific setting | Yes (Admin) |
| POST | `/settings/logo` | Upload company logo | Yes (Admin) |
| DELETE | `/settings/logo` | Delete company logo | Yes (Admin) |
| POST | `/settings/clear-cache` | Clear settings cache | Yes (Admin) |

---

## Data Models & Schemas

### User
```typescript
interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  avatar: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  roles?: Role[];
}
```

### Role
```typescript
interface Role {
  id: number;
  name: string;
  description: string | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
  permissions?: Permission[];
  users_count?: number;
}
```

### Permission
```typescript
interface Permission {
  id: number;
  name: string;
  description: string | null;
  module: string;
  created_at: string;
  updated_at: string;
}
```

### AuditLog
```typescript
interface AuditLog {
  id: number;
  user_id: number | null;
  action: string;
  resource: string;
  resource_id: number | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user?: User;
}
```

### SystemSetting
```typescript
interface SystemSetting {
  id: number;
  key: string;
  value: string | null;
  type: 'string' | 'integer' | 'boolean' | 'json';
  created_at: string;
  updated_at: string;
}
```

### API Response Format
```typescript
// Success Response
interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

// Error Response
interface ErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  error_code?: string;
}

// Paginated Response
interface PaginatedResponse<T> {
  success: true;
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}
```

---

## UI Pages & Components

### 1. Authentication Pages

#### 1.1 Login Page (`/login`)
**Route**: Public

**Features**:
- Email input field (required, email format)
- Password input field (required, min 8 chars)
- "Remember me" checkbox
- "Forgot password?" link
- "Register" link
- Submit button with loading state
- Error message display for invalid credentials
- Account lockout message after 5 failed attempts

**API Call**:
```typescript
POST /auth/login
Body: { email: string, password: string }
Response: { success: true, data: { user: User, token: string } }
```

**Validation Messages**:
- "Invalid email or password"
- "Please verify your email before logging in"
- "Account temporarily locked. Try again in X minutes"

---

#### 1.2 Registration Page (`/register`)
**Route**: Public

**Features**:
- Name input field (required)
- Email input field (required, email format)
- Password input field (required, min 8 chars)
- Password confirmation field (must match)
- Terms & conditions checkbox
- Submit button with loading state
- Success message: "Registration successful! Please check your email to verify your account."
- Link to login page

**API Call**:
```typescript
POST /auth/register
Body: { name: string, email: string, password: string, password_confirmation: string }
Response: { success: true, message: string }
```

**Validation Messages**:
- "The email has already been taken"
- "The password must be at least 8 characters"
- "The password confirmation does not match"

---

#### 1.3 Forgot Password Page (`/forgot-password`)
**Route**: Public

**Features**:
- Email input field
- Submit button
- Success message (always show generic message for security)
- Link back to login

**API Call**:
```typescript
POST /auth/forgot-password
Body: { email: string }
Response: { success: true, message: "If the email exists, a reset link has been sent." }
```

---

#### 1.4 Reset Password Page (`/reset-password?token={token}`)
**Route**: Public

**Features**:
- New password input field (min 8 chars)
- Confirm password field
- Submit button
- Success message with redirect to login
- Error for expired/invalid token

**API Call**:
```typescript
POST /auth/reset-password
Body: { token: string, password: string, password_confirmation: string }
Response: { success: true, message: string }
```

---

#### 1.5 Email Verification Page (`/verify-email/{token}`)
**Route**: Public

**Features**:
- Auto-verify on page load
- Success message with redirect to login
- Error message for invalid/expired token
- Resend verification email button

**API Call**:
```typescript
GET /auth/verify-email/{token}
Response: { success: true, message: string }
```

---

### 2. Dashboard Layout

#### 2.1 Main Layout Component
**Features**:
- Sidebar navigation (collapsible)
- Top header with:
  - Company logo
  - Search bar (optional)
  - Notifications dropdown
  - User avatar dropdown menu
- Breadcrumb navigation
- Main content area
- Footer (optional)

**Sidebar Navigation Items**:
```typescript
const navItems = [
  { label: 'Dashboard', icon: 'Home', href: '/dashboard', permission: null },
  { label: 'Users', icon: 'Users', href: '/users', permission: 'users.view' },
  { label: 'Roles', icon: 'Shield', href: '/roles', permission: 'roles.view' },
  { label: 'Permissions', icon: 'Key', href: '/permissions', permission: 'permissions.view' },
  { label: 'Audit Logs', icon: 'FileText', href: '/audit-logs', permission: 'audit_logs.view' },
  { label: 'Settings', icon: 'Settings', href: '/settings', permission: 'settings.view' },
];
```

**User Dropdown Menu**:
- View Profile
- Account Settings
- Logout

---

### 3. User Management Pages

#### 3.1 Users List Page (`/users`)
**Route**: Protected (Admin)
**Permission**: `users.view`

**Features**:
- Page title: "User Management"
- "Add User" button (if has `users.create` permission)
- Search input (search by name, email)
- Filter dropdown:
  - Status: All, Active, Inactive
  - Role: All roles dropdown
- Data table with columns:
  - Avatar (thumbnail)
  - Name
  - Email
  - Roles (badges)
  - Status (Active/Inactive badge)
  - Created At
  - Actions (View, Edit, Delete)
- Pagination controls
- Bulk actions: Activate, Deactivate, Delete

**API Call**:
```typescript
GET /users?page=1&per_page=15&search=&status=&role_id=
Response: PaginatedResponse<User>
```

**Table Row Actions**:
- View: Opens user detail modal or navigates to `/users/{id}`
- Edit: Opens edit modal or navigates to `/users/{id}/edit`
- Delete: Confirmation modal, then soft delete

---

#### 3.2 Create User Modal/Page (`/users/create`)
**Permission**: `users.create`

**Form Fields**:
- Name (required)
- Email (required, unique)
- Password (required, min 8 chars)
- Password Confirmation
- Roles (multi-select dropdown)
- Status (Active/Inactive toggle)
- Send welcome email (checkbox)

**API Call**:
```typescript
POST /users
Body: { 
  name: string, 
  email: string, 
  password: string, 
  password_confirmation: string,
  roles: number[],
  is_active: boolean,
  send_welcome_email?: boolean
}
```

---

#### 3.3 Edit User Modal/Page (`/users/{id}/edit`)
**Permission**: `users.edit`

**Form Fields**:
- Name (required)
- Email (required, unique)
- Password (optional - leave blank to keep current)
- Password Confirmation
- Roles (multi-select dropdown)
- Status (Active/Inactive toggle)

**API Call**:
```typescript
PUT /users/{id}
Body: { name, email, password?, roles, is_active }
```

---

#### 3.4 User Detail Page (`/users/{id}`)
**Permission**: `users.view`

**Sections**:
- User info card (avatar, name, email, status)
- Assigned roles list
- Activity timeline (recent audit logs for this user)
- Account actions: Reset password, Deactivate, Delete

---

### 4. Profile Pages

#### 4.1 My Profile Page (`/profile`)
**Route**: Protected (Any authenticated user)

**Sections**:

**Profile Information Card**:
- Avatar with upload button
- Name (editable)
- Email (editable, requires re-verification)
- Save button

**Change Password Card**:
- Current password (required)
- New password (min 8 chars)
- Confirm new password
- Update password button

**API Calls**:
```typescript
GET /profile
PUT /profile { name, email }
PUT /profile/password { current_password, password, password_confirmation }
POST /profile/avatar (multipart/form-data with 'avatar' file)
```

---

### 5. Role Management Pages

#### 5.1 Roles List Page (`/roles`)
**Permission**: `roles.view`

**Features**:
- Page title: "Role Management"
- "Add Role" button
- Data table with columns:
  - Name
  - Description
  - Users Count
  - System Role (badge if is_system=true)
  - Created At
  - Actions
- Note: System roles cannot be edited or deleted

**API Call**:
```typescript
GET /roles
Response: { success: true, data: Role[] }
```

---

#### 5.2 Create/Edit Role Modal
**Permission**: `roles.create` / `roles.edit`

**Form Fields**:
- Name (required, unique)
- Description (optional, textarea)
- Permissions (grouped checkboxes by module)

**Permissions Display**:
```
□ Users Module
  ☑ users.view - View users
  ☑ users.create - Create users
  ☑ users.edit - Edit users
  ☐ users.delete - Delete users

□ Roles Module
  ☑ roles.view - View roles
  ...
```

**API Calls**:
```typescript
POST /roles { name, description, permissions: number[] }
PUT /roles/{id} { name, description }
POST /roles/{id}/permissions { permissions: number[] }
```

---

#### 5.3 Role Detail Page (`/roles/{id}`)
**Permission**: `roles.view`

**Sections**:
- Role info (name, description, system badge)
- Assigned permissions (grouped by module)
- Users with this role (list with links)

---

### 6. Permissions Page

#### 6.1 Permissions List Page (`/permissions`)
**Permission**: `permissions.view`

**Features**:
- Page title: "Permissions"
- Read-only list (permissions are seeded, not user-created)
- Group by module with expandable sections
- Search/filter by name or module

**Display Format**:
```
Users Module (4 permissions)
├── users.view - View users list
├── users.create - Create new users
├── users.edit - Edit existing users
└── users.delete - Delete users

Roles Module (4 permissions)
├── roles.view - View roles list
...
```

**API Call**:
```typescript
GET /permissions/grouped
Response: { 
  success: true, 
  data: { 
    [module: string]: Permission[] 
  } 
}
```

---

### 7. Audit Logs Page

#### 7.1 Audit Logs List Page (`/audit-logs`)
**Permission**: `audit_logs.view`

**Features**:
- Page title: "Audit Logs"
- Filters:
  - Date range picker (from/to)
  - User dropdown (select user)
  - Action type dropdown (login, create, update, delete, etc.)
  - Resource type dropdown (users, roles, settings, etc.)
- Data table with columns:
  - Timestamp
  - User (name with link, or "System" if null)
  - Action (badge with color coding)
  - Resource
  - Resource ID
  - IP Address
  - Details (expandable to show old/new values)
- Export button (CSV/Excel)
- Pagination

**Action Badge Colors**:
- login: blue
- logout: gray
- create: green
- update: yellow
- delete: red

**API Call**:
```typescript
GET /audit-logs?page=1&per_page=25&user_id=&action=&resource=&from=&to=
Response: PaginatedResponse<AuditLog>
```

**Expandable Details Row**:
```
Old Values: { "name": "John", "email": "john@old.com" }
New Values: { "name": "John Doe", "email": "john@new.com" }
User Agent: Mozilla/5.0...
```

---

### 8. System Settings Page

#### 8.1 Settings Page (`/settings`)
**Permission**: `settings.view`

**Sections**:

**Company Information Card**:
- Company Name (text input)
- Company Address (textarea)
- Company Phone (text input)
- Company Email (email input)
- Company Logo (image upload with preview)
  - Accepts: PNG, JPG, SVG
  - Max size: 2MB
  - Delete logo button

**Regional Settings Card**:
- Timezone (dropdown with common timezones)
- Date Format (dropdown: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY)
- Currency (dropdown: USD, EUR, GBP, etc.)
- Currency Symbol Position (Before/After amount)

**System Settings Card**:
- Items per page (number input, default 15)
- Session timeout (minutes)
- Enable user registration (toggle)
- Require email verification (toggle)

**Save Button**: Saves all settings at once

**API Calls**:
```typescript
GET /settings
Response: { success: true, data: SystemSetting[] }

PUT /settings
Body: { settings: { key: value, ... } }

POST /settings/logo (multipart/form-data)
DELETE /settings/logo
```

**Settings Keys Reference**:
```typescript
const settingKeys = {
  // Company
  'company_name': 'string',
  'company_address': 'string',
  'company_phone': 'string',
  'company_email': 'string',
  'company_logo': 'string', // URL path
  
  // Regional
  'timezone': 'string',
  'date_format': 'string',
  'currency': 'string',
  'currency_symbol_position': 'string',
  
  // System
  'items_per_page': 'integer',
  'session_timeout': 'integer',
  'allow_registration': 'boolean',
  'require_email_verification': 'boolean',
};
```

---

## Reusable UI Components

### 1. DataTable Component
```typescript
interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  pagination?: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  onSelectionChange?: (selected: T[]) => void;
}
```

### 2. Modal Component
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  footer?: React.ReactNode;
}
```

### 3. ConfirmDialog Component
```typescript
interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}
```

### 4. Badge Component
```typescript
interface BadgeProps {
  variant: 'default' | 'success' | 'warning' | 'danger' | 'info';
  children: React.ReactNode;
}
```

### 5. Avatar Component
```typescript
interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}
// Shows image if src provided, otherwise shows initials
```

### 6. SearchInput Component
```typescript
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}
```

### 7. DateRangePicker Component
```typescript
interface DateRangePickerProps {
  from: Date | null;
  to: Date | null;
  onChange: (from: Date | null, to: Date | null) => void;
}
```

### 8. MultiSelect Component
```typescript
interface MultiSelectProps<T> {
  options: { value: T; label: string }[];
  selected: T[];
  onChange: (selected: T[]) => void;
  placeholder?: string;
}
```

### 9. FileUpload Component
```typescript
interface FileUploadProps {
  accept?: string;
  maxSize?: number; // bytes
  onUpload: (file: File) => void;
  preview?: string;
  onRemove?: () => void;
}
```

### 10. Toast/Notification Component
```typescript
interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}
```

---

## Authentication & Authorization

### Auth Context
```typescript
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
}
```

### Protected Route Component
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean; // default false (any permission)
  fallback?: React.ReactNode; // shown if unauthorized
}
```

### Permission-Based Rendering
```typescript
// Component to conditionally render based on permission
interface CanProps {
  permission: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// Usage
<Can permission="users.create">
  <Button>Add User</Button>
</Can>
```

---

## Error Handling

### Global Error Handler
- 401 Unauthorized: Redirect to login, clear auth state
- 403 Forbidden: Show "Access Denied" message
- 404 Not Found: Show "Resource not found" message
- 422 Validation Error: Display field-specific errors
- 429 Too Many Requests: Show rate limit message
- 500 Server Error: Show generic error message

### Form Validation Display
```typescript
interface FormFieldProps {
  label: string;
  name: string;
  error?: string;
  children: React.ReactNode;
}
// Display error message below field in red
```

---

## Default Roles & Permissions

### Seeded Roles
1. **Super Admin** - All permissions
2. **Manager** - Most permissions except system settings
3. **Sales Rep** - Limited to sales-related permissions
4. **Accountant** - Limited to finance-related permissions

### Permission Modules
```typescript
const modules = [
  'users',      // users.view, users.create, users.edit, users.delete
  'roles',      // roles.view, roles.create, roles.edit, roles.delete
  'permissions', // permissions.view
  'audit_logs', // audit_logs.view
  'settings',   // settings.view, settings.edit
];
```

---

## Styling Guidelines

### Color Palette (Suggested)
```css
:root {
  --primary: #3b82f6;      /* Blue */
  --secondary: #6b7280;    /* Gray */
  --success: #10b981;      /* Green */
  --warning: #f59e0b;      /* Amber */
  --danger: #ef4444;       /* Red */
  --info: #06b6d4;         /* Cyan */
  
  --background: #f9fafb;
  --surface: #ffffff;
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --border: #e5e7eb;
}
```

### Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Sidebar Behavior
- Desktop: Always visible, collapsible to icons only
- Tablet: Overlay mode, toggle button
- Mobile: Full-screen overlay, hamburger menu

---

## File Structure (Suggested)

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   └── verify-email/[token]/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── users/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── [id]/edit/page.tsx
│   │   ├── roles/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── permissions/page.tsx
│   │   ├── audit-logs/page.tsx
│   │   ├── settings/page.tsx
│   │   └── profile/page.tsx
│   └── layout.tsx
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── DataTable.tsx
│   │   ├── Badge.tsx
│   │   ├── Avatar.tsx
│   │   └── ...
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── Breadcrumb.tsx
│   └── forms/
│       ├── UserForm.tsx
│       ├── RoleForm.tsx
│       └── SettingsForm.tsx
├── contexts/
│   └── AuthContext.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── usePermission.ts
│   └── useApi.ts
├── lib/
│   ├── api.ts
│   └── utils.ts
├── types/
│   └── index.ts
└── styles/
    └── globals.css
```

---

## API Integration Examples

### Axios Instance Setup
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Example API Hooks
```typescript
// useUsers.ts
export function useUsers(params: UserListParams) {
  const [data, setData] = useState<PaginatedResponse<User> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await api.get('/users', { params });
        setData(response.data);
      } catch (err) {
        setError('Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [params]);

  return { data, loading, error };
}
```

---

## Testing Checklist

### Authentication Flows
- [ ] User can register with valid data
- [ ] User cannot register with existing email
- [ ] User can login with valid credentials
- [ ] User cannot login without email verification
- [ ] User can request password reset
- [ ] User can reset password with valid token
- [ ] User can logout

### User Management
- [ ] Admin can view user list
- [ ] Admin can create new user
- [ ] Admin can edit user
- [ ] Admin can delete user (soft delete)
- [ ] Admin can assign roles to user
- [ ] Non-admin cannot access user management

### Role Management
- [ ] Admin can view roles
- [ ] Admin can create role
- [ ] Admin can edit role
- [ ] Admin cannot delete role with assigned users
- [ ] Admin can assign permissions to role

### Profile Management
- [ ] User can view own profile
- [ ] User can update profile
- [ ] User can change password
- [ ] User can upload avatar

### Audit Logs
- [ ] Admin can view audit logs
- [ ] Admin can filter by date range
- [ ] Admin can filter by user
- [ ] Admin can filter by action type

### System Settings
- [ ] Admin can view settings
- [ ] Admin can update settings
- [ ] Admin can upload company logo
- [ ] Settings persist after save

---

This documentation provides everything needed to build a complete admin dashboard UI for the System/Admin Module. The UI should be responsive, accessible, and follow modern design patterns.
