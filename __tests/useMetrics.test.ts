// @vitest-environment happy-dom
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { useMetrics } from '../src/components/useMetrics';

describe('Hook: useMetrics', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debería inicializar con datos nulos y realizar fetch', async () => {
    const mockData = { activeErrors: 5, warningsToday: 2, logsLastHour: 10 };
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const { result } = renderHook(() => useMetrics('project_123', 5000));

    expect(result.current.data).toBeNull();

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData);
    });
    
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/metrics?project_id=project_123'),
      expect.anything()
    );
  });
});