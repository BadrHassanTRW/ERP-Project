import fc from 'fast-check';

describe('Test Setup Verification', () => {
  it('should run a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have fast-check configured', () => {
    fc.assert(
      fc.property(fc.integer(), (n) => {
        return n + 0 === n;
      })
    );
  });
});
