# Role-Based Access Control System

## Overview
The Fitness App now implements a comprehensive role-based access control (RBAC) system with four distinct access levels. This system ensures that users can only access and modify data appropriate to their role.

## Role Hierarchy

### 1. **Super Admin** (Level 4 - Highest Access)
- **Full system access** - can manage all users, athletes, and system settings
- Can promote/demote any user (except other Super Admins)
- Can view all data across the entire system
- Cannot be demoted by other Super Admins
- Typically system owners or primary administrators

**Permissions:**
- ✅ Manage all user roles
- ✅ View all performance tests
- ✅ Create/manage athletes
- ✅ Access admin statistics
- ✅ Full API access

### 2. **Admin** (Level 3 - High Access)
- Can manage Testers and Athletes but not other Admins or Super Admins
- Can view all athlete data and performance tests
- Can access system statistics and user management features
- Cannot modify Super Admin or other Admin accounts

**Permissions:**
- ✅ Manage Tester and Athlete roles
- ✅ View all performance tests
- ✅ Create/manage athletes
- ✅ Access admin statistics
- ❌ Cannot manage Admin or Super Admin accounts

### 3. **Tester** (Level 2 - Medium Access)
- Can view and manage athlete performance tests
- Can create new athlete profiles
- Can view all athletes in the system
- Cannot modify user accounts or roles

**Permissions:**
- ✅ Create/edit performance tests
- ✅ Create new athlete profiles
- ✅ View all athletes
- ✅ View all performance data
- ❌ Cannot manage user roles
- ❌ Cannot access admin features

### 4. **Athlete** (Level 1 - Basic Access)
- Can only view and update their own profile
- Can view their own performance data
- Most restricted access level
- Default role for new user registrations

**Permissions:**
- ✅ View own profile
- ✅ Update own profile information
- ✅ View own performance tests
- ❌ Cannot create performance tests
- ❌ Cannot view other users' data
- ❌ Cannot create athlete profiles

## Implementation Details

### Database Schema Changes
1. **New `role` column** added to users table with default value 'Athlete'
2. **Database constraint** ensures only valid roles can be assigned
3. **Timestamps** added for tracking when accounts are created/updated
4. **Default Super Admin** automatically created if none exists

### API Endpoints

#### Authentication & Profile
- `POST /api/auth/signup` - Register (with optional role assignment)
- `POST /api/auth/login` - Login (returns role information)
- `GET /api/auth/profile` - Get current user profile

#### User Management (Admin+ only)
- `GET /api/admin/users` - List all users with pagination/filtering
- `PUT /api/admin/users/:userId/role` - Update user role
- `GET /api/admin/stats` - System statistics

#### Role-Based Data Access
- `GET /api/dashboard` - Role-appropriate dashboard data
- `GET /api/athletes` - Role-filtered athlete list
- `POST /api/athletes` - Create athlete (Tester+ required)
- `POST /api/performance` - Submit test (Tester+ required)

### Role Validation Rules

#### Promotion/Demotion Rules:
- **Super Admin** required to create/modify Admin roles
- **Admin+** required to create/modify Tester roles
- **Tester+** required to create Athlete roles
- Users cannot modify accounts with equal or higher access levels
- Super Admins cannot demote other Super Admins

#### Data Access Rules:
- **Athletes** see only their own data
- **Testers+** see all athlete data
- **Admins+** see all system data
- **Super Admins** have unrestricted access

## Usage Examples

### Creating Users with Roles
```javascript
// Register a new Tester
POST /api/auth/signup
{
  "fullName": "John Tester",
  "email": "john@example.com",
  "password": "secure123",
  "role": "Tester"  // Optional, defaults to "Athlete"
}
```

### Managing User Roles
```javascript
// Promote user to Admin (requires Super Admin)
PUT /api/admin/users/123/role
{
  "role": "Admin"
}
```

### Role-Based Data Queries
```sql
-- View users who can manage Athletes
SELECT * FROM users WHERE role IN ('Super Admin', 'Admin', 'Tester');

-- Count users by role
SELECT role, COUNT(*) FROM users GROUP BY role;
```

## Security Considerations

1. **Role Inheritance**: Higher roles include all permissions of lower roles
2. **Self-Management**: Users cannot elevate their own privileges
3. **Admin Protection**: Super Admins cannot be modified by other Super Admins
4. **Default Security**: New users default to lowest privilege level (Athlete)
5. **Token Security**: JWTs include role information for efficient authorization

## Migration from Existing System

Existing users will automatically receive the "Athlete" role by default. A default Super Admin account is created on first startup:
- **Email**: admin@fitness-app.com
- **Password**: admin123 (should be changed immediately)
- **Role**: Super Admin

## Best Practices

1. **Principle of Least Privilege**: Assign minimum necessary role
2. **Regular Audits**: Review user roles periodically
3. **Role Rotation**: Consider rotating admin access
4. **Secure Defaults**: All new users start as Athletes
5. **Change Default Admin**: Update default Super Admin credentials immediately

## Testing the Role System

Use the provided `role-management.sql` script to:
- Create sample users for each role
- Test role-based queries
- Validate role constraints
- Monitor role distributions

## API Response Examples

### Login Response (includes role)
```json
{
  "token": "jwt_token_here",
  "role": "Admin",
  "userId": 123
}
```

### Dashboard Response (role-specific data)
```json
{
  "totalAthletes": 25,
  "recentTests": 10,
  "performanceRecords": [...],
  "userRole": "Tester"
}
```

This role system provides a flexible, secure foundation for managing access control in your fitness application while maintaining clear separation of responsibilities. 