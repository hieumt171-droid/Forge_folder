# Stale Report — Scheduled Trigger + Web Trigger + Global Page

## Modules

- `scheduledTrigger` — `interval: day` (chạy 8h sáng giờ VN trong handler)
- `webtrigger` `test-report` — test ngay không đợi schedule
- `jira:globalPage` **Stale Report** — đọc KVS `stale-report:latest`

## Setup

```bash
cd hieumt_jira_stale_report
npm install
forge register -y
forge deploy --non-interactive -e development
forge install --non-interactive --site hieumt-forge-resource.atlassian.net --product jira --environment development
```

## Test workflow

### 1. Web trigger (khuyến nghị)

```bash
forge webtrigger
# Chọn: test-report
# Copy URL → mở browser hoặc:
curl -X GET "https://...webtrigger-url..."
```

Kỳ vọng JSON: `{ "ok": true, "total": N, ... }`

### 2. Logs

```bash
forge logs -e development --since 15m
```

### 3. Global page

Jira → **Apps** (top menu) → **Stale Report** → bấm **Tải lại**

## KVS

Key: `stale-report:latest`

Log: `{ "@formatLog": true, ... }`
