# RBAC Implementation Examples & Data Flow

## 📊 Complete Data Flow Diagrams

### 1. User Login & Permission Initialization Flow

```
┌──────────────────────────────────────────────────────────────┐
│ User submits login form                                      │
│ (email, password)                                            │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ AuthController::login()                                      │
│ ├─ Validate credentials                                      │
│ ├─ Hash password check                                       │
│ └─ Load user with role relationship                          │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ User Model loaded with:                                      │
│ ├─ id, name, email                                           │
│ ├─ role_id (foreign key)                                     │
│ ├─ is_active                                                 │
│ └─ role relationship (Role model)                            │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ Role Model loaded with:                                      │
│ ├─ name ('owner', 'admin', 'staff', etc.)                   │
│ ├─ permissions (JSON array)                                  │
│ ├─ is_active                                                 │
│ └─ is_system                                                 │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ Create API token (Sanctum)                                   │
│ Store in session/auth guard                                  │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ Return to frontend with:                                     │
│ ├─ user object                                               │
│ ├─ role information                                          │
│ ├─ permissions array                                         │
│ └─ API token                                                 │
└──────────────────────────────────────────────────────────────┘
```

### 2. Route Access Permission Check Flow

```
┌──────────────────────────────────────────────────────────────┐
│ User requests: GET /cms/orders/123                           │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ Middleware Stack:                                            │
│ 1. Authenticate::class                                       │
│    └─ Check if user is logged in                             │
│ 2. HandleInertiaRequests::class                              │
│    └─ Prepare Inertia response                               │
│ 3. EnsureModulePermission::class ← RBAC CHECK               │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ EnsureModulePermission::handle()                             │
│ ├─ Check if path is /cms/* → YES                             │
│ ├─ Extract path: 'orders' from '/cms/orders/123'            │
│ ├─ Map to permission: 'orders'                               │
│ └─ Call: $user->hasPermission('orders')                      │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ User::hasPermission('orders')                                │
│ ├─ Is user inactive? → NO                                    │
│ ├─ Is user owner? → NO (for this example)                    │
│ ├─ Get role permissions from $user->role                     │
│ └─ Check if 'orders' in permissions array                    │
└────────────────────┬─────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
   ✅ HAS PERMISSION        ❌ NO PERMISSION
        │                         │
        ▼                         ▼
   Continue to Route        Return 403 Forbidden
   Render Order Page        Render Error Page
```

### 3. Role Permission Update Flow

```
┌──────────────────────────────────────────────────────────────┐
│ Admin opens Settings → Role Settings                         │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ RoleSettings.jsx::useEffect()                                │
│ └─ Fetch: GET /api/roles                                     │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ RoleController::index()                                      │
│ ├─ Query roles from database                                 │
│ ├─ Transform data for frontend                               │
│ └─ Return JSON response                                      │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ Frontend displays roles in table                             │
│ ├─ Role name                                                 │
│ ├─ Description                                               │
│ ├─ Permissions (first 3 + count)                             │
│ └─ Edit button                                               │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ Admin clicks Edit on 'staff' role                            │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ Modal opens with:                                            │
│ ├─ Description textarea                                      │
│ ├─ Permission checkboxes (2 columns)                         │
│ │  ├─ ☑ dashboard                                            │
│ │  ├─ ☑ orders                                               │
│ │  ├─ ☑ products                                             │
│ │  ├─ ☑ customers                                            │
│ │  ├─ ☐ stock                                                │
│ │  ├─ ☐ vouchers                                             │
│ │  └─ ... more                                               │
│ └─ Save button                                               │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ Admin checks 'stock' permission                              │
│ └─ State updates: permissions array                          │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ Admin clicks "Simpan"                                        │
│ └─ Submit: PUT /api/roles/staff                              │
│    {                                                         │
│      description: "...",                                     │
│      permissions: ["dashboard", "orders", "products", ...]  │
│    }                                                         │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ RoleController::update()                                     │
│ ├─ Validate input                                            │
│ ├─ Find role by name                                         │
│ ├─ Update role record                                        │
│ └─ Return success response                                   │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ Database updated:                                            │
│ UPDATE roles                                                 │
│ SET permissions = '["dashboard","orders","products",...]'    │
│ WHERE name = 'staff'                                         │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ Frontend shows success toast                                 │
│ └─ Refetch roles via GET /api/roles                          │
└──────────────────────────────────────────────────────────────┘
```

