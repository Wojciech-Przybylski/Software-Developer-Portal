import { releasesPlugin } from './plugin';

describe('releases', () => {
  it('should export plugin', () => {
    expect(releasesPlugin).toBeDefined();
  });
});
