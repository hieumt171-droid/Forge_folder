# So sánh Sprint Dashboard: Custom UI vs UI Kit

Hai app cùng chức năng (Overview, Burndown, Issues + mock data), khác stack:

| | Custom UI | UI Kit |
|---|---|---|
| **Project** | `hieumt_practive_dashborad_routing_project_page` | `hieumt_pracitve_UI_Kit_project_dashboard` |
| **Chart** | Recharts `LineChart` | `@forge/react` `LineChart` |
| **Navigation** | Sidebar + `view.createHistory()` + react-router-dom | `Tabs` (UI Kit không hỗ trợ routing URL như Custom UI) |
| **Bảng Issues** | HTML `<table>` + sort Key | `DynamicTable` + sort Key |

---

## 1. Thời gian setup (thực tế)

| Hạng mục | Custom UI | UI Kit |
|---|---|---|
| Scaffold ban đầu | `forge create` + Vite + React | `forge create` template ui-kit (sẵn) |
| Cấu hình build | `vite.config.js`, `base: './'`, script `build:ui`, `predeploy` | Không cần — Forge bundle trực tiếp `src/frontend/index.jsx` |
| Routing | `view.createHistory()` + Router + Sidebar + manifest `pages` + debug Back/F5 | Tabs 3 panel — ~15 phút |
| Chart | Cài Recharts, ResponsiveContainer, styling | `LineChart` với `colorAccessor` — ~10 phút |
| Issues table | HTML + CSS sort button | `DynamicTable` built-in sort — ~15 phút |
| Deploy / tunnel | Build watch, CSP HMR, redeploy khi đổi manifest | `forge deploy` một lệnh |
| **Ước tính tổng** | **~3–4 giờ** (kể cả fix routing Back, sort Key số) | **~45–60 phút** |

**Kết luận setup:** UI Kit nhanh hơn rõ rệt vì không có pipeline frontend riêng và không phải debug routing Forge.

---

## 2. Dòng code

Đo trên source frontend (không tính `node_modules`, build artifact):

| Metric | Custom UI | UI Kit |
|---|---|---|
| File frontend | 8 file (App, 3 pages, Sidebar, mockData, CSS, main) | 1 file chính (`index.jsx`) + resolver |
| Dòng code (`.jsx/.js/.css`) | **~452 dòng** | **~214 dòng** |
| Bundle deploy | **~624 KB** (`static/app/build/`, Recharts chiếm phần lớn) | Không có bundle local — Forge host UI Kit runtime |

Custom UI nhiều code hơn ~2× chủ yếu vì: routing boilerplate, CSS layout, tách file page, dependency Recharts.

---

## 3. Performance (thời gian load)

Cả hai app log cùng format khi sẵn sàng render:

```json
{ "@formatLog": true, "event": "SprintDashboard.ready", "stack": "custom-ui|ui-kit", "loadMs": ... }
```

**Cách đo trên Jira:**

1. Mở DevTools → Console, bật **Disable cache**.
2. Hard refresh (Ctrl+F5) tại Project → Apps → từng app.
3. Ghi `loadMs` trong log `SprintDashboard.ready` — lặp 3 lần, lấy trung bình.

**Kỳ vọng (dựa trên cấu trúc, không phải benchmark lab):**

| | Custom UI | UI Kit |
|---|---|---|
| Payload JS | ~624 KB cần tải + parse (Recharts nặng) | Nhẹ hơn — không ship bundle Recharts |
| First paint | Chậm hơn do chờ `createHistory()` + bundle | Thường nhanh hơn — render native UI Kit |
| Tab/chuyển trang | Route change = remount page (OK với router) | Đổi Tab instant, không URL |

> **Lưu ý:** `loadMs` phụ thuộc mạng, site Jira, và lần load đầu/sau cache. So sánh công bằng nhất khi cùng project, cùng browser, cùng điều kiện mạng.

---

## 4. Routing — chỉ Custom UI làm được checklist 4.4

| Checklist | Custom UI | UI Kit |
|---|---|---|
| Sidebar → Overview / Burndown / Issues | ✅ | ✅ (Tabs, không phải sidebar URL) |
| F5 ở `/burndown` → vẫn Burndown | ✅ | ❌ (không có URL routing) |
| Browser Back → trang trước | ✅ (sau fix v2.3+) | ❌ (Tabs không push history) |

UI Kit **không thay thế** routing full-page; dùng Tabs cho cùng UX điều hướng nội bộ.

---

## 5. Nhận xét cá nhân — khi nào chọn cái nào?

### Chọn **UI Kit** khi:

- App **nằm gọn trong Jira** (project page, issue panel, settings) và cần **look & feel Atlassian** ngay, không custom CSS nhiều.
- Chức năng **form, bảng, chart cơ bản** (LineChart, BarChart, DynamicTable, Tabs) là đủ — không cần tùy biến pixel-perfect chart.
- Team **ưu tiên tốc độ ship** và **ít ops** (không Vite, không build watch, ít lỗi CSP/tunnel).
- **Không cần** deep linking (F5 đúng subpage, Back browser) hoặc sidebar URL riêng.
- Prototype / dashboard nội bộ / admin tool đơn giản.

### Chọn **Custom UI** khi:

- Cần **routing URL** (`createHistory`, F5, Browser Back) — bài 4.4 là case điển hình.
- Cần **thư viện React bên thứ ba** (Recharts, TanStack Table, DnD, map, v.v.) hoặc **design system riêng**.
- UI phức tạp: layout tùy ý, animation, component không có trong `@forge/react`.
- Tích hợp **code frontend có sẵn** (SPA React) vào Forge.
- Sẵn sàng trả **chi phí setup** (Vite, build, deploy, CSP) và **bundle size** lớn hơn.

### Tóm một câu

> **UI Kit = nhanh, gọn, “đúng chuẩn Jira”, đủ cho dashboard/tab/form.**  
> **Custom UI = linh hoạt tối đa, routing + lib ngoài, đổi lại thời gian và độ phức tạp cao hơn.**

Với Sprint Dashboard mock data như bài 4.4: nếu **không bắt buộc F5/Back theo URL**, UI Kit là lựa chọn hợp lý; nếu **routing là yêu cầu cứng**, bắt buộc Custom UI.
