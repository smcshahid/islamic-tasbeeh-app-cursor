// Basic mocks for React Native modules
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
}; 