---

## 💻 Code Examples

### Example 1: Check Permission in React Component

```jsx
// File: resources/js/Pages/Order/OrderData.jsx
import { useAuth } from '@/hooks/useAuth';

export default function OrderData() {
  const { user } = useAuth();
  
  // Check if user can view orders
  if (!user.hasPermission('orders.view')) {
    return <div>You don't have permission to view orders</div>;
  }
  
  // Check if user can create orders
  const canCreate = user.hasPermission('orders.create');
  
  // Check if user can edit orders
  const canEdit = user.hasPermission('orders.edit');
  
  // Check if user can delete orders
  const canDelete = user.hasPermission('orders.delete');
  
  return (
    <div>
      <h1>Orders</h1>
      
      {canCreate && (
        <button onClick={() => navigate('/cms/order/add')}>
          Add Order
        </button>
      )}
      
      <table>
        <tbody>
          {orders.map(order => (
            <tr key={order.id}>
              <td>{order.order_number}</td>
              <td>{order.customer_name}</td>
              <td>
                {canEdit && (
                  <button onClick={() => editOrder(order.id)}>
                    Edit
                  </button>
                )}
                {canDelete && (
                  <button onClick={() => deleteOrder(order.id)}>
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Example 2: Middleware Permission Check

```php
// File: app/Http/Middleware/EnsureModulePermission.php

public function handle(Request $request, Closure $next): Response
{
    // Only guard CMS area
    if (!$request->is('cms/*')) {
        return $next($request);
    }

    $user = Auth::user();
    if (!$user) {
        return response('Unauthorized', 401);
    }

    // Infer required permission from path
    $required = $this->inferModulePermission($request);
    if (!$required) {
        return $next($request);
    }

    // Check if user has permission
    if ($this->userHasPermission($user, $required)) {
        return $next($request);
    }

    // User doesn't have permission - return 403
    return Inertia::render('Errors/Forbidden')
        ->toResponse($request)
        ->setStatusCode(403);
}

protected function inferModulePermission(Request $request): ?string
{
    $path = ltrim(preg_replace('#^cms/#', '', $request->path()), '/');
    $first = strtolower(explode('/', $path)[0] ?? '');

    $map = [
        'dashboard'      => 'dashboard',
        'order'          => 'orders',
        'orders'         => 'orders',
        'product'        => 'products',
        'products'       => 'products',
        'customer'       => 'customers',
        'customers'      => 'customers',
        'stock-opname'   => 'stock',
        'voucher'        => 'vouchers',
        'vouchers'       => 'vouchers',
        'expense'        => 'expenses',
        'report'         => 'reports',
        'reports'        => 'reports',
        'settings'       => 'settings',
    ];

    return $map[$first] ?? null;
}
```

### Example 3: Permission Check in Model

```php
// File: app/Models/User.php

public function hasPermission(string $permission): bool
{
    // User must be active
    if (!$this->is_active) {
        return false;
    }

    // Owner has all permissions
    if ($this->isOwner()) {
        return true;
    }

    // Get role permissions
    $rolePermissions = $this->getRolePermissions();
    
    // Check if permission matches any role permission pattern
    foreach ($rolePermissions as $rolePermission) {
        if ($rolePermission === '*' || 
            $this->matchesPermissionPattern($permission, $rolePermission)) {
            return true;
        }
    }

    return false;
}

private function matchesPermissionPattern(string $permission, string $pattern): bool
{
    // Handle wildcard patterns (e.g., 'orders.*')
    if (str_ends_with($pattern, '.*')) {
        $prefix = str_replace('.*', '', $pattern);
        return str_starts_with($permission, $prefix . '.');
    }
    
    // Exact match
    return $permission === $pattern;
}

