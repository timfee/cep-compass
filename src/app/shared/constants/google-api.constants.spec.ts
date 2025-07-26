import {
  CEP_ADMIN_PRIVILEGES,
  GOOGLE_API_SERVICES,
} from './google-api.constants';

describe('Google API Constants', () => {
  describe('CEP_ADMIN_PRIVILEGES', () => {
    it('should not have duplicate privilege names', () => {
      const privilegeNames = CEP_ADMIN_PRIVILEGES.map((p) => p.privilegeName);
      const uniqueNames = new Set(privilegeNames);

      expect(uniqueNames.size).toBe(privilegeNames.length);
    });

    it('should map DLP-related privileges to DLP_RULES service', () => {
      const dlpManagePrivilege = CEP_ADMIN_PRIVILEGES.find(
        (p) => p.privilegeName === 'MANAGE_GSC_RULE',
      );
      const dlpViewPrivilege = CEP_ADMIN_PRIVILEGES.find(
        (p) => p.privilegeName === 'VIEW_GSC_RULE',
      );

      expect(dlpManagePrivilege?.serviceId).toBe(
        GOOGLE_API_SERVICES.DLP_RULES.id,
      );
      expect(dlpViewPrivilege?.serviceId).toBe(
        GOOGLE_API_SERVICES.DLP_RULES.id,
      );
    });

    it('should have specific APP_ADMIN privilege names', () => {
      const securityAppAdmin = CEP_ADMIN_PRIVILEGES.find(
        (p) =>
          p.privilegeName === 'SECURITY_APP_ADMIN' &&
          p.serviceId === GOOGLE_API_SERVICES.SECURITY_CENTER.id,
      );
      const deviceAppAdmin = CEP_ADMIN_PRIVILEGES.find(
        (p) =>
          p.privilegeName === 'DEVICE_APP_ADMIN' &&
          p.serviceId === GOOGLE_API_SERVICES.DEVICE_MANAGEMENT.id,
      );

      expect(securityAppAdmin).toBeDefined();
      expect(deviceAppAdmin).toBeDefined();
    });

    it('should not have generic APP_ADMIN privileges', () => {
      const genericAppAdmins = CEP_ADMIN_PRIVILEGES.filter(
        (p) => p.privilegeName === 'APP_ADMIN',
      );

      expect(genericAppAdmins.length).toBe(0);
    });
  });
});
