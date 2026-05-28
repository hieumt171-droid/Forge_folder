import React, { useMemo, useState } from 'react';
import { invoke } from '@forge/bridge';
import { useForm } from 'react-hook-form';

const formatLog = (event, payload) => ({
  '@formatLog': true,
  event,
  ts: new Date().toISOString(),
  ...payload
});

function App() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      note: '',
      reminderDate: ''
    }
  });

  const noteValue = watch('note') || '';
  const noteLength = useMemo(() => String(noteValue).length, [noteValue]);

  const onSubmit = async (formData) => {
    console.log(JSON.stringify(formatLog('saveQuickNote.submit', { noteLength })));

    const res = await invoke('saveQuickNote', formData);
    if (res?.success) {
      setIsSubmitted(true);
    }
  };

  const onAddNew = () => {
    reset({ note: '', reminderDate: '' });
    setIsSubmitted(false);
  };

  if (isSubmitted) {
    return (
      <div style={{ padding: 12 }}>
        <div
          style={{
            border: '1px solid #22a06b',
            background: '#e3fcef',
            padding: 10,
            borderRadius: 6,
            marginBottom: 12
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Thành công</div>
          <div>Lưu ghi chú nhanh thành công!</div>
        </div>

        <button
          type='button'
          onClick={onAddNew}
          style={{
            background: '#0052CC',
            color: '#fff',
            border: 0,
            borderRadius: 6,
            padding: '8px 12px',
            cursor: 'pointer'
          }}
        >
          Thêm note mới
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ padding: 12 }}>
      <div style={{ marginBottom: 12 }}>
        <label htmlFor='note' style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>
          Ghi chú <span style={{ color: '#DE350B' }}>*</span>
        </label>
        <textarea
          id='note'
          rows={5}
          maxLength={500}
          style={{
            width: '100%',
            resize: 'vertical',
            padding: 8,
            borderRadius: 6,
            border: errors?.note ? '1px solid #DE350B' : '1px solid #DFE1E6'
          }}
          {...register('note', { required: 'Ghi chú không được để trống' })}
        />
        {errors?.note ? (
          <div style={{ color: '#DE350B', marginTop: 6, fontSize: 12 }}>
            {String(errors.note.message)}
          </div>
        ) : null}
        <div style={{ color: '#6B778C', marginTop: 6, fontSize: 12 }}>
          {noteLength}/500
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label
          htmlFor='reminderDate'
          style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}
        >
          Ngày nhắc
        </label>
        <input
          id='reminderDate'
          type='date'
          style={{
            padding: 8,
            borderRadius: 6,
            border: '1px solid #DFE1E6'
          }}
          {...register('reminderDate')}
        />
      </div>

      <button
        type='submit'
        disabled={isSubmitting}
        style={{
          background: '#0052CC',
          color: '#fff',
          border: 0,
          borderRadius: 6,
          padding: '8px 12px',
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
          opacity: isSubmitting ? 0.7 : 1
        }}
      >
        {isSubmitting ? 'Đang lưu...' : 'Lưu'}
      </button>
    </form>
  );
}

export default App;
