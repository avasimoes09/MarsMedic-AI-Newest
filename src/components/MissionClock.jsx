// Shows the elapsed mission time in the app shell.
import { useEffect, useState } from 'react';

export default function MissionClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const met = now.toISOString().substr(11, 8);
  return (
    <div className="hidden text-right sm:block">
      <div className="font-mono text-xs text-slate-400">MET T+{met}</div>
      <div className="font-mono text-[11px] text-slate-500">Mission Day 042 · {now.toISOString().substr(0, 10)}Z</div>
    </div>
  );
}