# Welcome Issue Trigger (Forge product event)

Thực hành **event trigger** với `ignoreSelf`, `filter.expression`, handler thêm comment ADF.

## Cấu hình

1. Sửa project key trong **2 chỗ** (phải khớp nhau):
   - `manifest.yml` → `filter.expression`: `event.issue.fields?.project?.key == 'YOUR_KEY'`
   - `src/index.js` → `TARGET_PROJECT_KEY = 'YOUR_KEY'`

2. Đăng ký app (lần đầu):

```bash
cd hieumt_jira_welcome_issue_trigger
npm install
forge register -y
forge deploy --non-interactive -e development
forge install --non-interactive --site hieumt-forge-resource.atlassian.net --product jira --environment development
```

Nếu đổi scopes → `forge install --upgrade ...`

## Test

### 1. Comment sau khi tạo issue (≤ 3 phút)

- Tạo issue mới trong project **HIEUMT** (hoặc key bạn cấu hình).
- Mở issue → tab Activity / Comments → comment **"Chào mừng issue mới!"** + thời gian + reporter.
- Tạo issue **project khác** → **không** có comment.

### 2. Idempotency — bài 6.5 (forge tunnel)

Pattern: `dedupe:comment:{issueKey}` + TTL 24h. SET trước comment; rollback `kvs.delete` nếu `addComment` fail.

```bash
forge tunnel
```

Trong tunnel UI / replay, gửi cùng payload `avi:jira:created:issue` **2 lần** cho một `issueKey`:

- Lần 1: `welcomeIssueTrigger.run.success` → 1 comment
- Lần 2: `welcomeIssueTrigger.run.idempotent_skip` → **không** comment thứ hai

Nếu `addComment` lỗi: log `welcomeIssueTrigger.run.dedup_rollback` → lần invoke sau retry được.

### 3. Logs

```bash
forge logs -e development --since 15m
```

Tìm `"@formatLog": true`.

## Scopes

- `read:jira-work` — đọc reporter (fallback)
- `write:jira-work` — POST comment
- `storage:app` — idempotency KVS

## Câu hỏi tự kiểm tra (bài 6.5)

**Tại sao cần TTL cho dedup key thay vì lưu mãi mãi?**

KVS có giới hạn dung lượng; mỗi issue tạo một key. TTL 24h tự dọn key cũ — đủ chặn duplicate trong cửa sổ at-least-once delivery, không tích lũy vô hạn.

**Điều gì xảy ra nếu SET dedup key thành công nhưng addComment sau đó fail?**

Lần invoke đó không có comment. Không rollback → mọi retry bị skip (false negative). Code xóa key trong `catch` để delivery tiếp theo thử lại.

**Sự khác nhau giữa idempotency và retry logic?**

Idempotency: cùng input nhiều lần → cùng kết quả, không side effect thừa (dedup key). Retry: chủ động gọi lại khi lỗi tạm thời. Kết hợp: dedup chặn trùng, rollback cho phép retry khi chưa hoàn thành.
