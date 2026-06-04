# Space Health Report (Confluence Space Page)

Forge UI Kit app thực hành `requestConfluence()` trên **confluence:spacePage**.

## Tính năng

- Tổng số pages trong space (`GET /wiki/api/v2/spaces/{id}/pages`)
- 5 pages tạo gần nhất (sắp theo `createdAt`)
- Top labels trong space qua CQL `space = "KEY" AND type = page`
- Gắn label `review-needed` cho page được chọn (`POST /wiki/rest/api/content/{id}/label`)

## Scopes

- `read:page:confluence`
- `read:space:confluence`
- `read:label:confluence`
- `search:confluence` (bắt buộc cho CQL `/wiki/rest/api/content/search`)
- `write:label:confluence` (bắt buộc cho `addLabel`)

## Chạy

```bash
forge deploy -e development
forge install -e development
```

Mở space → **Space Health Report** (route `space-health-report`).

Log chuẩn: `{ "@formatLog": true, "event": "...", "ts": "..." }`.
