export const ISSUE_KEY_REGEX = /^[A-Z]+-\d+$/;
/** @deprecated dùng work type từ Jira; giữ để tương thích test cũ */
export const VALID_CATEGORIES = ['dev', 'review', 'meeting', 'ops'];
export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
export const EXPORT_ROW_LIMIT = 500;
export const WORK_TYPE_MAX = 64;

export const requireAccountId = (req) => {
  const accountId = req?.context?.accountId;
  if (!accountId) throw new Error('Không xác định được accountId.');
  return accountId;
};

/**
 * User chỉ thao tác với chính mình.
 * Không tin payload.accountId — chặn giả mạo.
 */
export const assertSelfOnly = (req) => {
  const accountId = requireAccountId(req);
  const payloadAccountId = req?.payload?.accountId;
  if (payloadAccountId != null && String(payloadAccountId) !== String(accountId)) {
    throw new Error('Không được thao tác thay user khác.');
  }
  return accountId;
};

export const validateIssueKey = (raw) => {
  const key = String(raw ?? '').trim();
  if (!key) throw new Error('issueKey là bắt buộc.');
  if (!ISSUE_KEY_REGEX.test(key)) {
    throw new Error(
      `issueKey không hợp lệ: "${key}". Định dạng yêu cầu: [A-Z]+-\\d+ (ví dụ HSF-12).`
    );
  }
  return key;
};

/** Work type = Jira issue type name (Bug, Task, Story, …) */
export const validateWorkType = (raw) => {
  const name = String(raw ?? '').trim();
  if (!name) throw new Error('work type (Loại) là bắt buộc.');
  if (name.length > WORK_TYPE_MAX) {
    throw new Error(`work type không được vượt quá ${WORK_TYPE_MAX} ký tự.`);
  }
  return name;
};

/** Giữ alias — ưu tiên work type tự do; enum cũ vẫn pass */
export const validateCategory = (raw) => {
  const cat = String(raw ?? '').trim();
  if (!cat) throw new Error('category không hợp lệ: "".');
  const lower = cat.toLowerCase();
  if (VALID_CATEGORIES.includes(lower)) return lower;
  return validateWorkType(cat);
};

export const validateDurationMin = (raw) => {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 480) {
    throw new Error('duration_min phải là số nguyên từ 1 đến 480 (tối đa 8 giờ).');
  }
  return n;
};

export const validateLoggedAt = (raw) => {
  const date = String(raw ?? '').trim();
  if (!date) throw new Error('logged_at là bắt buộc.');
  if (!DATE_REGEX.test(date)) {
    throw new Error(`logged_at không hợp lệ: "${date}". Định dạng: YYYY-MM-DD.`);
  }
  return date;
};

export const validateNote = (raw) => {
  const note = String(raw ?? '').trim();
  if (note.length > 500) throw new Error('note không được vượt quá 500 ký tự.');
  return note;
};

export const validateEntryId = (raw) => {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) throw new Error('id entry không hợp lệ.');
  return id;
};
