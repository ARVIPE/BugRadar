// @vitest-environment happy-dom
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { useLatency } from '../src/components/useLatency';

describe('Hook: useLatency', () => {
  // Limpiamos los mocks después de cada test
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debería obtener los registros de latencia y actualizar el estado', async () => {
    // Definimos los datos de prueba siguiendo la interfaz LatencyRecord
    const mockLatencyData = {
      items: [
        { 
          latency_ms: 45, 
          created_at: new Date().toISOString(),
          endpoint: '/api/test',
          method: 'GET',
          status_code: 200
        }
      ]
    };
    
    // Mockeamos fetch para devolver la estructura que espera tu hook (json.items)
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockLatencyData),
    });

    // Renderizamos el hook con los 2 parámetros obligatorios
    const { result } = renderHook(() => useLatency('project_123', 5000));

    // Verificamos el estado inicial de carga
    expect(result.current.loading).toBe(true);

    // Esperamos a que la petición asíncrona termine y actualice el estado
    await waitFor(() => {
      // Comprobamos que loading sea false y data contenga los "items"
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toEqual(mockLatencyData.items);
    });

    // Verificamos que se haya llamado a la URL correcta con el project_id
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('project_id=project_123')
    );
  });

  it('debería dejar de cargar (loading: false) si falla la petición', async () => {
    // Simulamos un error de red
    global.fetch = vi.fn().mockRejectedValue(new Error('Network Error'));

    const { result } = renderHook(() => useLatency('project_123', 5000));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      // Según tu código, si falla mantiene el estado anterior (null en este caso)
      expect(result.current.data).toBeNull();
    });
  });
});