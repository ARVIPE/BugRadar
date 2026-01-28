import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { useLatency } from '../src/components/useLatency';

describe('Hook: useLatency', () => {
  // Clean up mocks after each test
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debería obtener los registros de latencia y actualizar el estado', async () => {
    // Define test data following the LatencyRecord interface
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
    
    // Mock fetch to return the structure expected by the hook (json.items)
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockLatencyData),
    });

    // Render the hook with the 2 required parameters
    const { result } = renderHook(() => useLatency('project_123', 5000));

    // Verify initial loading state
    expect(result.current.loading).toBe(true);

    // Wait for the async request to finish and update state
    await waitFor(() => {
      // Check that loading is false and data contains the "items"
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toEqual(mockLatencyData.items);
    });

    // Verify that the correct URL was called with the project_id
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('project_id=project_123')
    );
  });

  it('debería dejar de cargar (loading: false) si falla la petición', async () => {
    // Simulate a network error
    global.fetch = vi.fn().mockRejectedValue(new Error('Network Error'));

    const { result } = renderHook(() => useLatency('project_123', 5000));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      // If it fails, it maintains the previous state
      expect(result.current.data).toBeNull();
    });
  });
});