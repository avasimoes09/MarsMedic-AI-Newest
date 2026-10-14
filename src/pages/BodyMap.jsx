import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import { MapPin } from 'lucide-react';

const REGIONS = [
  { id: 'head', label: 'Head', system: 'neurological', shape: 'circle', props: { cx: 100, cy: 44, r: 26 } },
  { id: 'eyesL', label: 'Eyes', system: 'neurological', shape: 'circle', props: { cx: 88, cy: 42, r: 4 } },
  { id: 'eyesR', label: 'Eyes', system: 'neurological', shape: 'circle', props: { cx: 112, cy: 42, r: 4 } },
  { id: 'earsL', label: 'Ears', system: 'neurological', shape: 'circle', props: { cx: 72, cy: 44, r: 5 } },
  { id: 'earsR', label: 'Ears', system: 'neurological', shape: 'circle', props: { cx: 128, cy: 44, r: 5 } },
  { id: 'neck', label: 'Neck', system: 'neurological', shape: 'rect', props: { x: 90, y: 68, width: 20, height: 18 } },
  { id: 'chest', label: 'Chest', system: 'cardiovascular', shape: 'rect', props: { x: 68, y: 86, width: 64, height: 52 } },
  { id: 'abdomen', label: 'Abdomen', system: 'gastrointestinal', shape: 'rect', props: { x: 74, y: 138, width: 52, height: 42 } },
  { id: 'armL', label: 'Arm', system: 'musculoskeletal', shape: 'rect', props: { x: 40, y: 88, width: 20, height: 90 } },
  { id: 'armR', label: 'Arm', system: 'musculoskeletal', shape: 'rect', props: { x: 140, y: 88, width: 20, height: 90 } },
  { id: 'legL', label: 'Leg', system: 'musculoskeletal', shape: 'rect', props: { x: 80, y: 180, width: 18, height: 110 } },
  { id: 'legR', label: 'Leg', system: 'musculoskeletal', shape: 'rect', props: { x: 102, y: 180, width: 18, height: 110 } },
];

const QUICK = [
  { l: 'Skin', s: 'skin' }, { l: 'Back', s: 'musculoskeletal' }, { l: 'Head', s: 'neurological' },
  { l: 'Eyes', s: 'neurological' }, { l: 'Ears', s: 'neurological' }, { l: 'Neck', s: 'neurological' },
  { l: 'Chest', s: 'cardiovascular' }, { l: 'Abdomen', s: 'gastrointestinal' }, { l: 'Arms', s: 'musculoskeletal' },
  { l: 'Legs', s: 'musculoskeletal' },
];

export default function BodyMap() {
  const navigate = useNavigate();
  const go = (system, region) => navigate('/assessment', { state: { system, region } });

  return (
    <div>
      <PageHeader title="Interactive Body Map" subtitle="Tap a region to open related symptoms" icon={MapPin} />
      <div className="grid gap-6 md:grid-cols-[280px_1fr]">
        <div className="panel flex justify-center p-4">
          <svg viewBox="0 0 200 300" className="h-auto w-full max-w-[260px]">
            <path d="M100 14 a30 30 0 1 0 0.1 0 Z M70 82 q-30 0 -30 30 v60 q0 8 8 8 h8 v92 q0 8 8 8 h16 q8 0 8-8 v-92 h8 q8 0 8-8 v-60 q0-30-30-30 Z" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
            {REGIONS.map((r) => {
              const El = r.shape === 'circle' ? 'circle' : 'rect';
              return (
                <El
                  key={r.id}
                  {...r.props}
                  onClick={() => go(r.system, r.label)}
                  className="cursor-pointer fill-blue-950/50 stroke-blue-700 transition hover:fill-blue-900/60"
                  strokeWidth="1.5"
                />
              );
            })}
          </svg>
        </div>
        <div>
          <div className="mb-2 text-xs font-medium text-slate-400">Quick Regions</div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {QUICK.map((b) => (
              <button key={b.l} onClick={() => go(b.s, b.l)} className="btn-mission">{b.l}</button>
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-400">Tapping a region opens the symptom assessment pre-loaded to the related body system.</p>
        </div>
      </div>
    </div>
  );
}