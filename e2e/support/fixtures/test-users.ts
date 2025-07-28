import { TestUser, UserRole } from '../types/test-types';

export const createTestUser = (overrides: Partial<TestUser> = {}): TestUser => ({
  email: 'test@example.com',
  displayName: 'Test User',
  uid: 'test-user-uid',
  roles: [
    {
      type: 'superAdmin',
      permissions: ['admin:read', 'admin:write', 'roles:create', 'users:manage'],
    },
  ],
  ...overrides,
});

export const createSuperAdminUser = (): TestUser =>
  createTestUser({
    email: 'superadmin@example.com',
    displayName: 'Super Admin User',
    uid: 'super-admin-uid',
    roles: [
      {
        type: 'superAdmin',
        permissions: ['admin:read', 'admin:write', 'roles:create', 'users:manage'],
      },
    ],
  });

export const createCepAdminUser = (): TestUser =>
  createTestUser({
    email: 'cepadmin@example.com',
    displayName: 'CEP Admin User',
    uid: 'cep-admin-uid',
    roles: [
      {
        type: 'cepAdmin',
        permissions: ['org-units:read', 'devices:manage', 'reports:read'],
      },
    ],
  });

export const createParticipantUser = (): TestUser =>
  createTestUser({
    email: 'participant@example.com',
    displayName: 'Participant User',
    uid: 'participant-uid',
    roles: [
      {
        type: 'participant',
        permissions: ['dashboard:read'],
      },
    ],
  });

export const createMultiRoleUser = (): TestUser =>
  createTestUser({
    email: 'multirole@example.com',
    displayName: 'Multi Role User',
    uid: 'multi-role-uid',
    roles: [
      {
        type: 'superAdmin',
        permissions: ['admin:read', 'admin:write', 'roles:create', 'users:manage'],
      },
      {
        type: 'cepAdmin',
        permissions: ['org-units:read', 'devices:manage', 'reports:read'],
      },
    ],
  });