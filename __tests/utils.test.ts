// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { cn } from '../src/lib/utils';

describe('Utility: cn', () => {
  it('debería combinar múltiples nombres de clases en un solo string', () => {
    const result = cn('text-red-500', 'bg-blue-500');
    expect(result).toBe('text-red-500 bg-blue-500');
  });

  it('debería resolver conflictos de Tailwind CSS (prevalecer la última)', () => {
    // p-4 y p-8 entran en conflicto, debe quedar p-8
    const result = cn('p-4', 'p-8');
    expect(result).toBe('p-8');
  });

  it('debería manejar clases condicionales correctamente', () => {
    const isActive = true;
    const isError = false;
    const result = cn('base-class', isActive && 'active', isError && 'error');
    expect(result).toContain('active');
    expect(result).not.toContain('error');
  });
});