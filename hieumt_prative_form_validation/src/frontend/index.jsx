import React, { useCallback, useMemo, useState } from 'react';
import ForgeReconciler, {
  Button,
  DatePicker,
  ErrorMessage,
  Form,
  FormFooter,
  HelperMessage,
  Label,
  SectionMessage,
  Stack,
  Text,
  TextArea,
  useForm
} from '@forge/react';
import { invoke } from '@forge/bridge';

const formatLog = (event, payload) => ({
  '@formatLog': true,
  event,
  ts: new Date().toISOString(),
  ...payload
});

const App = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [noteText, setNoteText] = useState('');
  const [reminderDate, setReminderDate] = useState(undefined);

  const { handleSubmit, register, formState, getFieldId } = useForm({
    defaultValues: {
      note: '',
      reminderDate: undefined
    }
  });

  const noteLength = useMemo(() => String(noteText || '').length, [noteText]);

  const noteRegister = register('note', {
    required: 'Ghi chú không được để trống'
  });

  const reminderRegister = register('reminderDate');

  const onSubmit = useCallback(
    async (formData) => {
      console.log(JSON.stringify(formatLog('saveQuickNote.submit', { noteLength })));

      const res = await invoke('saveQuickNote', formData);
      if (res?.success) {
        setIsSubmitted(true);
      }
    },
    [noteLength]
  );

  const onAddNew = useCallback(() => {
    setNoteText('');
    setReminderDate(undefined);
    setFormKey((k) => k + 1);
    setIsSubmitted(false);
  }, []);

  if (isSubmitted) {
    return (
      <Stack space='space.150'>
        <SectionMessage appearance='success'>
          <Text>Lưu ghi chú nhanh thành công!</Text>
        </SectionMessage>

        <Button appearance='primary' onClick={onAddNew}>
          Thêm note mới
        </Button>
      </Stack>
    );
  }

  return (
    <Form key={formKey} onSubmit={handleSubmit(onSubmit)}>
      <Stack space='space.100'>
        <Label labelFor={getFieldId('note')}>Ghi chú</Label>
        <TextArea
          id={getFieldId('note')}
          maxLength={500}
          {...noteRegister}
          value={noteText}
          onChange={(e) => {
            const nextValue = e?.target?.value ?? e?.value ?? e ?? '';
            setNoteText(String(nextValue));
            noteRegister.onChange?.(e);
          }}
        />
        {formState?.errors?.note?.message ? (
          <ErrorMessage>{String(formState.errors.note.message)}</ErrorMessage>
        ) : null}

        <HelperMessage>
          {noteLength}
          /500
        </HelperMessage>

        <Label labelFor={getFieldId('reminderDate')}>Ngày nhắc</Label>
        <DatePicker
          id={getFieldId('reminderDate')}
          {...reminderRegister}
          value={reminderDate}
          onChange={(next) => {
            setReminderDate(next);
            reminderRegister.onChange?.(next);
          }}
        />

        <FormFooter>
          <Button appearance='primary' type='submit'>
            Lưu
          </Button>
        </FormFooter>
      </Stack>
    </Form>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

