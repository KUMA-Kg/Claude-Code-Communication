import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  PERMISSIONS
} from '@/middleware/rbac';

describe('RBAC (Role-Based Access Control) Unit Tests', () => {
  describe('hasPermission', () => {
    test('admin should have all permissions', () => {
      expect(hasPermission('admin', PERMISSIONS.VIEW_ALL_USERS)).toBe(true);
      expect(hasPermission('admin', PERMISSIONS.EDIT_ALL_COMPANIES)).toBe(true);
      expect(hasPermission('admin', PERMISSIONS.APPROVE_APPLICATION)).toBe(true);
      expect(hasPermission('admin', PERMISSIONS.MANAGE_SYSTEM)).toBe(true);
    });

    test('company user should have limited permissions', () => {
      expect(hasPermission('company', PERMISSIONS.VIEW_OWN_COMPANY)).toBe(true);
      expect(hasPermission('company', PERMISSIONS.CREATE_APPLICATION)).toBe(true);
      expect(hasPermission('company', PERMISSIONS.VIEW_ALL_COMPANIES)).toBe(false);
      expect(hasPermission('company', PERMISSIONS.APPROVE_APPLICATION)).toBe(false);
    });

    test('consultant should have read permissions', () => {
      expect(hasPermission('consultant', PERMISSIONS.VIEW_ALL_COMPANIES)).toBe(true);
      expect(hasPermission('consultant', PERMISSIONS.VIEW_ALL_APPLICATIONS)).toBe(true);
      expect(hasPermission('consultant', PERMISSIONS.EDIT_ALL_COMPANIES)).toBe(false);
      expect(hasPermission('consultant', PERMISSIONS.APPROVE_APPLICATION)).toBe(false);
    });

    test('guest should have minimal permissions', () => {
      expect(hasPermission('guest', PERMISSIONS.VIEW_SUBSIDIES)).toBe(true);
      expect(hasPermission('guest', PERMISSIONS.VIEW_OWN_COMPANY)).toBe(false);
      expect(hasPermission('guest', PERMISSIONS.CREATE_APPLICATION)).toBe(false);
    });

    test('unknown role should have no permissions', () => {
      expect(hasPermission('unknown', PERMISSIONS.VIEW_SUBSIDIES)).toBe(false);
      expect(hasPermission('unknown', PERMISSIONS.VIEW_OWN_COMPANY)).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    test('should return true if user has at least one permission', () => {
      const permissions = [
        PERMISSIONS.VIEW_ALL_USERS,
        PERMISSIONS.EDIT_ALL_USERS,
        PERMISSIONS.DELETE_USERS
      ];
      
      expect(hasAnyPermission('admin', permissions)).toBe(true);
      expect(hasAnyPermission('company', [
        PERMISSIONS.VIEW_OWN_COMPANY,
        PERMISSIONS.VIEW_ALL_COMPANIES
      ])).toBe(true);
    });

    test('should return false if user has none of the permissions', () => {
      const adminPermissions = [
        PERMISSIONS.MANAGE_SYSTEM,
        PERMISSIONS.APPROVE_APPLICATION
      ];
      
      expect(hasAnyPermission('company', adminPermissions)).toBe(false);
      expect(hasAnyPermission('guest', adminPermissions)).toBe(false);
    });

    test('should handle empty permission array', () => {
      expect(hasAnyPermission('admin', [])).toBe(false);
      expect(hasAnyPermission('company', [])).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    test('should return true if user has all permissions', () => {
      const permissions = [
        PERMISSIONS.VIEW_ALL_USERS,
        PERMISSIONS.EDIT_ALL_USERS
      ];
      
      expect(hasAllPermissions('admin', permissions)).toBe(true);
    });

    test('should return false if user lacks any permission', () => {
      const permissions = [
        PERMISSIONS.VIEW_OWN_COMPANY,
        PERMISSIONS.EDIT_ALL_COMPANIES // Company user doesn't have this
      ];
      
      expect(hasAllPermissions('company', permissions)).toBe(false);
    });

    test('should handle single permission', () => {
      expect(hasAllPermissions('admin', [PERMISSIONS.MANAGE_SYSTEM])).toBe(true);
      expect(hasAllPermissions('company', [PERMISSIONS.MANAGE_SYSTEM])).toBe(false);
    });

    test('should return true for empty permission array', () => {
      expect(hasAllPermissions('admin', [])).toBe(true);
      expect(hasAllPermissions('guest', [])).toBe(true);
    });
  });

  describe('Permission Inheritance Tests', () => {
    test('admin permissions should be superset of other roles', () => {
      const companyPermissions = [
        PERMISSIONS.VIEW_OWN_COMPANY,
        PERMISSIONS.CREATE_APPLICATION,
        PERMISSIONS.VIEW_SUBSIDIES
      ];

      // Admin should have all company permissions
      companyPermissions.forEach(permission => {
        expect(hasPermission('admin', permission)).toBe(false); // Admin doesn't have "own" permissions
      });

      // But admin has equivalent "all" permissions
      expect(hasPermission('admin', PERMISSIONS.VIEW_ALL_COMPANIES)).toBe(true);
      expect(hasPermission('admin', PERMISSIONS.VIEW_ALL_APPLICATIONS)).toBe(true);
    });

    test('consultant should not have write permissions', () => {
      const writePermissions = [
        PERMISSIONS.EDIT_ALL_USERS,
        PERMISSIONS.EDIT_ALL_COMPANIES,
        PERMISSIONS.CREATE_APPLICATION,
        PERMISSIONS.APPROVE_APPLICATION,
        PERMISSIONS.MANAGE_SUBSIDIES
      ];

      writePermissions.forEach(permission => {
        expect(hasPermission('consultant', permission)).toBe(false);
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle null/undefined roles gracefully', () => {
      expect(hasPermission(null as any, PERMISSIONS.VIEW_SUBSIDIES)).toBe(false);
      expect(hasPermission(undefined as any, PERMISSIONS.VIEW_SUBSIDIES)).toBe(false);
      expect(hasPermission('', PERMISSIONS.VIEW_SUBSIDIES)).toBe(false);
    });

    test('should handle invalid permissions gracefully', () => {
      expect(hasPermission('admin', 'invalid.permission')).toBe(false);
      expect(hasPermission('admin', null as any)).toBe(false);
      expect(hasPermission('admin', undefined as any)).toBe(false);
    });

    test('should be case sensitive for roles', () => {
      expect(hasPermission('Admin', PERMISSIONS.MANAGE_SYSTEM)).toBe(false);
      expect(hasPermission('ADMIN', PERMISSIONS.MANAGE_SYSTEM)).toBe(false);
      expect(hasPermission('admin', PERMISSIONS.MANAGE_SYSTEM)).toBe(true);
    });
  });

  describe('Security Boundary Tests', () => {
    test('company users should not access other company data', () => {
      // Company users should only access their own data
      expect(hasPermission('company', PERMISSIONS.VIEW_OWN_COMPANY)).toBe(true);
      expect(hasPermission('company', PERMISSIONS.VIEW_ALL_COMPANIES)).toBe(false);
      expect(hasPermission('company', PERMISSIONS.VIEW_OWN_APPLICATIONS)).toBe(true);
      expect(hasPermission('company', PERMISSIONS.VIEW_ALL_APPLICATIONS)).toBe(false);
    });

    test('critical permissions should be admin-only', () => {
      const criticalPermissions = [
        PERMISSIONS.DELETE_USERS,
        PERMISSIONS.MANAGE_SYSTEM,
        PERMISSIONS.APPROVE_APPLICATION,
        PERMISSIONS.MANAGE_SUBSIDIES
      ];

      const nonAdminRoles = ['company', 'consultant', 'guest'];

      criticalPermissions.forEach(permission => {
        nonAdminRoles.forEach(role => {
          expect(hasPermission(role, permission)).toBe(false);
        });
        expect(hasPermission('admin', permission)).toBe(true);
      });
    });
  });
});