# Bug Priority Trigger

Trigger `avi:jira:updated:issue` — filter expression nhiều điều kiện + handler assign lead.

## Filter (manifest)

```yaml
expression: event.issue.fields?.issuetype?.name == "Bug" && event.issue.fields?.priority?.name == "Highest"
onError: RECEIVE_AND_LOG
ignoreSelf: true
```

Expression lọc **trạng thái hiện tại**. Handler bổ sung: **priority vừa đổi** sang Highest qua `event.changelog`.

## Test

1. `forge register -y` → deploy → install Jira
2. Mở Bug, đổi Priority → **Highest**
3. Kiểm tra: comment cảnh báo + assignee = project lead
4. Sửa field khác (không đổi priority) khi đã Highest → handler skip (`priority_not_changed_to_highest`)

## Logs

`forge logs -e development --since 15m`
