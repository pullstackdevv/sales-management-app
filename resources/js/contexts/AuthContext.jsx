import React, { createContext, useContext, useMemo } from 'react';
import { usePage } from '@inertiajs/react';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const { auth } = usePage().props;
    
    const user = auth?.user || null;
    const roles = user?.roles || [];
    const primaryRole = roles[0] || null;
    
    // Get all permissions from all user roles (combined)
    const permissions = useMemo(() => {
        if (!roles || roles.length === 0) return [];
        
        const allPermissions = new Set();
        roles.forEach(role => {
            if (role.permissions && Array.isArray(role.permissions)) {
                role.permissions.forEach(permission => {
                    if (typeof permission === 'string') {
                        allPermissions.add(permission);
                    } else if (permission?.name) {
                        allPermissions.add(permission.name);
                    }
                });
            }
        });
        
        return Array.from(allPermissions);
    }, [roles]);
    
    // Check if user has permission
    const hasPermission = (permission) => {
        if (!permissions || permissions.length === 0) return false;
        
        // Owner has all permissions (wildcard)
        if (permissions.includes('*')) return true;
        
        // Check specific permission
        if (permissions.includes(permission)) return true;
        
        // Check module-level permission (e.g., 'orders' matches 'orders.view')
        const modulePermissions = permissions.filter(p => p.startsWith(permission + '.'));
        if (modulePermissions.length > 0) return true;
        
        return false;
    };
    
    // Check if user has any of the permissions
    const hasAnyPermission = (permissionList) => {
        if (!Array.isArray(permissionList)) return false;
        return permissionList.some(permission => hasPermission(permission));
    };
    
    // Check if user has all permissions
    const hasAllPermissions = (permissionList) => {
        if (!Array.isArray(permissionList)) return false;
        return permissionList.every(permission => hasPermission(permission));
    };
    
    // Check if user has specific role
    const hasRole = (roleName) => {
        if (!roles || roles.length === 0) return false;
        return roles.some(role => role.name === roleName);
    };
    
    // Check if user has any of the roles
    const hasAnyRole = (roleList) => {
        if (!Array.isArray(roleList)) return false;
        return roleList.some(roleName => hasRole(roleName));
    };
    
    const value = useMemo(() => ({
        user,
        roles,
        role: primaryRole, // For backward compatibility
        primaryRole,
        permissions,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        hasRole,
        hasAnyRole,
        isAuthenticated: !!user,
        isOwner: hasRole('owner'),
        isAdmin: hasRole('admin'),
        isStaff: hasRole('staff'),
        isCashier: hasRole('cashier')
    }), [user, roles, primaryRole, permissions]);
    
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;