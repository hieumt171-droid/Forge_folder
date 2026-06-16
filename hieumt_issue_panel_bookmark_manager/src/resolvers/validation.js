export const ISSUE_KEY_REGEX = /^[A-Z]+-\d+$/;

export const requireAccountId = (req) => {
  const accountId = req?.context?.accountId;
  if (!accountId) {
    throw new Error('Không xác định được accountId.');
  }
  return accountId;
};

export const assertSelfOnly = (req) => {
  const accountId = requireAccountId(req);
  const payloadAccountId = req?.payload?.accountId;

  if (
    payloadAccountId !== undefined &&
    payloadAccountId !== null &&
    String(payloadAccountId).trim() !== accountId
  ) {
    throw new Error('Không được thao tác bookmark của user khác.');
  }

  return accountId;
};

export const validateIssueKey = (rawIssueKey) => {
  const issueKey = String(rawIssueKey ?? '').trim();

  if (!issueKey) {
    throw new Error('issueKey là bắt buộc.');
  }

  if (!ISSUE_KEY_REGEX.test(issueKey)) {
    throw new Error(
      `issueKey không hợp lệ: "${issueKey}". Định dạng yêu cầu: [A-Z]+-\\d+ (ví dụ HSF-6).`
    );
  }

  return issueKey;
};

export const validateOptionalCursor = (rawCursor) => {
  if (rawCursor === undefined || rawCursor === null || rawCursor === '') {
    return undefined;
  }

  if (typeof rawCursor !== 'string') {
    throw new Error(
      `cursor phải là string hoặc undefined, nhận được: ${typeof rawCursor}.`
    );
  }

  return rawCursor;
};

export const assertBookmarkOwnership = (bookmark, accountId) => {
  if (bookmark?.accountId && bookmark.accountId !== accountId) {
    throw new Error('Không được thao tác bookmark của user khác.');
  }
};

export const buildBookmarkPrefix = (accountId) => `bookmark:${accountId}:`;

export const buildBookmarkKey = (accountId, issueKey) =>
  `${buildBookmarkPrefix(accountId)}${issueKey}`;
