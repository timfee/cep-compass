export interface TestUser {
  email: string;
  displayName: string;
  uid: string;
  roles: UserRole[];
}

export interface UserRole {
  type: 'superAdmin' | 'cepAdmin' | 'participant';
  permissions: string[];
}

export interface MockAuthState {
  isAuthenticated: boolean;
  user: TestUser | null;
  selectedRole: UserRole | null;
  accessToken: string | null;
}

export interface TestConfig {
  baseURL: string;
  timeout: number;
  retries: number;
}
