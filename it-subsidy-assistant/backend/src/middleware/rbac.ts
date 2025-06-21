import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';

/**
 * Role-Based Access Control (RBAC) middleware
 * Enforces authorization based on user roles and permissions
 */

export interface UserRole {
  role: 'admin' | 'company' | 'consultant' | 'guest';
  permissions: string[];
}

// Permission definitions
export const PERMISSIONS = {
  // User management
  VIEW_ALL_USERS: 'view:all_users',
  EDIT_ALL_USERS: 'edit:all_users',
  DELETE_USERS: 'delete:users',
  
  // Company management
  VIEW_ALL_COMPANIES: 'view:all_companies',
  EDIT_ALL_COMPANIES: 'edit:all_companies',
  VIEW_OWN_COMPANY: 'view:own_company',
  EDIT_OWN_COMPANY: 'edit:own_company',
  
  // Application management
  VIEW_ALL_APPLICATIONS: 'view:all_applications',
  EDIT_ALL_APPLICATIONS: 'edit:all_applications',
  VIEW_OWN_APPLICATIONS: 'view:own_applications',
  CREATE_APPLICATION: 'create:application',
  SUBMIT_APPLICATION: 'submit:application',
  APPROVE_APPLICATION: 'approve:application',
  
  // Document management
  VIEW_ALL_DOCUMENTS: 'view:all_documents',
  VIEW_OWN_DOCUMENTS: 'view:own_documents',
  UPLOAD_DOCUMENTS: 'upload:documents',
  DELETE_OWN_DOCUMENTS: 'delete:own_documents',
  VERIFY_DOCUMENTS: 'verify:documents',
  
  // Subsidy management
  VIEW_SUBSIDIES: 'view:subsidies',
  MANAGE_SUBSIDIES: 'manage:subsidies',
  
  // System management
  VIEW_AUDIT_LOGS: 'view:audit_logs',
  MANAGE_SYSTEM: 'manage:system',
  VIEW_ANALYTICS: 'view:analytics'
};

// Role-permission mapping
const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [
    // Full system access
    PERMISSIONS.VIEW_ALL_USERS,
    PERMISSIONS.EDIT_ALL_USERS,
    PERMISSIONS.DELETE_USERS,
    PERMISSIONS.VIEW_ALL_COMPANIES,
    PERMISSIONS.EDIT_ALL_COMPANIES,
    PERMISSIONS.VIEW_ALL_APPLICATIONS,
    PERMISSIONS.EDIT_ALL_APPLICATIONS,
    PERMISSIONS.APPROVE_APPLICATION,
    PERMISSIONS.VIEW_ALL_DOCUMENTS,
    PERMISSIONS.VERIFY_DOCUMENTS,
    PERMISSIONS.VIEW_SUBSIDIES,
    PERMISSIONS.MANAGE_SUBSIDIES,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.MANAGE_SYSTEM,
    PERMISSIONS.VIEW_ANALYTICS
  ],
  
  consultant: [
    // Can view and assist with applications
    PERMISSIONS.VIEW_ALL_COMPANIES,
    PERMISSIONS.VIEW_ALL_APPLICATIONS,
    PERMISSIONS.VIEW_ALL_DOCUMENTS,
    PERMISSIONS.VIEW_SUBSIDIES,
    PERMISSIONS.VIEW_ANALYTICS
  ],
  
  company: [
    // Can manage own company and applications
    PERMISSIONS.VIEW_OWN_COMPANY,
    PERMISSIONS.EDIT_OWN_COMPANY,
    PERMISSIONS.VIEW_OWN_APPLICATIONS,
    PERMISSIONS.CREATE_APPLICATION,
    PERMISSIONS.SUBMIT_APPLICATION,
    PERMISSIONS.VIEW_OWN_DOCUMENTS,
    PERMISSIONS.UPLOAD_DOCUMENTS,
    PERMISSIONS.DELETE_OWN_DOCUMENTS,
    PERMISSIONS.VIEW_SUBSIDIES
  ],
  
  guest: [
    // Limited read-only access
    PERMISSIONS.VIEW_SUBSIDIES
  ]
};

/**
 * Check if user has required permission
 */
