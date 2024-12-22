'use client';
import { usePingStore } from '@/app/ping/ping.store';

export default function Ping() {
  const { count, increment, reset } = usePingStore();
  
  return (
    <div>
      <p>Ping Count: {count}</p>
      <button onClick={increment}>Ping!</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
