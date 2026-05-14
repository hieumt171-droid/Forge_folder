import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ForgeReconciler, {
  Button,
  Heading,
  HelperMessage,
  Label,
  Link,
  LoadingButton,
  RequiredAsterisk,
  SectionMessage,
  Select,
  Spinner,
  Stack,
  Text,
  Textfield,
  useProductContext
} from '@forge/react';
import { invoke, view } from '@forge/bridge';

const browseUrlFromIssueSelf = (issueKey, self) => {
  if (!issueKey || !self) return '';
  try {
    return `${new URL(self).origin}/browse/${issueKey}`;
  } catch {
    return '';
  }
};

const App = () => {
  const productContext = useProductContext();
  const selectedText = productContext?.extension?.selectedText ?? '';

  const [projectKey, setProjectKey] = useState('');
  const [summary, setSummary] = useState('');
  const [issueTypes, setIssueTypes] = useState([]);
  const [issueTypeId, setIssueTypeId] = useState('');
  const [typesLoading, setTypesLoading] = useState(false);
  const [typesError, setTypesError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [created, setCreated] = useState(null);

  useEffect(() => {
    setSummary(String(selectedText).trim());
  }, [selectedText]);

  useEffect(() => {
    const key = projectKey.trim();
    if (!key) {
      setIssueTypes([]);
      setIssueTypeId('');
      setTypesError(null);
      return;
    }

    let alive = true;
    setIssueTypeId('');
    setTypesLoading(true);
    setTypesError(null);
    invoke('getProjectIssueTypes', { project: { key } })
      .then((res) => {
        if (!alive) return;
        const list = res?.issueTypes || [];
        setIssueTypes(list);
        if (list.length) {
          setIssueTypeId(String(list[0].id));
        }
      })
      .catch((e) => alive && setTypesError(e?.message || 'Không tải được loại issue'))
      .finally(() => alive && setTypesLoading(false));

    return () => {
      alive = false;
    };
  }, [projectKey]);

  const selectOptions = useMemo(
    () => issueTypes.map((t) => ({ label: t.name, value: String(t.id) })),
    [issueTypes]
  );

  const selectedOption = useMemo(() => {
    if (!issueTypeId) return null;
    return selectOptions.find((o) => o.value === issueTypeId) || null;
  }, [selectOptions, issueTypeId]);

  const handleSubmit = useCallback(async () => {
    setSubmitError(null);
    const key = projectKey.trim();
    const trimmed = summary.trim();
    if (!key) {
      setSubmitError('Nhập Jira project key (ví dụ KAN).');
      return;
    }
    if (!trimmed) {
      setSubmitError('Summary không được để trống.');
      return;
    }
    if (!issueTypeId) {
      setSubmitError('Chọn loại issue (hoặc đợi tải xong).');
      return;
    }
    setSubmitting(true);
    try {
      const res = await invoke('createIssueFromSelection', {
        project: { key },
        summary: trimmed.slice(0, 255),
        issueTypeId
      });
      setCreated(res);
    } catch (e) {
      setSubmitError(e?.message || 'Tạo issue thất bại');
    } finally {
      setSubmitting(false);
    }
  }, [summary, issueTypeId, projectKey]);

  if (created?.key) {
    const href = browseUrlFromIssueSelf(created.key, created.self);
    return (
      <Stack space='space.200'>
        <Heading size='medium'>Đã tạo issue</Heading>
        <Text>Issue {created.key} đã được tạo.</Text>
        {href ? (
          <Link href={href}>Mở {created.key}</Link>
        ) : (
          <Text>{created.self || created.key}</Text>
        )}
        <Button appearance='primary' onClick={() => view.close()}>
          Đóng
        </Button>
      </Stack>
    );
  }

  return (
    <Stack space='space.200'>
      <Heading size='medium'>Tạo Jira issue từ text chọn</Heading>
      <HelperMessage>
        Summary điền từ text bôi đen qua useProductContext → extension.selectedText (theo tài liệu Confluence Forge).
      </HelperMessage>

      <Stack space='space.100'>
        <Label labelFor='jira-project-key'>
          Jira project key
          <RequiredAsterisk />
        </Label>
        <Textfield
          id='jira-project-key'
          value={projectKey}
          onChange={(e) => setProjectKey(e.target.value)}
        />
        <HelperMessage>Nhập key project Jira (ví dụ KAN). Confluence không gửi sẵn project Jira trong context.</HelperMessage>
      </Stack>

      <Stack space='space.100'>
        <Label labelFor='issue-summary'>
          Summary
          <RequiredAsterisk />
        </Label>
        <Textfield
          id='issue-summary'
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />
        <HelperMessage>Tối đa 255 ký tự.</HelperMessage>
      </Stack>

      <Stack space='space.100'>
        <Label labelFor='issue-type'>
          Issue type
          <RequiredAsterisk />
        </Label>
        {typesLoading ? (
          <Spinner size='small' label='Đang tải loại issue…' />
        ) : (
          <Select
            id='issue-type'
            placeholder={projectKey.trim() ? 'Chọn loại issue' : 'Nhập project key trước'}
            options={selectOptions}
            value={selectedOption}
            onChange={(opt) => setIssueTypeId(opt && !Array.isArray(opt) ? String(opt.value) : '')}
            isSearchable
            isDisabled={!projectKey.trim()}
          />
        )}
        {typesError && (
          <SectionMessage appearance='error' title='Loại issue'>
            <Text>{typesError}</Text>
          </SectionMessage>
        )}
      </Stack>

      {submitError && (
        <SectionMessage appearance='error' title='Không tạo được issue'>
          <Text>{submitError}</Text>
        </SectionMessage>
      )}

      <LoadingButton appearance='primary' onClick={handleSubmit} isLoading={submitting}>
        Tạo issue
      </LoadingButton>
    </Stack>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
