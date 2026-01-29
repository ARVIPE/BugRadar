import { describe, it, expect } from 'vitest';
import { cn } from '../src/lib/utils';

describe('Utils - cn function', () => {
  it('should merge class names correctly', () => {
    const result = cn('px-4', 'py-2');
    expect(result).toContain('px-4');
    expect(result).toContain('py-2');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const result = cn('base-class', isActive && 'active-class');
    expect(result).toContain('base-class');
    expect(result).toContain('active-class');
  });

  it('should handle false conditional classes', () => {
    const isActive = false;
    const result = cn('base-class', isActive && 'active-class');
    expect(result).toContain('base-class');
    expect(result).not.toContain('active-class');
  });

  it('should merge tailwind classes with conflicts', () => {
    const result = cn('px-2', 'px-4');
    // twMerge should keep only the last px value
    expect(result).toContain('px-4');
    expect(result).not.toContain('px-2');
  });

  it('should handle empty input', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('should handle undefined and null values', () => {
    const result = cn('base', undefined, null, 'other');
    expect(result).toContain('base');
    expect(result).toContain('other');
  });

  it('should handle array of classes', () => {
    const result = cn(['class1', 'class2'], 'class3');
    expect(result).toContain('class1');
    expect(result).toContain('class2');
    expect(result).toContain('class3');
  });

  it('should handle object notation', () => {
    const result = cn({
      'active': true,
      'disabled': false,
      'primary': true,
    });
    expect(result).toContain('active');
    expect(result).toContain('primary');
    expect(result).not.toContain('disabled');
  });

  it('should merge complex tailwind utilities', () => {
    const result = cn(
      'bg-red-500 text-white',
      'bg-blue-500 font-bold'
    );
    // Should keep last bg color
    expect(result).toContain('bg-blue-500');
    expect(result).not.toContain('bg-red-500');
    expect(result).toContain('text-white');
    expect(result).toContain('font-bold');
  });

  it('should handle responsive classes', () => {
    const result = cn('px-4', 'md:px-8', 'lg:px-12');
    expect(result).toContain('px-4');
    expect(result).toContain('md:px-8');
    expect(result).toContain('lg:px-12');
  });

  it('should handle hover and state variants', () => {
    const result = cn('text-gray-500', 'hover:text-blue-500', 'focus:ring-2');
    expect(result).toContain('text-gray-500');
    expect(result).toContain('hover:text-blue-500');
    expect(result).toContain('focus:ring-2');
  });

  it('should handle dark mode classes', () => {
    const result = cn('bg-white', 'dark:bg-gray-900');
    expect(result).toContain('bg-white');
    expect(result).toContain('dark:bg-gray-900');
  });
});