public function getRolePermissions(): array
{
    if (!$this->role) {
        return [];
    }

    return $this->role->permissions ?? [];
}
```

### Example 4: Role Permission Update

```php
// File: app/Http/Controllers/RoleController.php

public function update(Request $request, string $roleName): JsonResponse
{
    // Find role by name
    $role = Role::where('name', $roleName)->firstOrFail();

    // Validate input
    $validated = $request->validate([
        'description' => 'nullable|string|max:255',
        'permissions' => 'required|array',
        'permissions.*' => 'required|string'
    ]);

    try {
        DB::beginTransaction();

        // Update role
        $role->update([
            'description' => $validated['description'] ?? $role->description,
            'permissions' => $validated['permissions']
        ]);

        DB::commit();

        return response()->json([
            'status' => 'success',
            'message' => 'Role updated successfully',
            'data' => [
                'role' => $role->name,
                'description' => $role->description,
                'permissions' => $role->permissions ?? [],
                'is_active' => $role->is_active,
                'is_system' => $role->is_system
            ]
        ]);
    } catch (\Exception $e) {
        DB::rollBack();
        throw $e;
    }
}
```

### Example 5: User Creation with Role

```php
// File: app/Http/Controllers/UserController.php

public function store(Request $request): JsonResponse
{
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|email|unique:users,email',
        'password' => 'required|string|min:8|confirmed',
        'role_id' => 'required|exists:roles,id',
        'is_active' => 'boolean'
    ]);

    try {
        DB::beginTransaction();

        // Create user with role
        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role_id' => $validated['role_id'],
            'is_active' => $validated['is_active'] ?? true
        ]);

        // Load role relationship
        $user->load('role');

        DB::commit();

        return response()->json([
            'status' => 'success',
            'message' => 'User created successfully',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'is_active' => $user->is_active
            ]
        ], 201);
    } catch (\Exception $e) {
        DB::rollBack();
        throw $e;
    }
}
```

### Example 6: Frontend Role Assignment

```jsx
// File: resources/js/Pages/Settings/UserSettings.jsx

const [formData, setFormData] = useState({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  role_id: '',
  is_active: true
});

const [roles, setRoles] = useState([]);
const [roleDescriptions, setRoleDescriptions] = useState({});

// Fetch available roles
const fetchRoles = async () => {
  const response = await api.get("/roles");
  if (response.data.status === 'success') {
    setRoles(response.data.data);
  }
};

// Fetch role descriptions and permissions
const fetchRoleDescriptions = async () => {
  const response = await api.get("/users/role-permissions");
  if (response.data.status === 'success') {
    setRoleDescriptions(response.data.data);
  }
};

// Handle role change
const handleRoleChange = (e) => {
  setFormData(prev => ({
    ...prev,
    role_id: e.target.value
  }));
};

