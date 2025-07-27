/**
 * Test environment configuration
 */
export const environment = {
  production: false,
  test: true,
  firebase: {
    projectId: 'demo-test-project',
    appId: 'demo-app-id',
    storageBucket: 'demo-test-project.appspot.com',
    apiKey: 'demo-api-key',
    authDomain: 'demo-test-project.firebaseapp.com',
    messagingSenderId: '123456789',
  },
  // Use Firebase Auth emulator for tests
  useEmulators: true,
  emulatorPorts: {
    auth: 9099,
    functions: 5001,
    hosting: 5009
  }
};