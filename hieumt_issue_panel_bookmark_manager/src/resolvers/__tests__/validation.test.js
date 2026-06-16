import {
  assertBookmarkOwnership,
  assertSelfOnly,
  buildBookmarkKey,
  validateIssueKey,
  validateOptionalCursor
} from '../validation.js';

describe('validateIssueKey', () => {
  test('chấp nhận issue key hợp lệ', () => {
    expect(validateIssueKey('HSF-6')).toBe('HSF-6');
    expect(validateIssueKey('  PROJ-123  ')).toBe('PROJ-123');
  });

  test('từ chối issue key rỗng', () => {
    expect(() => validateIssueKey('')).toThrow('issueKey là bắt buộc.');
    expect(() => validateIssueKey(null)).toThrow('issueKey là bắt buộc.');
  });

  test('từ chối issue key sai format', () => {
    expect(() => validateIssueKey('hsf-1')).toThrow('issueKey không hợp lệ');
    expect(() => validateIssueKey('HSF')).toThrow('issueKey không hợp lệ');
    expect(() => validateIssueKey('bad key')).toThrow('issueKey không hợp lệ');
  });
});

describe('validateOptionalCursor', () => {
  test('chấp nhận undefined, null, chuỗi rỗng', () => {
    expect(validateOptionalCursor(undefined)).toBeUndefined();
    expect(validateOptionalCursor(null)).toBeUndefined();
    expect(validateOptionalCursor('')).toBeUndefined();
  });

  test('chấp nhận string hợp lệ', () => {
    expect(validateOptionalCursor('eyJrZXkifQ==')).toBe('eyJrZXkifQ==');
  });

  test('từ chối cursor không phải string', () => {
    expect(() => validateOptionalCursor(123)).toThrow(
      'cursor phải là string hoặc undefined, nhận được: number.'
    );
    expect(() => validateOptionalCursor({})).toThrow(
      'cursor phải là string hoặc undefined, nhận được: object.'
    );
  });
});

describe('assertSelfOnly', () => {
  const baseReq = { context: { accountId: 'user-abc' }, payload: {} };

  test('trả accountId khi không có payload.accountId', () => {
    expect(assertSelfOnly(baseReq)).toBe('user-abc');
  });

  test('từ chối payload.accountId khác user hiện tại', () => {
    const req = {
      ...baseReq,
      payload: { accountId: 'other-user' }
    };
    expect(() => assertSelfOnly(req)).toThrow('Không được thao tác bookmark của user khác.');
  });
});

describe('assertBookmarkOwnership', () => {
  test('cho phép bookmark không có accountId hoặc cùng owner', () => {
    expect(() => assertBookmarkOwnership({ summary: 'x' }, 'user-1')).not.toThrow();
    expect(() =>
      assertBookmarkOwnership({ accountId: 'user-1' }, 'user-1')
    ).not.toThrow();
  });

  test('từ chối bookmark thuộc user khác', () => {
    expect(() =>
      assertBookmarkOwnership({ accountId: 'other' }, 'user-1')
    ).toThrow('Không được thao tác bookmark của user khác.');
  });
});

describe('buildBookmarkKey', () => {
  test('tạo key theo accountId và issueKey', () => {
    expect(buildBookmarkKey('user-1', 'HSF-6')).toBe('bookmark:user-1:HSF-6');
  });
});

