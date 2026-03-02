import React, { useEffect, useState } from 'react';
import { getHealth } from '../lib/api';

export default function ApiDemo() {
  const [status, setStatus] = useState<string>('loading');
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    getHealth()
      .then((data) => {
        if (!mounted) return;
        setStatus(data.ok ? 'ok' : 'error');
        setTime(data.time);
      })
      .catch((err) => {
        if (!mounted) return;
        setStatus('error');
        console.error(err);
      });
    return () => { mounted = false; };
  }, []);

  return (
    <div className="p-4 border rounded">
      <h3 className="font-medium">Backend status</h3>
      <p>Status: <strong>{status}</strong></p>
      {time && <p>Time: {time}</p>}
    </div>
  );
}
