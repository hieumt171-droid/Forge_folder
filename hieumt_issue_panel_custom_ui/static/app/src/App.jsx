import React, { useEffect, useState } from 'react';
import { invoke } from '@forge/bridge';

const formatLog = (event, payload) => ({
  '@formatLog': true,
  event,
  ts: new Date().toISOString(),
  ...payload
});

function App() {
  const [message, setMessage] = useState('Loading...');

  useEffect(() => {
    invoke('getText')
      .then((text) => {
        console.log(JSON.stringify(formatLog('getText.ui.success', { text })));
        setMessage(text || 'Hello World');
      })
      .catch((e) => {
        console.log(
          JSON.stringify(
            formatLog('getText.ui.error', { message: e?.message || String(e) })
          )
        );
        setMessage('Hello World');
      });
  }, []);

  return (
    <div style={{ padding: 12, fontFamily: 'sans-serif' }}>
      <h2 style={{ margin: '0 0 8px' }}>Issue Panel — Custom UI</h2>
      <p style={{ margin: 0 }}>{message}</p>
    </div>
  );
}

export default App;
