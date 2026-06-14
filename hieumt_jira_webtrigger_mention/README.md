# Web Trigger — Mention Issues

Nhận POST từ bên ngoài, tìm issue keys trong `body.message`, thêm comment Jira.

## Setup

```bash
cd hieumt_jira_webtrigger_mention
npm install
forge register -y
forge deploy --non-interactive -e development
forge install --non-interactive --site hieumt-forge-resource.atlassian.net --product jira --environment development
forge webtrigger create -f mention-webhook -s hieumt-forge-resource.atlassian.net -p jira -e development
```

## Test curl

```bash
curl -X POST "https://...url...?event=push" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"Fix bug in HSF-1 and HSF-2\", \"author\": \"dev\"}"
```

Kỳ vọng: `{ "processed": true, "event": "push", "issuesFound": ["HSF-1","HSF-2"] }`

GET → `405 Method Not Allowed`

Log: `{ "@formatLog": true, ... }`
