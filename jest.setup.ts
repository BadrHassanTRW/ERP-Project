import '@testing-library/jest-dom';
import fc from 'fast-check';

// Configure fast-check to run 100 iterations minimum for property-based tests
fc.configureGlobal({ numRuns: 100 });
