# RBAC Middleware & Frontend Updates

**Date:** November 21, 2025  
**Status:** ✅ **COMPLETED**

---

## 🔧 Files Updated

### 1. **HandleInertiaRequests.php** ✅
**File:** `app/Http/Middleware/HandleInertiaRequests.php`

**Change:**
```php
// OLD (Line 43)
'user' => $request->user() ? $request->user()->load('role') : null,

// NEW (Line 43)
'user' => $request->user() ? $request->user()->load('roles') : null,
```

**Reason:**
- Updated from single `role` relationship to many-to-many `roles` relationship
- This middleware shares user data with all Inertia pages
- Now loads all roles for the authenticated user

**Impact:**
- Frontend now receives `auth.user.roles` (array) instead of `auth.user.role` (object)
- All Inertia pages have access to user's roles

---

### 2. **UserSettings.jsx** ✅
**File:** `resources/js/Pages/Settings/UserSettings.jsx`

**Change:**
```javascript
// OLD (Line 61)
role_id: user.role?.name || user.role_id || '',

// NEW (Line 61)
role_id: user.roles?.[0]?.name || user.role_id || '',
```

**Reason:**
- Updated to access first role from `roles` array
- Maintains backward compatibility with fallback to `role_id`
- Handles case where user might have multiple roles (takes first one)

**Impact:**
- Edit user modal now correctly populates role field
- No more "undefined relationship" errors

---

## 🔍 Verification Performed

### Backend Checks ✅
- [x] No more `->load('role')` in middleware
- [x] No more `->with('role')` in controllers
- [x] All controllers use `->with('roles')` or `->load('roles')`
- [x] UserController properly handles `role_id` parameter

### Frontend Checks ✅
- [x] No more `user.role` references (changed to `user.roles`)
- [x] UserSettings.jsx updated to use `roles` array
- [x] All Inertia pages receive correct user data structure

---

## 📊 Data Structure Changes

### OLD Structure (Single Role)
```javascript
auth: {
  user: {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    role: {              // Single object
      id: 1,
      name: "admin",
      description: "Administrator"
    }
  }
}
```

### NEW Structure (Multiple Roles)
```javascript
auth: {
  user: {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    roles: [             // Array of objects
      {
        id: 1,
        name: "admin",
        description: "Administrator"
      }
    ]
  }
}
```

---

## 🎯 How to Access User Roles in Frontend

### In Inertia Pages
```javascript
import { usePage } from '@inertiajs/react';

function MyComponent() {
  const { auth } = usePage().props;
  
  // Get all roles
  const roles = auth.user?.roles || [];
  
  // Get first role (primary role)
  const primaryRole = auth.user?.roles?.[0];
  
  // Check if user has specific role
  const isAdmin = roles.some(role => role.name === 'admin');
  
  return (
    <div>
      <p>Primary Role: {primaryRole?.name}</p>
      <p>All Roles: {roles.map(r => r.name).join(', ')}</p>
    </div>
  );
}
```

### In Components
```javascript
function UserBadge({ user }) {
  const primaryRole = user.roles?.[0];
  
  return (
    <span className="badge">
      {primaryRole?.name || 'No Role'}
    </span>
  );
}
```

---

## 🧪 Testing Checklist

### Backend Testing
- [x] Login as user → Check no errors in console
- [x] Navigate to any CMS page → Check user data loads correctly
- [x] Edit user in UserSettings → Check role field populates
- [x] Create new user → Check role assignment works
- [x] Check Laravel logs for any "undefined relationship" errors

### Frontend Testing
- [x] Open browser console → Check `auth.user.roles` is array
- [x] Navigate to UserSettings → Check edit modal shows correct role
- [x] Check all pages load without JavaScript errors
- [x] Verify role-based UI elements display correctly

---

## 🔒 Middleware Flow

### 1. **User Authentication**
```
User logs in → Auth middleware
```

### 2. **Inertia Request**
```
HandleInertiaRequests middleware
→ Load user with roles
→ Share to frontend via props
```

### 3. **Frontend Receives**
```javascript
{
  auth: {
    user: {
      ...userData,
      roles: [...]  // Array of role objects
    }
  }
}
```

### 4. **Permission Check (if needed)**
```
EnsureModulePermission middleware
→ Check user permissions via HasRoles trait
→ Allow/Deny access
```

---

## 📝 Migration Notes

### For Developers

**If you're working on frontend:**
- Always use `user.roles` (array) instead of `user.role` (object)
- Access primary role with `user.roles?.[0]`
- Check for role existence before accessing properties

**If you're working on backend:**
- Always use `->load('roles')` or `->with('roles')`
- Never use `->load('role')` or `->with('role')`
- Use `$user->roles()` relationship for queries

---

## ✅ Status Summary

| Component | Status | Notes |
|-----------|--------|-------|
| HandleInertiaRequests | ✅ Updated | Now loads `roles` |
| UserSettings.jsx | ✅ Updated | Uses `roles[0]` |
| EnsureModulePermission | ✅ OK | Already uses HasRoles trait |
| UserController | ✅ OK | Already uses `roles` |
| RoleController | ✅ OK | Already uses pivot tables |
| All other controllers | ✅ OK | No direct role access |

---

## 🎉 Result

**No more "Call to undefined relationship [role]" errors!**

All middleware and frontend components now correctly use the new many-to-many `roles` relationship.

---

**Last Updated:** November 21, 2025  
**Version:** 1.0  
**Status:** ✅ Complete & Tested
