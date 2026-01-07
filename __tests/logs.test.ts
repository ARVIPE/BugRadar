import { describe, it, expect, vi, beforeEach } from 'vitest';

// Definición de Mocks
vi.mock('@/app/[locale]/settings/actions', () => ({
  getNotifyEmailFor: vi.fn(() => Promise.resolve('test@example.com')),
}));

vi.mock('resend', () => {
  // Usamos una función tradicional para que funcione como constructor (new Resend)
  const ResendMock = function() {
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

// Importación de la función a testear después de los mocks
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
      log_message: "", // Inválido por longitud mínima
      severity: 'invalid-severity' // No está en el enum
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