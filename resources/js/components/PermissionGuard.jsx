import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const PermissionGuard = ({ 
    children, 
    permission, 
    permissions, 
    role, 
    roles, 
    requireAll = false,
    fallback = null 
}) => {
    const { hasPermission, hasAnyPermission, hasAllPermissions, hasRole, hasAnyRole } = useAuth();
    
    let hasAccess = false;
    
    // Check single permission
    if (permission) {
        hasAccess = hasPermission(permission);
    }
    
    // Check multiple permissions
    if (permissions && Array.isArray(permissions)) {
        hasAccess = requireAll 
            ? hasAllPermissions(permissions)
            : hasAnyPermission(permissions);
    }
    
    // Check single role
    if (role) {
        hasAccess = hasRole(role);
    }
    
    // Check multiple roles
    if (roles && Array.isArray(roles)) {
        hasAccess = hasAnyRole(roles);
    }
    
    // If no permission/role specified, allow access
    if (!permission && !permissions && !role && !roles) {
        hasAccess = true;
    }
    
    return hasAccess ? children : fallback;
};

export default PermissionGuard;