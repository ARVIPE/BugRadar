import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authConfig } from '../src/auth';

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: vi.fn(),
      admin: {
        getUserById: vi.fn(),
      },
    },
  })),
}));

// Mock NextAuth adapter
vi.mock('@auth/supabase-adapter', () => ({
  SupabaseAdapter: vi.fn(() => ({})),
}));

describe('Auth Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct session strategy', () => {
    expect(authConfig.session.strategy).toBe('jwt');
  });

  it('should have SupabaseAdapter configured', () => {
    expect(authConfig.adapter).toBeDefined();
  });

  it('should have credentials provider', () => {
    expect(authConfig.providers).toHaveLength(1);
    expect(authConfig.providers[0]).toBeDefined();
  });

  it('should have jwt callback defined', () => {
    expect(authConfig.callbacks?.jwt).toBeDefined();
    expect(typeof authConfig.callbacks?.jwt).toBe('function');
  });

  it('should have session callback defined', () => {
    expect(authConfig.callbacks?.session).toBeDefined();
    expect(typeof authConfig.callbacks?.session).toBe('function');
  });

  it('jwt callback should handle user login', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      image: 'https://example.com/avatar.jpg',
      supabaseAccessToken: 'token-123',
    };

    const mockToken = {};

    const result = await authConfig.callbacks!.jwt!({
      token: mockToken,
      user: mockUser as any,
      trigger: 'signIn',
      account: null,
      profile: undefined,
      isNewUser: false,
      session: undefined,
    });

    expect(result.sub).toBe('user-123');
    expect(result.picture).toBe('https://example.com/avatar.jpg');
    expect(result.supabaseAccessToken).toBe('token-123');
  });

  it('jwt callback should return token when no user', async () => {
    const mockToken = { sub: 'user-123' };

    const result = await authConfig.callbacks!.jwt!({
      token: mockToken,
      user: undefined,
      trigger: 'update',
      account: null,
      profile: undefined,
      isNewUser: false,
      session: undefined,
    });

    expect(result.sub).toBe('user-123');
  });

  it('session callback should add user id to session', async () => {
    const mockSession = {
      user: {
        name: 'Test User',
        email: 'test@example.com',
      },
      expires: '2025-12-31',
    };

    const mockToken = {
      sub: 'user-123',
      picture: 'https://example.com/avatar.jpg',
      supabaseAccessToken: 'token-123',
    };

    const result = await authConfig.callbacks!.session!({
      session: mockSession as any,
      token: mockToken,
      user: {} as any,
      newSession: undefined,
      trigger: 'getSession',
    });

    expect(result.user.id).toBe('user-123');
    expect(result.user.image).toBe('https://example.com/avatar.jpg');
    expect(result.supabaseAccessToken).toBe('token-123');
  });

  it('session callback should handle missing picture', async () => {
    const mockSession = {
      user: {
        name: 'Test User',
        email: 'test@example.com',
      },
      expires: '2025-12-31',
    };

    const mockToken = {
      sub: 'user-123',
    };

    const result = await authConfig.callbacks!.session!({
      session: mockSession as any,
      token: mockToken,
      user: {} as any,
      newSession: undefined,
      trigger: 'getSession',
    });

    expect(result.user.id).toBe('user-123');
    expect(result.user.image).toBeUndefined();
  });
});
