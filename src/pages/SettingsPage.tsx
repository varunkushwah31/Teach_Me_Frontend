import React from 'react';
import { Settings, Server, Database, Cpu, Shield } from 'lucide-react';

const InfoCard: React.FC<{ icon: React.ReactNode; title: string; items: { label: string; value: string }[] }> = ({
  icon,
  title,
  items,
}) => (
  <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5">
    <div className="flex items-center gap-3 mb-4">
      {icon}
      <h3 className="text-white font-semibold">{title}</h3>
    </div>
    <dl className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="flex justify-between text-sm">
          <dt className="text-slate-500">{item.label}</dt>
          <dd className="text-slate-300 font-mono text-xs bg-slate-900/60 px-2 py-0.5 rounded">{item.value}</dd>
        </div>
      ))}
    </dl>
  </div>
);

const SettingsPage: React.FC = () => (
  <div className="flex flex-col h-full bg-slate-900 overflow-y-auto">
    <div className="max-w-2xl mx-auto w-full px-4 py-8 space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/20">
            <Settings className="w-5 h-5 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Settings</h2>
        </div>
        <p className="text-slate-400 ml-13">System configuration and infrastructure overview.</p>
      </div>

      <div className="grid gap-4">
        <InfoCard
          icon={<Server className="w-5 h-5 text-cyan-400" />}
          title="Backend"
          items={[
            { label: 'Framework', value: 'Spring Boot 4.0.6' },
            { label: 'Runtime', value: 'Java 25' },
            { label: 'API Port', value: '8082' },
            { label: 'AI Framework', value: 'Spring AI' },
          ]}
        />
        <InfoCard
          icon={<Database className="w-5 h-5 text-violet-400" />}
          title="Database"
          items={[
            { label: 'Engine', value: 'PostgreSQL + pgvector' },
            { label: 'Host Port', value: '5433' },
            { label: 'User', value: 'springai' },
          ]}
        />
        <InfoCard
          icon={<Cpu className="w-5 h-5 text-amber-400" />}
          title="AI Engine"
          items={[
            { label: 'Runtime', value: 'Ollama (Docker)' },
            { label: 'Model', value: 'deepseek-r1:8b' },
            { label: 'Acceleration', value: 'GPU Passthrough' },
          ]}
        />
        <InfoCard
          icon={<Shield className="w-5 h-5 text-emerald-400" />}
          title="Security"
          items={[
            { label: 'Auth', value: 'JWT (Stateless)' },
            { label: 'Streaming', value: 'SSE + ASYNC dispatch' },
            { label: 'Upload Limit', value: '50 MB' },
          ]}
        />
      </div>
    </div>
  </div>
);

export default SettingsPage;
