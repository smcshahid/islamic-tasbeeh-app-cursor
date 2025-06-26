describe('Simple Test', () => {
  it('should run basic JavaScript', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle arrays', () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr[0]).toBe(1);
  });

  it('should handle async operations', async () => {
    const promise = Promise.resolve('hello');
    const result = await promise;
    expect(result).toBe('hello');
  });
}); 