const request = require('supertest');

// We test the app without requiring Firebase/MongoDB by using a simple
// express app for the health check. Full integration tests against the
// actual server should be run against a staging environment.

describe('Health Check', () => {
  it('should verify test infrastructure works', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have required dependencies installed', () => {
    const pkg = require('../package.json');
    expect(pkg.dependencies).toBeDefined();
    expect(pkg.dependencies.express).toBeDefined();
    expect(pkg.dependencies.mongoose).toBeDefined();
    expect(pkg.dependencies['firebase-admin']).toBeDefined();
    expect(pkg.dependencies['socket.io']).toBeDefined();
  });

  it('should have security dependencies', () => {
    const pkg = require('../package.json');
    expect(pkg.dependencies.helmet).toBeDefined();
    expect(pkg.dependencies.cors).toBeDefined();
    expect(pkg.dependencies['express-rate-limit']).toBeDefined();
    expect(pkg.dependencies['express-mongo-sanitize']).toBeDefined();
  });
});

describe('User Model', () => {
  it('should have correct schema fields', () => {
    const User = require('../models/User');
    const paths = Object.keys(User.schema.paths);
    expect(paths).toContain('username');
    expect(paths).toContain('email');
    expect(paths).toContain('firebaseUID');
    expect(paths).toContain('profileImage');
    expect(paths).toContain('followers');
    expect(paths).toContain('following');
    expect(paths).toContain('blockedUsers');
    expect(paths).toContain('isVerified');
    expect(paths).toContain('isOnline');
  });
});

describe('Post Model', () => {
  it('should have correct schema fields', () => {
    const Post = require('../models/Post');
    const paths = Object.keys(Post.schema.paths);
    expect(paths).toContain('userId');
    expect(paths).toContain('caption');
    expect(paths).toContain('mediaUrl');
    expect(paths).toContain('mediaType');
    expect(paths).toContain('hashtags');
    expect(paths).toContain('likes');
    expect(paths).toContain('commentsCount');
  });
});

describe('Report Model', () => {
  it('should have correct schema fields', () => {
    const Report = require('../models/Report');
    const paths = Object.keys(Report.schema.paths);
    expect(paths).toContain('reporterId');
    expect(paths).toContain('targetType');
    expect(paths).toContain('targetId');
    expect(paths).toContain('reason');
    expect(paths).toContain('status');
    expect(paths).toContain('description');
  });
});

describe('Notification Model', () => {
  it('should have correct schema fields', () => {
    const Notification = require('../models/Notification');
    const paths = Object.keys(Notification.schema.paths);
    expect(paths).toContain('senderId');
    expect(paths).toContain('receiverId');
    expect(paths).toContain('type');
    expect(paths).toContain('isRead');
  });
});