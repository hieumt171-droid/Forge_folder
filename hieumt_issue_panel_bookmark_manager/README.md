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


```bash
npm install
forge deploy -e development
forge install -e development
```

Log: `{ "@formatLog": true, "event": "...", "ts": "..." }`.
