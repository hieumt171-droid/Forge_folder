import {
  validateIssueKey,
  validateCategory,
  validateWorkType,
  validateDurationMin,
  validateLoggedAt,
  validateNote,
  validateEntryId,
  requireAccountId,
  assertSelfOnly,
  EXPORT_ROW_LIMIT
} from '../validation.js';

describe('validateIssueKey', () => {
  test('chấp nhận key hợp lệ', () => {
    expect(validateIssueKey('HSF-12')).toBe('HSF-12');
    expect(validateIssueKey('  PROJ-1  ')).toBe('PROJ-1');
  });
  test('từ chối rỗng', () => {
    expect(() => validateIssueKey('')).toThrow('issueKey là bắt buộc.');
    expect(() => validateIssueKey(null)).toThrow('issueKey là bắt buộc.');
  });
  test('từ chối sai format', () => {
    expect(() => validateIssueKey('hsf-12')).toThrow('issueKey không hợp lệ');
    expect(() => validateIssueKey('HSF')).toThrow('issueKey không hợp lệ');
    expect(() => validateIssueKey('12-HSF')).toThrow('issueKey không hợp lệ');
  });
});

describe('validateCategory / validateWorkType', () => {
  test('chấp nhận enum cũ', () => {
    expect(validateCategory('dev')).toBe('dev');
    expect(validateCategory('REVIEW')).toBe('review');
  });
  test('chấp nhận Jira work type', () => {
    expect(validateCategory('Task')).toBe('Task');
    expect(validateCategory('Bug')).toBe('Bug');
    expect(validateWorkType('Story')).toBe('Story');
  });
  test('từ chối rỗng / quá dài', () => {
    expect(() => validateCategory('')).toThrow();
    expect(() => validateWorkType('')).toThrow('work type');
    expect(() => validateWorkType('x'.repeat(65))).toThrow('64');
  });
});

describe('validateDurationMin', () => {
  test('chấp nhận giá trị hợp lệ', () => {
    expect(validateDurationMin(1)).toBe(1);
    expect(validateDurationMin(90)).toBe(90);
    expect(validateDurationMin(480)).toBe(480);
    expect(validateDurationMin('60')).toBe(60);
  });
  test('từ chối giá trị ngoài khoảng', () => {
    expect(() => validateDurationMin(0)).toThrow('duration_min');
    expect(() => validateDurationMin(481)).toThrow('duration_min');
    expect(() => validateDurationMin(-1)).toThrow('duration_min');
    expect(() => validateDurationMin(1.5)).toThrow('duration_min');
  });
});

describe('validateLoggedAt', () => {
  test('chấp nhận date hợp lệ', () => {
    expect(validateLoggedAt('2025-01-13')).toBe('2025-01-13');
    expect(validateLoggedAt('2024-12-31')).toBe('2024-12-31');
  });
  test('từ chối rỗng', () => {
    expect(() => validateLoggedAt('')).toThrow('logged_at là bắt buộc.');
    expect(() => validateLoggedAt(null)).toThrow('logged_at là bắt buộc.');
  });
  test('từ chối sai format', () => {
    expect(() => validateLoggedAt('13/01/2025')).toThrow('logged_at không hợp lệ');
    expect(() => validateLoggedAt('2025/01/13')).toThrow('logged_at không hợp lệ');
    expect(() => validateLoggedAt('not-a-date')).toThrow('logged_at không hợp lệ');
  });
});

describe('validateNote', () => {
  test('chấp nhận note ngắn', () => {
    expect(validateNote('Working on feature')).toBe('Working on feature');
    expect(validateNote('')).toBe('');
    expect(validateNote(null)).toBe('');
  });
  test('từ chối note quá dài', () => {
    expect(() => validateNote('x'.repeat(501))).toThrow('500 ký tự');
  });
});

describe('validateEntryId', () => {
  test('chấp nhận id hợp lệ', () => {
    expect(validateEntryId(1)).toBe(1);
    expect(validateEntryId('42')).toBe(42);
  });
  test('từ chối id không hợp lệ', () => {
    expect(() => validateEntryId(0)).toThrow('id entry không hợp lệ');
    expect(() => validateEntryId(-1)).toThrow('id entry không hợp lệ');
    expect(() => validateEntryId('abc')).toThrow('id entry không hợp lệ');
  });
});

describe('requireAccountId', () => {
  test('trả accountId khi có', () => {
    expect(requireAccountId({ context: { accountId: 'user-123' } })).toBe('user-123');
  });
  test('throw khi không có', () => {
    expect(() => requireAccountId({})).toThrow('Không xác định được accountId.');
    expect(() => requireAccountId({ context: {} })).toThrow('Không xác định được accountId.');
  });
});

describe('assertSelfOnly', () => {
  test('cho phép khi không có payload.accountId', () => {
    expect(
      assertSelfOnly({ context: { accountId: 'user-1' }, payload: { issueKey: 'HSF-1' } })
    ).toBe('user-1');
  });
  test('cho phép khi payload.accountId khớp context', () => {
    expect(
      assertSelfOnly({
        context: { accountId: 'user-1' },
        payload: { accountId: 'user-1' }
      })
    ).toBe('user-1');
  });
  test('từ chối khi payload.accountId khác user hiện tại', () => {
    expect(() =>
      assertSelfOnly({
        context: { accountId: 'user-1' },
        payload: { accountId: 'hacker-2' }
      })
    ).toThrow('Không được thao tác thay user khác.');
  });
});

describe('EXPORT_ROW_LIMIT', () => {
  test('giới hạn export = 500', () => {
    expect(EXPORT_ROW_LIMIT).toBe(500);
  });
});
