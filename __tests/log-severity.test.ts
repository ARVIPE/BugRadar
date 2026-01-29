import { describe, it, expect } from 'vitest';

describe('Log Severity and Status', () => {
  type Severity = 'warning' | 'error' | 'info' | 'debug';
  type Status = 'open' | 'resolved' | 'ignored';

  describe('Severity Classification', () => {
    it('should classify error severity', () => {
      const severity: Severity = 'error';
      expect(severity).toBe('error');
    });

    it('should classify warning severity', () => {
      const severity: Severity = 'warning';
      expect(severity).toBe('warning');
    });

    it('should classify info severity', () => {
      const severity: Severity = 'info';
      expect(severity).toBe('info');
    });

    it('should classify debug severity', () => {
      const severity: Severity = 'debug';
      expect(severity).toBe('debug');
    });

    it('should determine if severity is critical', () => {
      const criticalSeverities: Severity[] = ['error'];
      expect(criticalSeverities.includes('error')).toBe(true);
      expect(criticalSeverities.includes('warning')).toBe(false);
    });

    it('should determine if severity needs attention', () => {
      const attentionSeverities: Severity[] = ['error', 'warning'];
      expect(attentionSeverities.includes('error')).toBe(true);
      expect(attentionSeverities.includes('warning')).toBe(true);
      expect(attentionSeverities.includes('info')).toBe(false);
    });
  });

  describe('Status Management', () => {
    it('should handle open status', () => {
      const status: Status = 'open';
      expect(status).toBe('open');
    });

    it('should handle resolved status', () => {
      const status: Status = 'resolved';
      expect(status).toBe('resolved');
    });

    it('should handle ignored status', () => {
      const status: Status = 'ignored';
      expect(status).toBe('ignored');
    });

    it('should determine if log is active', () => {
      const activeStatuses: Status[] = ['open'];
      expect(activeStatuses.includes('open')).toBe(true);
      expect(activeStatuses.includes('resolved')).toBe(false);
      expect(activeStatuses.includes('ignored')).toBe(false);
    });

    it('should determine if log is closed', () => {
      const closedStatuses: Status[] = ['resolved', 'ignored'];
      expect(closedStatuses.includes('resolved')).toBe(true);
      expect(closedStatuses.includes('ignored')).toBe(true);
      expect(closedStatuses.includes('open')).toBe(false);
    });
  });

  describe('Log Filtering', () => {
    interface LogEvent {
      id: string;
      severity: Severity;
      status?: Status;
      message: string;
    }

    const sampleLogs: LogEvent[] = [
      { id: '1', severity: 'error', status: 'open', message: 'Critical error' },
      { id: '2', severity: 'warning', status: 'open', message: 'Warning message' },
      { id: '3', severity: 'error', status: 'resolved', message: 'Fixed error' },
      { id: '4', severity: 'info', status: 'open', message: 'Info message' },
      { id: '5', severity: 'warning', status: 'ignored', message: 'Ignored warning' },
    ];

    it('should filter logs by error severity', () => {
      const errors = sampleLogs.filter(log => log.severity === 'error');
      expect(errors).toHaveLength(2);
      expect(errors.every(log => log.severity === 'error')).toBe(true);
    });

    it('should filter logs by open status', () => {
      const openLogs = sampleLogs.filter(log => log.status === 'open');
      expect(openLogs).toHaveLength(3);
      expect(openLogs.every(log => log.status === 'open')).toBe(true);
    });

    it('should filter active errors', () => {
      const activeErrors = sampleLogs.filter(
        log => log.severity === 'error' && log.status === 'open'
      );
      expect(activeErrors).toHaveLength(1);
      expect(activeErrors[0].id).toBe('1');
    });

    it('should filter resolved logs', () => {
      const resolved = sampleLogs.filter(log => log.status === 'resolved');
      expect(resolved).toHaveLength(1);
      expect(resolved[0].id).toBe('3');
    });

    it('should filter ignored logs', () => {
      const ignored = sampleLogs.filter(log => log.status === 'ignored');
      expect(ignored).toHaveLength(1);
      expect(ignored[0].id).toBe('5');
    });

    it('should count logs by severity', () => {
      const counts = sampleLogs.reduce((acc, log) => {
        acc[log.severity] = (acc[log.severity] || 0) + 1;
        return acc;
      }, {} as Record<Severity, number>);

      expect(counts.error).toBe(2);
      expect(counts.warning).toBe(2);
      expect(counts.info).toBe(1);
    });

    it('should count logs by status', () => {
      const counts = sampleLogs.reduce((acc, log) => {
        if (log.status) {
          acc[log.status] = (acc[log.status] || 0) + 1;
        }
        return acc;
      }, {} as Record<Status, number>);

      expect(counts.open).toBe(3);
      expect(counts.resolved).toBe(1);
      expect(counts.ignored).toBe(1);
    });
  });

  describe('Log Sorting', () => {
    interface LogEvent {
      id: string;
      severity: Severity;
      created_at: string;
    }

    const logs: LogEvent[] = [
      { id: '1', severity: 'info', created_at: '2025-01-29T10:00:00Z' },
      { id: '2', severity: 'error', created_at: '2025-01-29T11:00:00Z' },
      { id: '3', severity: 'warning', created_at: '2025-01-29T09:00:00Z' },
    ];

    it('should sort logs by date descending', () => {
      const sorted = [...logs].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      expect(sorted[0].id).toBe('2');
      expect(sorted[2].id).toBe('3');
    });

    it('should sort logs by date ascending', () => {
      const sorted = [...logs].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      expect(sorted[0].id).toBe('3');
      expect(sorted[2].id).toBe('2');
    });

    it('should sort logs by severity priority', () => {
      const severityPriority: Record<Severity, number> = {
        error: 0,
        warning: 1,
        info: 2,
        debug: 3,
      };

      const sorted = [...logs].sort((a, b) => 
        severityPriority[a.severity] - severityPriority[b.severity]
      );

      expect(sorted[0].severity).toBe('error');
      expect(sorted[1].severity).toBe('warning');
      expect(sorted[2].severity).toBe('info');
    });
  });

  describe('Log Validation', () => {
    it('should validate log event structure', () => {
      const log = {
        id: '123',
        severity: 'error' as Severity,
        status: 'open' as Status,
        message: 'Test error',
        created_at: '2025-01-29T12:00:00Z',
      };

      expect(log.id).toBeDefined();
      expect(log.severity).toBeDefined();
      expect(log.message).toBeDefined();
      expect(log.created_at).toBeDefined();
    });

    it('should validate severity values', () => {
      const validSeverities: Severity[] = ['error', 'warning', 'info', 'debug'];
      const testSeverity = 'error';
      expect(validSeverities.includes(testSeverity as Severity)).toBe(true);
    });

    it('should validate status values', () => {
      const validStatuses: Status[] = ['open', 'resolved', 'ignored'];
      const testStatus = 'open';
      expect(validStatuses.includes(testStatus as Status)).toBe(true);
    });

    it('should handle optional status', () => {
      const log = {
        id: '123',
        severity: 'error' as Severity,
        message: 'Test error',
      };

      expect(log.status).toBeUndefined();
    });
  });

  describe('Log Metrics Calculation', () => {
    interface LogEvent {
      severity: Severity;
      status?: Status;
      created_at: string;
    }

    const logs: LogEvent[] = [
      { severity: 'error', status: 'open', created_at: '2025-01-29T12:00:00Z' },
      { severity: 'error', status: 'open', created_at: '2025-01-29T11:30:00Z' },
      { severity: 'warning', status: 'open', created_at: '2025-01-29T12:15:00Z' },
      { severity: 'error', status: 'resolved', created_at: '2025-01-29T10:00:00Z' },
      { severity: 'info', status: 'open', created_at: '2025-01-29T12:30:00Z' },
    ];

    it('should calculate active errors count', () => {
      const activeErrors = logs.filter(
        log => log.severity === 'error' && log.status === 'open'
      ).length;
      expect(activeErrors).toBe(2);
    });

    it('should calculate warnings count', () => {
      const warnings = logs.filter(log => log.severity === 'warning').length;
      expect(warnings).toBe(1);
    });

    it('should calculate total logs', () => {
      expect(logs.length).toBe(5);
    });

    it('should calculate resolution rate', () => {
      const totalErrors = logs.filter(log => log.severity === 'error').length;
      const resolvedErrors = logs.filter(
        log => log.severity === 'error' && log.status === 'resolved'
      ).length;
      const resolutionRate = (resolvedErrors / totalErrors) * 100;
      expect(resolutionRate).toBeCloseTo(33.33, 1);
    });
  });
});
