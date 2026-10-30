// Presents built-in reference information about space-related conditions.
import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { SPACE_CONDITIONS } from '@/lib/missionData';
import { Pill, ArrowLeft } from 'lucide-react';

function Section({ title, body, list }) {
  return (
    <div className="panel p-4">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</div>
      {body && <p className="text-sm text-slate-300">{body}</p>}
      {list && (
        <ul className="space-y-1 text-sm text-slate-300">
          {list.map((x, i) => <li key={i} className="flex gap-2"><span className="text-blue-400">•</span>{x}</li>)}
        </ul>
      )}
    </div>
  );
}

export default function SpaceMedicine() {
  const [sel, setSel] = useState(null);

  if (sel) {
    return (
      <div>
        <PageHeader title={sel.name} subtitle="Space Medicine Center" icon={Pill} />
        <button onClick={() => setSel(null)} className="btn-mission mb-4"><ArrowLeft className="h-4 w-4" /> All Conditions</button>
        <div className="grid gap-4 md:grid-cols-2">
          <Section title="Description" body={sel.description} />
          <Section title="Symptoms" list={sel.symptoms} />
          <Section title="Diagnosis" body={sel.diagnosis} />
          <Section title="Treatments" list={sel.treatments} />
          <Section title="Prevention" list={sel.prevention} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Space Medicine Center" subtitle="Microgravity-specific conditions" icon={Pill} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {SPACE_CONDITIONS.map((c) => (
          <button key={c.id} onClick={() => setSel(c)} className="panel p-4 text-left transition hover:border-blue-500 hover:bg-blue-950/40">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-950/50 text-blue-400"><Pill className="h-5 w-5" /></div>
            <div className="mt-2 text-sm font-semibold text-slate-100">{c.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}