// Render role dropdown with description
return (
  <div>
    <label>Role *</label>
    <select 
      value={formData.role_id} 
      onChange={handleRoleChange}
    >
      <option value="">Select Role</option>
      {roles.map(role => (
        <option key={role.id} value={role.id}>
          {role.name}
        </option>
      ))}
    </select>

    {/* Show role description and permissions */}
    {formData.role_id && (() => {
      const selectedRole = roles.find(r => r.id === formData.role_id);
      const roleDesc = roleDescriptions[selectedRole?.name];
      
      return (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="font-medium text-blue-800 mb-1">
            {roleDesc?.description || selectedRole?.description}
          </p>
          <div className="text-sm text-blue-600">
            <strong>Permissions:</strong>
            <ul className="list-disc list-inside mt-1">
              {(roleDesc?.permissions || []).map((perm, idx) => (
                <li key={idx}>{perm}</li>
              ))}
            </ul>
          </div>
        </div>
      );
    })()}
  </div>
);
```

---

## 🔄 Permission Matching Examples

### Example 1: Exact Match
```php
// User has permission: 'orders.view'
$user->hasPermission('orders.view')     // ✅ true
$user->hasPermission('orders.create')   // ❌ false
$user->hasPermission('products.view')   // ❌ false
```

### Example 2: Wildcard Pattern Match
```php
// User has permission: 'orders.*'
$user->hasPermission('orders.view')     // ✅ true
$user->hasPermission('orders.create')   // ✅ true
$user->hasPermission('orders.edit')     // ✅ true
$user->hasPermission('orders.delete')   // ✅ true
$user->hasPermission('products.view')   // ❌ false
```

### Example 3: Super Admin Wildcard
```php
// User has permission: '*'
$user->hasPermission('orders.view')     // ✅ true
$user->hasPermission('products.create') // ✅ true
$user->hasPermission('anything.else')   // ✅ true
```

### Example 4: Coarse-Grained Permission
```php
// User has permission: 'orders' (coarse-grained)
// Middleware checks: $user->hasPermission('orders')
$user->hasPermission('orders')          // ✅ true
// Component checks: $user->hasPermission('orders.view')
$user->hasPermission('orders.view')     // ❌ false (exact match only)
```

---

## 🧪 Testing Scenarios

### Scenario 1: Staff User Accessing Orders
```
1. Staff user logs in
2. User role_id = 2 (staff role)
3. Staff role permissions = ['dashboard', 'orders', 'products', 'customers', 'reports']
4. User requests /cms/order/data
5. Middleware extracts 'orders' permission
6. Calls $user->hasPermission('orders')
7. Checks role.permissions array
8. Finds 'orders' in array
9. Returns true → Allow access
```

### Scenario 2: Staff User Accessing Settings
```
1. Staff user requests /cms/settings/user
2. Middleware extracts 'settings' permission
3. Calls $user->hasPermission('settings')
4. Checks role.permissions array
5. 'settings' NOT in array
6. Returns false → 403 Forbidden
```

### Scenario 3: Owner User Accessing Anything
```
1. Owner user requests any /cms/* route
2. Middleware checks $user->hasPermission(any_permission)
3. User.isOwner() returns true
4. Returns true immediately → Allow access
```

---

## 📈 Database State Examples

### Roles Table
```
id | name      | description                          | permissions                    | is_active | is_system
---|-----------|--------------------------------------|--------------------------------|-----------|----------
1  | owner     | Akses penuh ke semua fitur sistem   | ["*"]                          | 1         | 1
2  | admin     | Akses ke semua fitur...             | ["dashboard","orders",...]     | 1         | 1
3  | staff     | Akses ke orders, products...        | ["dashboard","orders",...]     | 1         | 1
4  | warehouse | Akses ke stock dan inventory        | ["dashboard","stock",...]      | 1         | 0
```

### Users Table
```
id | name           | email              | role_id | is_active | deleted_at
---|----------------|--------------------|---------|-----------|----------
1  | John Owner     | owner@example.com  | 1       | 1         | NULL
2  | Jane Admin     | admin@example.com  | 2       | 1         | NULL
3  | Bob Staff      | staff@example.com  | 3       | 1         | NULL
4  | Inactive User  | inactive@example.com | 3      | 0         | NULL
5  | Deleted User   | deleted@example.com | 2       | 1         | 2025-11-21
```

---

## 🚀 Implementation Checklist

- [x] Create roles table with permissions JSON
- [x] Add role_id foreign key to users table
- [x] Implement Role model with hasPermission()
- [x] Implement User model with role relationship
- [x] Create EnsureModulePermission middleware
- [x] Create RoleController for CRUD
- [x] Create UserController for user management
- [x] Build RoleSettings.jsx UI
- [x] Build UserSettings.jsx UI
- [x] Add route protection with middleware
- [x] Create RoleSeeder with default roles
- [x] Implement permission inheritance
- [x] Add wildcard permission support
- [x] Protect system roles from deletion
- [x] Add soft deletes for users
- [x] Implement role-based permission checking

---

## 📚 Related Documentation

- See `RBAC_GUIDE.md` for complete architecture
- See `RBAC_QUICK_REFERENCE.md` for quick lookup
- Check `app/Models/Role.php` for permission logic
- Check `app/Models/User.php` for user methods
- Check `app/Http/Middleware/EnsureModulePermission.php` for route protection
