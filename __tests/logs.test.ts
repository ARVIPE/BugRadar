import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock definitions
vi.mock('@/app/[locale]/settings/actions', () => ({
  getNotifyEmailFor: vi.fn(() => Promise.resolve('test@example.com')),
}));

vi.mock('resend', () => {
  // Use a traditional function so it works as a constructor (new Resend)
  const ResendMock = function(this: { emails: { send: ReturnType<typeof vi.fn> } }) {
    this.emails = {
      send: vi.fn().mockResolvedValue({ data: { id: '123' }, error: null })
    };
  };
  return { Resend: ResendMock };
});

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ 
      data: { project_id: '123', user_id: 'user_456' }, 
      error: null 
    }),
    insert: vi.fn().mockReturnThis(),
    auth: {
      admin: {
        getUserById: vi.fn().mockResolvedValue({ 
          data: { user: { email: 'arvicper@gmail.com' } }, 
          error: null 
        })
      }
    }
  })),
}));

// Import the function to test after the mocks
import { POST } from '../src/app/api/logs/route';

describe('POST /api/logs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería retornar 401 si falta el header de Authorization', async () => {
    const request = new Request('http://localhost/api/logs', { 
      method: 'POST' 
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('debería validar errores de esquema con Zod (400 Bad Request)', async () => {
    const logInvalido = { 
      log_message: "", 
      severity: 'invalid-severity' 
    };
    
    const request = new Request('http://localhost/api/logs', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer proj_key' },
      body: JSON.stringify(logInvalido)
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('debería procesar correctamente un log válido (201 Created)', async () => {
    const logValido = {
      log_message: "Error de conexión en base de datos",
      container_name: "postgres-db",
      severity: "error"
    };

    const request = new Request('http://localhost/api/logs', {
      method: 'POST',
      headers: { 
        'Authorization': 'Bearer proj_valid_key',
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(logValido)
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.ok).toBe(true);
    expect(body.event).toBeDefined();
  });
});