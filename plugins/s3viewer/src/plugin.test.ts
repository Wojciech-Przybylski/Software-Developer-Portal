import { s3viewerPlugin } from './plugin';

describe('s3viewer', () => {
  it('should export plugin', () => {
    expect(s3viewerPlugin).toBeDefined();
  });
});
