import React, { useEffect, useState } from 'react';
import ForgeReconciler, {
  Text,
  Heading,
  Stack,
  Inline,
  Lozenge,
  Tag,
  Spinner,
  SectionMessage
} from '@forge/react';
import { invoke, view } from '@forge/bridge';

const normalizePriority = (priorityName) => {
  if (!priorityName) return 'Low';
  const normalized = priorityName.trim().toLowerCase();
  if (normalized === 'highest' || normalized === 'critical') return 'High';
  if (normalized === 'high') return 'High';
  if (normalized === 'medium') return 'Medium';
  if (normalized === 'low' || normalized === 'lowest') return 'Low';
  return priorityName;
};

const getRiskLabel = (priority) => {
  if (!priority) return 'Low Risk';
  const normalized = priority.trim().toLowerCase();
  if (normalized === 'highest' || normalized === 'critical') return 'High Risk';
  if (normalized === 'high') return 'Medium Risk';
  return 'Low Risk';
};

const getRiskAppearance = (priority) => {
  const normalized = priority?.trim().toLowerCase();
  if (normalized === 'highest' || normalized === 'critical') return 'removed';
  if (normalized === 'high') return 'moved';
  return 'success';
};

const getPriorityAppearance = (priority) => {
  if (!priority) return 'standard';
  const normalized = priority.trim().toLowerCase();
  if (normalized === 'highest' || normalized === 'critical' || normalized === 'high') return 'red';
  if (normalized === 'medium') return 'yellow';
  return 'green';
};

const formatDate = (isoString) => {
  if (!isoString) return 'N/A';
  return new Date(isoString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

const App = () => {
  const [issueData, setIssueData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    view.getContext()
      .then((context) => {
        const issueKey = context?.extension?.issue?.key;
        if (!issueKey) {
          throw new Error('Không tìm thấy issue key trong context.');
        }
        return invoke('getIssueDetails', { issueKey });
      })
      .then((data) => {
        setIssueData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message ?? 'Lỗi khi tải thông tin issue.');
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <Stack space='space.200' alignInline='center'>
        <Spinner size='medium' label='Đang tải thông tin issue...' />
        <Text>Đang tải...</Text>
      </Stack>
    );
  }

  if (error) {
    return (
      <SectionMessage appearance='error' title='Lỗi tải dữ liệu'>
        <Text>{error}</Text>
      </SectionMessage>
    );
  }

  if (!issueData) {
    return (
      <SectionMessage appearance='warning' title='Không có dữ liệu'>
        <Text>Không lấy được thông tin issue.</Text>
      </SectionMessage>
    );
  }

  const riskText = getRiskLabel(issueData.priority);
  const riskAppearance = getRiskAppearance(issueData.priority);

  return (
    <Stack space='space.200'>
      <Heading size='medium'>Risk Score</Heading>
      <Inline alignInline='space-between'>
        <Inline alignInline='center'>
          <Text>Priority:</Text>
          <Lozenge appearance={getPriorityAppearance(issueData.priority)}>{issueData.priority}</Lozenge>
        </Inline>
        <Lozenge appearance={riskAppearance}>{riskText}</Lozenge>
      </Inline>
      <Stack space='space.150'>
        <Inline alignInline='space-between'>
          <Text strong>Issue type</Text>
          <Text>{issueData.issueType}</Text>
        </Inline>
        <Inline alignInline='space-between'>
          <Text strong>Assignee</Text>
          <Text>{issueData.assignee}</Text>
        </Inline>
        <Inline alignInline='space-between'>
          <Text strong>Created</Text>
          <Text>{formatDate(issueData.created)}</Text>
        </Inline>
      </Stack>
    </Stack>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
