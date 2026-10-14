import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import { Mic, Square } from 'lucide-react';

export default function VoiceAssessment() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const navigate = useNavigate();

  const start = () => {
    setListening(true);
    setTranscript('');
    const words = 'I feel chest pain and shortness of breath'.split(' ');
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setTranscript(words.slice(0, i + 1).join(' '));
      if (i >= words.length - 1) {
        clearInterval(t);
        setTimeout(() => { setListening(false); navigate('/assessment'); }, 1200);
      }
    }, 450);
  };

  return (
    <div>
      <PageHeader title="Voice Assessment" subtitle="Voice-only emergency workflow" icon={Mic} />
      <div className="panel panel-glow p-8 text-center">
        <button onClick={listening ? undefined : start} className={`mx-auto flex h-28 w-28 items-center justify-center rounded-full border-2 transition ${listening ? 'border-red-700 bg-red-950/40' : 'border-blue-900/60 bg-blue-950/50 hover:bg-blue-900/40'}`}>
          {listening ? <Square className="h-10 w-10 text-red-400" /> : <Mic className="h-10 w-10 text-blue-400" />}
        </button>
        <div className="mt-4 text-sm text-slate-300">{listening ? 'Listening…' : 'Tap to start'}</div>
        {transcript && <div className="mt-4 rounded-md border border-slate-800 bg-slate-800/50 p-4 text-slate-200">"{transcript}"</div>}
        <button onClick={() => navigate('/assessment')} className="btn-mission mt-6">Continue to Assessment</button>
      </div>
    </div>
  );
}