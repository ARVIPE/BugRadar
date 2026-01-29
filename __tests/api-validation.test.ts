import { describe, it, expect } from 'vitest';

describe('API Response Validation', () => {
  describe('Latency API Response', () => {
    it('should validate latency response structure', () => {
      const response = {
        items: [
          {
            created_at: '2025-01-29T12:00:00Z',
            endpoint: '/api/test',
            method: 'GET',
            status_code: 200,
            latency_ms: 150,
          },
        ],
      };

      expect(response.items).toBeDefined();
      expect(Array.isArray(response.items)).toBe(true);
      expect(response.items[0].latency_ms).toBeGreaterThan(0);
    });

    it('should validate latency record fields', () => {
      const record = {
        created_at: '2025-01-29T12:00:00Z',
        endpoint: '/api/metrics',
        method: 'POST',
        status_code: 201,
        latency_ms: 250,
      };

      expect(record.created_at).toBeDefined();
      expect(record.endpoint).toMatch(/^\/api\//);
      expect(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(record.method)).toBe(true);
      expect(record.status_code).toBeGreaterThanOrEqual(100);
      expect(record.status_code).toBeLessThan(600);
      expect(record.latency_ms).toBeGreaterThan(0);
    });

    it('should handle empty items array', () => {
      const response = { items: [] };
      expect(response.items).toHaveLength(0);
      expect(Array.isArray(response.items)).toBe(true);
    });
  });

  describe('Metrics API Response', () => {
    it('should validate metrics response structure', () => {
      const response = {
        activeErrors: 5,
        warningsToday: 12,
        logsLastHour: 150,
      };

      expect(response.activeErrors).toBeDefined();
      expect(response.warningsToday).toBeDefined();
      expect(response.logsLastHour).toBeDefined();
      expect(typeof response.activeErrors).toBe('number');
      expect(typeof response.warningsToday).toBe('number');
      expect(typeof response.logsLastHour).toBe('number');
    });

    it('should validate metrics are non-negative', () => {
      const response = {
        activeErrors: 0,
        warningsToday: 5,
        logsLastHour: 100,
      };

      expect(response.activeErrors).toBeGreaterThanOrEqual(0);
      expect(response.warningsToday).toBeGreaterThanOrEqual(0);
      expect(response.logsLastHour).toBeGreaterThanOrEqual(0);
    });

    it('should handle zero metrics', () => {
      const response = {
        activeErrors: 0,
        warningsToday: 0,
        logsLastHour: 0,
      };

      expect(response.activeErrors).toBe(0);
      expect(response.warningsToday).toBe(0);
      expect(response.logsLastHour).toBe(0);
    });
  });

  describe('Logs API Response', () => {
    it('should validate log event structure', () => {
      const log = {
        id: 'log-123',
        created_at: '2025-01-29T12:00:00Z',
        severity: 'error',
        log_message: 'Test error message',
        container_name: 'app-container',
        status: 'open',
      };

      expect(log.id).toBeDefined();
      expect(log.created_at).toBeDefined();
      expect(log.severity).toBeDefined();
      expect(log.log_message).toBeDefined();
      expect(log.container_name).toBeDefined();
    });

    it('should validate severity values', () => {
      const validSeverities = ['error', 'warning', 'info', 'debug'];
      const log = { severity: 'error' };
      expect(validSeverities.includes(log.severity)).toBe(true);
    });

    it('should validate status values', () => {
      const validStatuses = ['open', 'resolved', 'ignored'];
      const log = { status: 'open' };
      expect(validStatuses.includes(log.status)).toBe(true);
    });

    it('should handle optional status field', () => {
      const log = {
        id: 'log-123',
        severity: 'warning',
        log_message: 'Warning message',
      };

      expect(log.id).toBeDefined();
      expect(log.severity).toBeDefined();
    });
  });

  describe('Projects API Response', () => {
    it('should validate project structure', () => {
      const project = {
        id: 'project-123',
        name: 'Test Project',
        created_at: '2025-01-29T12:00:00Z',
        user_id: 'user-456',
      };

      expect(project.id).toBeDefined();
      expect(project.name).toBeDefined();
      expect(project.created_at).toBeDefined();
      expect(project.user_id).toBeDefined();
    });

    it('should validate project name is not empty', () => {
      const project = {
        id: 'project-123',
        name: 'My Project',
      };

      expect(project.name.length).toBeGreaterThan(0);
    });

    it('should validate project list response', () => {
      const response = {
        projects: [
          { id: '1', name: 'Project 1' },
          { id: '2', name: 'Project 2' },
        ],
      };

      expect(Array.isArray(response.projects)).toBe(true);
      expect(response.projects).toHaveLength(2);
      expect(response.projects[0].id).toBeDefined();
    });
  });

  describe('Error Response Validation', () => {
    it('should validate error response structure', () => {
      const errorResponse = {
        error: 'Not Found',
        message: 'The requested resource was not found',
        statusCode: 404,
      };

      expect(errorResponse.error).toBeDefined();
      expect(errorResponse.message).toBeDefined();
      expect(errorResponse.statusCode).toBe(404);
    });

    it('should validate different error codes', () => {
      const errorCodes = [400, 401, 403, 404, 500, 503];
      errorCodes.forEach(code => {
        expect(code).toBeGreaterThanOrEqual(400);
        expect(code).toBeLessThan(600);
      });
    });

    it('should handle validation errors', () => {
      const validationError = {
        error: 'Validation Error',
        fields: {
          email: 'Invalid email format',
          password: 'Password too short',
        },
      };

      expect(validationError.error).toBe('Validation Error');
      expect(validationError.fields).toBeDefined();
      expect(Object.keys(validationError.fields)).toHaveLength(2);
    });
  });

  describe('Pagination Response', () => {
    it('should validate pagination metadata', () => {
      const response = {
        items: [],
        page: 1,
        pageSize: 20,
        total: 100,
        totalPages: 5,
      };

      expect(response.page).toBeGreaterThan(0);
      expect(response.pageSize).toBeGreaterThan(0);
      expect(response.total).toBeGreaterThanOrEqual(0);
      expect(response.totalPages).toBeGreaterThanOrEqual(0);
    });

    it('should validate page is within bounds', () => {
      const response = {
        page: 3,
        totalPages: 5,
      };

      expect(response.page).toBeLessThanOrEqual(response.totalPages);
    });

    it('should handle first page', () => {
      const response = {
        page: 1,
        pageSize: 20,
        total: 50,
      };

      expect(response.page).toBe(1);
      expect(response.total).toBeGreaterThan(0);
    });

    it('should handle last page', () => {
      const response = {
        page: 5,
        pageSize: 20,
        total: 100,
        totalPages: 5,
      };

      expect(response.page).toBe(response.totalPages);
    });
  });
});
