const ISSUE_KEY_REGEX = /^[A-Z]+-\d+$/;
const VALID_CATEGORIES = ['dev', 'review', 'meeting', 'ops'];
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const EXPORT_ROW_LIMIT = 500;
const WORK_TYPE_MAX = 64;

const requireAccountId = (req) => {
  const accountId = req?.context?.accountId;
  if (!accountId) throw new Error('Không xác định được accountId.');
  return accountId;
};

const assertSelfOnly = (req) => {
  const accountId = requireAccountId(req);
  const payloadAccountId = req?.payload?.accountId;
  if (payloadAccountId != null && String(payloadAccountId) !== String(accountId)) {
    throw new Error('Không được thao tác thay user khác.');
  }
  return accountId;
};

const validateIssueKey = (raw) => {
  const key = String(raw ?? '').trim();
  if (!key) throw new Error('issueKey là bắt buộc.');
  if (!ISSUE_KEY_REGEX.test(key)) {
    throw new Error(
      `issueKey không hợp lệ: "${key}". Định dạng yêu cầu: [A-Z]+-\\d+ (ví dụ HSF-12).`
    );
  }
  return key;
};

const validateWorkType = (raw) => {
  const name = String(raw ?? '').trim();
  if (!name) throw new Error('work type (Loại) là bắt buộc.');
  if (name.length > WORK_TYPE_MAX) {
    throw new Error(`work type không được vượt quá ${WORK_TYPE_MAX} ký tự.`);
  }
  return name;
};

const validateCategory = (raw) => {
  const cat = String(raw ?? '').trim();
  if (!cat) throw new Error('category không hợp lệ: "".');
  const lower = cat.toLowerCase();
  if (VALID_CATEGORIES.includes(lower)) return lower;
  return validateWorkType(cat);
};

const validateDurationMin = (raw) => {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 480) {
    throw new Error('duration_min phải là số nguyên từ 1 đến 480 (tối đa 8 giờ).');
  }
  return n;
};

const validateLoggedAt = (raw) => {
  const date = String(raw ?? '').trim();
  if (!date) throw new Error('logged_at là bắt buộc.');
  if (!DATE_REGEX.test(date)) {
    throw new Error(`logged_at không hợp lệ: "${date}". Định dạng: YYYY-MM-DD.`);
  }
  return date;
};

const validateNote = (raw) => {
  const note = String(raw ?? '').trim();
  if (note.length > 500) throw new Error('note không được vượt quá 500 ký tự.');
  return note;
};

const validateEntryId = (raw) => {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) throw new Error('id entry không hợp lệ.');
  return id;
};

const validateAccountId = (raw, label = 'accountId') => {
  const id = String(raw ?? '').trim();
  if (!id) throw new Error(`${label} là bắt buộc.`);
  if (id.length > 128) throw new Error(`${label} không hợp lệ.`);
  return id;
};

const VALID_REVIEW_ACTIONS = ['approve', 'reject'];

const validateReviewAction = (raw) => {
  const action = String(raw ?? '').trim().toLowerCase();
  if (!VALID_REVIEW_ACTIONS.includes(action)) {
    throw new Error('action phải là approve hoặc reject.');
  }
  return action;
};

module.exports = {
  ISSUE_KEY_REGEX,
  VALID_CATEGORIES,
  DATE_REGEX,
  EXPORT_ROW_LIMIT,
  WORK_TYPE_MAX,
  requireAccountId,
  assertSelfOnly,
  validateIssueKey,
  validateWorkType,
  validateCategory,
  validateDurationMin,
  validateLoggedAt,
  validateNote,
  validateEntryId,
  validateAccountId,
  validateReviewAction,
  VALID_REVIEW_ACTIONS
};
