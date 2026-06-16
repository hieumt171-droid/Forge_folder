# Bookmarks — Issue Panel (KVS + Jira API)

Issue panel với 2 tab: bookmark issue hiện tại và danh sách bookmark cá nhân.

## KVS key

`bookmark:{accountId}:{issueKey}`

Query danh sách: `beginsWith("bookmark:{accountId}:")`

## Resolvers

- `getCurrentBookmark` — trạng thái bookmark issue hiện tại (validate `issueKey`)
- `toggleBookmark` — thêm / bỏ bookmark (validate `issueKey`, chỉ user hiện tại)
- `getMyBookmarks` — query KVS theo account, `cursor` optional (string | undefined)
- `listMyBookmarks` — alias không cursor (tương thích cũ)
- `removeBookmark` — xóa bookmark (validate + ownership)

## Validation (bài 7.2)

| Resolver | Rule |
|----------|------|
| `toggleBookmark` | `issueKey` khớp `^[A-Z]+-\d+$` |
| `getMyBookmarks` | `cursor` là `string` hoặc `undefined` |
| Tất cả | `payload.accountId` khác user hiện tại → từ chối |

## Test (forge tunnel)

```bash
forge tunnel
```

Payload invalid — kỳ vọng error message rõ:

- `toggleBookmark` + `{ issueKey: "hsf-1" }` → `issueKey không hợp lệ...`
- `getMyBookmarks` + `{ cursor: 123 }` → `cursor phải là string hoặc undefined...`
- `removeBookmark` + `{ issueKey: "HSF-1", accountId: "user-khac" }` → `Không được thao tác bookmark của user khác.`

## Scopes

- `storage:app`
- `read:jira-work`

## CI (GitHub Actions)

Workflow: `.github/workflows/ci.yml` — install → lint → test → build frontend

```bash
npm run lint
npm run test
npm run build:frontend
```

## CD (GitHub Actions)

Workflow: `.github/workflows/cd.yml`

| Trigger | Hành vi |
|---------|---------|
| Merge/push `main` | Auto deploy **staging** → chờ approve **production** |
| Manual `workflow_dispatch` | Chọn staging hoặc production |

### GitHub Secrets (Settings → Secrets → Actions)

| Secret | Giá trị |
|--------|---------|
| `HIEUMT_GITHUB` | Atlassian API token (scoped) |
| `FORGE_EMAIL` | Email tài khoản Atlassian sở hữu app |

### GitHub Environments (Settings → Environments)

1. **staging** — không bắt buộc reviewer
2. **production** — bật **Required reviewers** (chọn 1+ người)

### Test CD

1. Merge PR vào `main` (có thay đổi `hieumt_issue_panel_bookmark_manager/`)
2. **Actions** → workflow **CD** → job `deploy-staging` chạy xong
3. Job `deploy-production` chờ **Review deployments** → Approve
4. Verify: `forge install list` hoặc mở panel Bookmarks trên Jira

## Deploy thủ công (development)

```bash
npm install
forge deploy -e development
forge install -e development
```

Log: `{ "@formatLog": true, "event": "...", "ts": "..." }`.
