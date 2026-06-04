import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ForgeReconciler, {
  Badge,
  Button,
  ButtonGroup,
  Form,
  FormFooter,
  Heading,
  Label,
  List,
  ListItem,
  LoadingButton,
  Lozenge,
  SectionMessage,
  Select,
  Spinner,
  Stack,
  Text,
  TextArea,
  useProductContext
} from '@forge/react';
import { invoke } from '@forge/bridge';

const formatLog = (event, payload) => ({
  '@formatLog': true,
  event,
  ts: new Date().toISOString(),
  ...payload
});

const PRIORITY_OPTIONS = [
  { label: '1 — Cao', value: '1' },
  { label: '2 — Trung bình', value: '2' },
  { label: '3 — Thấp', value: '3' }
];

const priorityLabel = (value) => PRIORITY_OPTIONS.find((opt) => opt.value === String(value))?.label ?? value;

function ChecklistApp({ heading = 'Checklist' }) {
  const context = useProductContext();
  const issueKey = context?.extension?.issue?.key || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [counter, setCounter] = useState({ done: 0, total: 0 });
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('2');
  const [adding, setAdding] = useState(false);
  const [busyKey, setBusyKey] = useState('');

  const selectedPriority = useMemo(
    () => PRIORITY_OPTIONS.find((opt) => opt.value === priority) || PRIORITY_OPTIONS[1],
    [priority]
  );

  const loadItems = useCallback(async () => {
    if (!issueKey) {
      setError('Không xác định được issueKey.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await invoke('listChecklistItems', { issueKey });
      setItems(Array.isArray(res?.items) ? res.items : []);
      setCounter(res?.counter ?? { done: 0, total: 0 });
      console.log(JSON.stringify(formatLog('listChecklistItems.ui.success', { issueKey, ...res?.counter })));
    } catch (e) {
      const message = e?.message || String(e);
      setError(message);
      console.log(JSON.stringify(formatLog('listChecklistItems.ui.error', { message })));
    } finally {
      setLoading(false);
    }
  }, [issueKey]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const applyMutationResult = (res) => {
    setItems(Array.isArray(res?.items) ? res.items : []);
    setCounter(res?.counter ?? { done: 0, total: 0 });
  };

  const onAdd = useCallback(async () => {
    setAdding(true);
    setError('');
    try {
      const res = await invoke('addChecklistItem', {
        issueKey,
        title,
        priority: Number(priority)
      });
      applyMutationResult(res);
      setTitle('');
      console.log(JSON.stringify(formatLog('addChecklistItem.ui.success', { issueKey, key: res?.key })));
    } catch (e) {
      const message = e?.message || String(e);
      setError(message);
      console.log(JSON.stringify(formatLog('addChecklistItem.ui.error', { message })));
    } finally {
      setAdding(false);
    }
  }, [issueKey, title, priority]);

  const onToggle = useCallback(
    async (key) => {
      setBusyKey(key);
      setError('');
      try {
        const res = await invoke('toggleChecklistItem', { issueKey, key });
        applyMutationResult(res);
        console.log(JSON.stringify(formatLog('toggleChecklistItem.ui.success', { key })));
      } catch (e) {
        const message = e?.message || String(e);
        setError(message);
        console.log(JSON.stringify(formatLog('toggleChecklistItem.ui.error', { message })));
      } finally {
        setBusyKey('');
      }
    },
    [issueKey]
  );

  const onDelete = useCallback(
    async (key) => {
      setBusyKey(key);
      setError('');
      try {
        const res = await invoke('deleteChecklistItem', { issueKey, key });
        applyMutationResult(res);
        console.log(JSON.stringify(formatLog('deleteChecklistItem.ui.success', { key })));
      } catch (e) {
        const message = e?.message || String(e);
        setError(message);
        console.log(JSON.stringify(formatLog('deleteChecklistItem.ui.error', { message })));
      } finally {
        setBusyKey('');
      }
    },
    [issueKey]
  );

  if (loading) {
    return <Spinner label="Đang tải checklist..." />;
  }

  return (
    <Stack space="space.200">
      <Stack space="space.100">
        <Heading size="small">{heading}</Heading>
        <Text>Issue: {issueKey || '—'}</Text>
        <Badge>
          {counter.done}/{counter.total} hoàn thành
        </Badge>
      </Stack>

      {error ? (
        <SectionMessage appearance="error" title="Lỗi">
          <Text>{error}</Text>
        </SectionMessage>
      ) : null}

      <Form>
        <Stack space="space.150">
          <Label labelFor="checklist-title">Tiêu đề item</Label>
          <TextArea
            id="checklist-title"
            value={title}
            onChange={(event) => setTitle(String(event?.target?.value ?? event?.value ?? ''))}
          />

          <Label labelFor="checklist-priority">Priority</Label>
          <Select
            id="checklist-priority"
            options={PRIORITY_OPTIONS}
            value={selectedPriority}
            onChange={(option) => setPriority(option?.value ?? '2')}
          />

          <FormFooter>
            <LoadingButton appearance="primary" isLoading={adding} onClick={onAdd}>
              Thêm item
            </LoadingButton>
          </FormFooter>
        </Stack>
      </Form>

      {items.length === 0 ? (
        <Text>Chưa có item — thêm item mới ở form trên.</Text>
      ) : (
        <List type="unordered">
          {items.map((item) => (
            <ListItem key={item.key}>
              <Stack space="space.100">
                <Text>
                  {item.isDone ? '[x]' : '[ ]'} {item.title}
                </Text>
                <Stack space="space.050">
                  <Lozenge appearance={item.isDone ? 'success' : 'default'}>
                    {item.isDone ? 'Done' : 'Open'}
                  </Lozenge>
                  <Text>Priority: {priorityLabel(item.priority)}</Text>
                </Stack>
                <ButtonGroup>
                  <Button
                    appearance="subtle"
                    isDisabled={busyKey === item.key}
                    onClick={() => onToggle(item.key)}
                  >
                    Toggle done
                  </Button>
                  <Button
                    appearance="danger"
                    isDisabled={busyKey === item.key}
                    onClick={() => onDelete(item.key)}
                  >
                    Delete
                  </Button>
                </ButtonGroup>
              </Stack>
            </ListItem>
          ))}
        </List>
      )}
    </Stack>
  );
}

ForgeReconciler.render(<ChecklistApp heading="Checklist" />);
