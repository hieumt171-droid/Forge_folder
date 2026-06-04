# Bookmarks — Issue Panel (KVS + Jira API)

Issue panel với 2 tab: bookmark issue hiện tại và danh sách bookmark cá nhân.

## KVS key

`bookmark:{accountId}:{issueKey}`

Query danh sách: `beginsWith("bookmark:{accountId}:")`

## Resolvers

- `getCurrentBookmark` — trạng thái bookmark issue hiện tại
- `toggleBookmark` — thêm (Jira summary/status) / bỏ bookmark
- `listMyBookmarks` — query KVS theo account
- `removeBookmark` — xóa một bookmark

## Scopes

- `storage:app`
- `read:jira-work`

## Deploy

```bash
npm install
forge deploy -e development
forge install -e development
```

Log: `{ "@formatLog": true, "event": "...", "ts": "..." }`.
