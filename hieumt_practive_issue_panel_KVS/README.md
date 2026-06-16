# User Preferences — KVS schema migration (v1 → v2)

## Schema

| Version | Format |
|---------|--------|
| **v1** | `{ theme, showAvatar }` — không có `version` |
| **v2** | `{ theme, showAvatar, locale, notifications, version: 2 }` |

KVS key: `user-prefs:{accountId}`

## Resolvers

- `getUserPrefs` — đọc v1/v2, luôn trả về v2 (migrate in-memory)
- `saveUserPrefs` — luôn ghi v2
- `seedV1UserPrefs` — ghi v1 thủ công để test migrate
- `resetUserPrefs` — xóa key

## Test migrate

1. `forge tunnel` hoặc deploy + mở panel **Cài đặt Cá nhân**
2. Bấm **Seed v1 (test)** → KVS chỉ có `{ theme: "dark", showAvatar: true }`
3. Reload panel → banner **"Đã migrate từ v1"**, form hiện:
   - theme: `dark`, showAvatar: `true` (giữ cũ)
   - locale: `vi`, notifications: `true` (default mới)
4. Bấm **Lưu (v2)** → `forge logs` thấy `version: 2`
5. Reload → không còn banner migrate; theme/showAvatar vẫn `dark` / `true`

## Deploy

```bash
cd hieumt_practive_issue_panel_KVS
forge deploy --non-interactive -e development
```