export function hasPermission(userRole: string, requiredPermission: string): boolean {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(requiredPermission);
}

/**
 * Check if user has any of the required permissions
 */
export function hasAnyPermission(userRole: string, requiredPermissions: string[]): boolean {
  return requiredPermissions.some(permission => hasPermission(userRole, permission));
}

/**
 * Check if user has all required permissions
 */
export function hasAllPermissions(userRole: string, requiredPermissions: string[]): boolean {
  return requiredPermissions.every(permission => hasPermission(userRole, permission));
}

/**
 * Middleware to check single permission
 */
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user) {
      logger.warn('Unauthorized access attempt - no user');
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: '認証が必要です' 
      });
    }
    
    if (!hasPermission(user.role, permission)) {
      logger.warn(`Access denied for user ${user.id} - missing permission: ${permission}`);
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'このリソースへのアクセス権限がありません' 
      });
    }
    
    next();
  };
}

/**
 * Middleware to check multiple permissions (any)
 */
export function requireAnyPermission(...permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user) {
      logger.warn('Unauthorized access attempt - no user');
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: '認証が必要です' 
      });
    }
    
    if (!hasAnyPermission(user.role, permissions)) {
      logger.warn(`Access denied for user ${user.id} - missing any of permissions: ${permissions.join(', ')}`);
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'このリソースへのアクセス権限がありません' 
      });
    }
    
    next();
  };
}

/**
 * Middleware to check multiple permissions (all)
 */
export function requireAllPermissions(...permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user) {
      logger.warn('Unauthorized access attempt - no user');
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: '認証が必要です' 
      });
    }
    
    if (!hasAllPermissions(user.role, permissions)) {
      logger.warn(`Access denied for user ${user.id} - missing all permissions: ${permissions.join(', ')}`);
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'このリソースへのアクセス権限がありません' 
      });
    }
    
    next();
  };
}

/**
 * Middleware to check role
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user) {
      logger.warn('Unauthorized access attempt - no user');
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: '認証が必要です' 
      });
    }
    
    if (!roles.includes(user.role)) {
      logger.warn(`Access denied for user ${user.id} - wrong role: ${user.role}`);
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'このリソースへのアクセス権限がありません' 
      });
    }
    
    next();
  };
}

/**
 * Dynamic permission check for resource ownership
 */
export function requireOwnership(resourceType: 'company' | 'application' | 'document') {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    const resourceId = req.params.id;
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: '認証が必要です' 
      });
    }
    
    // Admins can access everything
    if (user.role === 'admin') {
      return next();
    }
    
    try {
      let hasAccess = false;
      
      switch (resourceType) {
        case 'company':
          hasAccess = user.companyId === resourceId;
          break;
          
        case 'application':
          // Check if application belongs to user's company
          // This would typically involve a database query
          // For now, we'll assume the check is implemented elsewhere
          hasAccess = await checkApplicationOwnership(user.companyId, resourceId);
          break;
          
        case 'document':
          // Check if document belongs to user's application
          hasAccess = await checkDocumentOwnership(user.companyId, resourceId);
          break;
      }
      
      if (!hasAccess) {
        logger.warn(`Ownership check failed for user ${user.id} on ${resourceType} ${resourceId}`);
        return res.status(403).json({ 
          error: 'Forbidden',
          message: 'このリソースへのアクセス権限がありません' 
        });
      }
      
      next();
    } catch (error) {
      logger.error('Error in ownership check:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'アクセス権限の確認中にエラーが発生しました' 
      });
    }
  };
}

// Helper functions (these would typically query the database)
async function checkApplicationOwnership(companyId: string, applicationId: string): Promise<boolean> {
  // TODO: Implement actual database check
  // For now, return true for demonstration
  return true;
}

async function checkDocumentOwnership(companyId: string, documentId: string): Promise<boolean> {
  // TODO: Implement actual database check
  // For now, return true for demonstration
  return true;
}

/**
 * Log security events
 */
export function logSecurityEvent(
  userId: string,
  action: string,
  resource: string,
  result: 'allowed' | 'denied',
  details?: any
) {
  logger.info('Security event', {
    userId,
    action,
    resource,
    result,
    details,
    timestamp: new Date().toISOString()
  });
}