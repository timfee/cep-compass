import { test as base } from '@playwright/test';
import {
  LoginPage,
  SelectRolePage,
  DashboardPage,
  AdminPage,
  EmailTemplatesPage,
} from './page-objects';
import { RealAuth } from './helpers/real-auth';

type CEPCompassFixtures = {
  loginPage: LoginPage;
  selectRolePage: SelectRolePage;
  dashboardPage: DashboardPage;
  adminPage: AdminPage;
  emailTemplatesPage: EmailTemplatesPage;
  realAuth: RealAuth;
};

export const test = base.extend<CEPCompassFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  selectRolePage: async ({ page }, use) => {
    await use(new SelectRolePage(page));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  adminPage: async ({ page }, use) => {
    await use(new AdminPage(page));
  },

  emailTemplatesPage: async ({ page }, use) => {
    await use(new EmailTemplatesPage(page));
  },

  realAuth: async ({ page }, use) => {
    await use(new RealAuth(page));
  },
});

export { expect } from '@playwright/test';
