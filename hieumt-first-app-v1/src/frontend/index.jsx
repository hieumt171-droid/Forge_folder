// src/frontend/index.jsx
// ForgeReconciler: React reconciler đặc biệt của Forge
// Dùng ForgeReconciler.render() thay vì ReactDOM.render()

import ForgeReconciler, {
  Text,
  Heading,
  Stack,       // Layout dọc, tương đương flexbox column
  Inline,      // Layout ngang, tương đương flexbox row
  Badge,       // Badge nhỏ hiển thị con số hoặc label ngắn
  Tag,         // Tag có màu, thường dùng cho labels/priorities
  Lozenge,     // Badge đặc biệt cho issue status
  Spinner,     // Loading indicator
  SectionMessage, // Box thông báo: info, success, warning, error
} from '@forge/react';
// useProductContext: hook lấy context từ Jira/Confluence

// invoke: function gọi resolver backend
import { invoke, view } from '@forge/bridge';
import React, { useState, useEffect } from 'react';
// ── Helper function: format ngày tháng ──────────────────────

const formatDate = (isoString) => {
  if (!isoString) return 'N/A';
  return new Date(isoString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

};
// ── Helper function: xác định appearance cho StatusLozenge ──

// Forge UI Kit StatusLozenge có các appearance: default, inprogress, moved, new, removed, success
const getStatusAppearance = (statusName) => {
  const name = statusName?.toLowerCase() ?? '';
  if (name.includes('done') || name.includes('closed') || name.includes('resolved'))
    return 'success';
  if (name.includes('progress') || name.includes('review') || name.includes('testing'))
    return 'inprogress';
  if (name.includes('blocked') || name.includes('cancelled'))
    return 'removed';
  return 'default'; // Todo, Open, New...

};
// ── Helper function: xác định màu Tag cho priority ──────────

const getPriorityColor = (priority) => {
  const p = priority?.toLowerCase() ?? '';
  if (p === 'highest' || p === 'critical') return 'red';
  if (p === 'high') return 'red';
  if (p === 'medium') return 'yellow';
  if (p === 'low') return 'green';
  if (p === 'lowest') return 'teal';
  return 'standard';
};

// ── Main Component ───────────────────────────────────────────
const IssueInfoPanel = () => {
  // useProductContext() trả về object chứa thông tin về context hiện tại
  // Ví dụ khi dùng trong Issue Panel:
  // {
  //   extension: {
  //     issue: { key: 'PROJ-123', id: '10001' },
  //     project: { key: 'PROJ', id: '10000' }
  //   },
  //   accountId: 'abc123',    // user đang xem
  //   cloudId: 'site-uuid',
  //   environmentType: 'DEVELOPMENT'
  // }

  const [context, setContext] = useState(null);
  // State management

  const [issueData, setIssueData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    view.getContext()
      .then((ctx) => setContext(ctx))
      .catch((err) => {
        setError(err.message ?? 'Không lấy được context');
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!context) return; // Context chưa sẵn sàng, đợi lần render tiếp
    const issueKey = context.extension.issue.key;
    console.log('Invoking getIssueDetails with issueKey:', issueKey);
    invoke('getIssueDetails', { issueKey })
      .then((data) => {
        console.log('Received data from backend:', data);
        setIssueData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.log('Error invoking getIssueDetails:', err);
        setError(err.message ?? 'Đã xảy ra lỗi không xác định');
        setIsLoading(false);
      });
  }, [context]);
  // ── Render: Loading State ────────────────────────────────
  console.log('Rendering component with state:', { isLoading, error, issueData });
  if (isLoading) {

    return (
      <Stack space='space.200' alignInline='center'>
        <Spinner size='medium' label='Đang tải thông tin issue...' />
        <Text>Đang tải...</Text>
      </Stack>
    );

  }
  // ── Render: Error State ──────────────────────────────────

  if (error) {
    return (
      <SectionMessage
        appearance='error'
        title='Không thể tải thông tin'
      >
        <Text>{error}</Text>
        <Text>Hãy thử tải lại trang nếu lỗi tiếp tục xảy ra.</Text>
      </SectionMessage>
    );
  }
  // ── Render: Success State ────────────────────────────────

  if (!issueData) {
    return (
      <SectionMessage appearance='warning' title='Không có dữ liệu'>
        <Text>Không thể tải thông tin issue. Vui lòng thử lại.</Text>
      </SectionMessage>
    );
  }

  return (

    <Stack space='space.200'>

      {/* Tiêu đề panel */}

      <Heading as='h4'>{issueData.key}</Heading>
      <Text>{issueData.summary}</Text>
      {/* Divider (Stack tự tạo spacing) */}
      {/* Status */}
      <Inline space='space.100' alignBlock='center'>
        <Text>Trạng thái:</Text>
        <Lozenge appearance={getStatusAppearance(issueData.status)}>
          {issueData.status}
        </Lozenge>
      </Inline>
      {/* Priority */}
      <Inline space='space.100' alignBlock='center'>
        <Text>Độ ưu tiên:</Text>
        <Tag
          text={issueData.priority}
          color={getPriorityColor(issueData.priority)}
        />
      </Inline>
      {/* Assignee */}
      <Inline space='space.100' alignBlock='center'>
        <Text>Người phụ trách:</Text>
        <Text>{issueData.assignee}</Text>
      </Inline>
      {/* Created Date */}
      <Inline space='space.100' alignBlock='center'>
        <Text>Ngày tạo:</Text>
        <Text>{formatDate(issueData.created)}</Text>
      </Inline>
    </Stack>
  );

};



// Render component vào Forge sandbox

// ForgeReconciler.render() thay thế ReactDOM.render()
ForgeReconciler.render(
  <React.StrictMode>
    <IssueInfoPanel />
  </React.StrictMode>
);