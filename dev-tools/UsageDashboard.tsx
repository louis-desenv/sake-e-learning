import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, RefreshCw, Activity, CheckCircle2, AlertCircle, BarChart3, Database } from 'lucide-react';
import { usageMetricsService } from '../services/usageMetricsService';

interface LogEntry {
  timestamp: string;
  service: string;
  endpoint: string;
  status: number;
  durationMs: number;
}

const UsageDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterService, setFilterService] = useState<string>('all');
  const [refreshKey, setRefreshKey] = useState<number>(0);

  useEffect(() => {
    setLogs(usageMetricsService.getLogs().reverse());
  }, [refreshKey]);

  const handleClear = () => {
    if (window.confirm('Deseja limpar todos os logs de chamadas?')) {
      usageMetricsService.clearLogs();
      setRefreshKey(prev => prev + 1);
    }
  };

  const services = Array.from(new Set(logs.map(l => l.service)));

  const filteredLogs = logs.filter(log => {
    if (filterService === 'all') return true;
    return log.service === filterService;
  });

  const totalCalls = logs.length;
  const successCalls = logs.filter(l => l.status >= 200 && l.status < 300).length;
  const failedCalls = totalCalls - successCalls;
  const successRate = totalCalls > 0 ? ((successCalls / totalCalls) * 100).toFixed(1) : '100';

  const averageLatency = totalCalls > 0
    ? (logs.reduce((acc, log) => acc + log.durationMs, 0) / totalCalls).toFixed(0)
    : '0';

  return (
    <div className="min-h-screen pb-20 bg-[#0d0f14]" style={{ color: 'var(--text-primary)' }}>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.history.back()}
              className="p-2 rounded-lg bg-transparent hover:bg-white/5 border border-white/10 text-white cursor-pointer transition-colors"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-2xl font-black flex items-center gap-2">
                <Activity className="text-purple-400" size={24} />
                API Usage Monitor
              </h1>
              <p className="text-xs text-slate-400">Layout v2 - Monitoramento em tempo real de requisições e latência das APIs</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setRefreshKey(prev => prev + 1)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#1e2130] border border-[#2e3250] hover:bg-[#222538] text-white cursor-pointer transition-colors"
            >
              <RefreshCw size={12} />
              Atualizar
            </button>
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 cursor-pointer transition-colors"
            >
              Limpar Logs
            </button>
          </div>
        </div>

        {/* Stats Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#161920] border border-[#252838] p-5 rounded-2xl">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total de Chamadas</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-3xl font-black">
                {totalCalls}
              </span>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                <Database size={18} />
              </div>
            </div>
          </div>

          <div className="bg-[#161920] border border-[#252838] p-5 rounded-2xl">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Latência Média</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-3xl font-black">
                {averageLatency} <span className="text-sm font-bold text-slate-400">ms</span>
              </span>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                <BarChart3 size={18} />
              </div>
            </div>
          </div>

          <div className="bg-[#161920] border border-[#252838] p-5 rounded-2xl">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Taxa de Sucesso</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-3xl font-black text-emerald-400">
                {successRate}%
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 size={18} />
              </div>
            </div>
          </div>

          <div className="bg-[#161920] border border-[#252838] p-5 rounded-2xl">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Erros/Falhas</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-3xl font-black text-rose-400">
                {failedCalls}
              </span>
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 border border-rose-500/20">
                <AlertCircle size={18} />
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Content Card */}
        <div className="bg-[#161920] border border-[#252838] rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-[#252838] flex flex-wrap gap-2 items-center justify-between">
            <span className="text-sm font-extrabold">Histórico de Requisições</span>
            <div className="flex gap-1 bg-[#0d0f14] p-1 rounded-xl border border-white/5">
              <button
                onClick={() => setFilterService('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors border-none ${filterService === 'all' ? 'bg-[#7c5cff] text-white' : 'text-slate-400 bg-transparent'}`}
              >
                Todos
              </button>
              {services.map(srv => (
                <button
                  key={srv}
                  onClick={() => setFilterService(srv)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors border-none ${filterService === srv ? 'bg-[#7c5cff] text-white' : 'text-slate-400 bg-transparent'}`}
                >
                  {srv}
                </button>
              ))}
            </div>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <Activity className="opacity-20 animate-pulse text-purple-400" size={32} />
              Nenhuma requisição registrada ainda. Use o chat de texto ou voz para gerar logs.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#0f111a] border-b border-[#252838] text-slate-400">
                    <th className="p-3 font-bold">Data/Hora</th>
                    <th className="p-3 font-bold">Serviço</th>
                    <th className="p-3 font-bold">Operação</th>
                    <th className="p-3 font-bold">Status</th>
                    <th className="p-3 font-bold text-right">Latência</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#252838]/60">
                  {filteredLogs.map((log, index) => {
                    const statusOk = log.status >= 200 && log.status < 300;
                    return (
                      <tr key={index} className="hover:bg-white/[0.01] transition-colors">
                        <td className="p-3 text-slate-400 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${log.service === 'Gemini' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/25' : 'bg-blue-500/10 text-blue-400 border border-blue-500/25'}`}>
                            {log.service}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-300">
                          {log.endpoint}
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 font-bold ${statusOk ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {statusOk ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                            {log.status}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-right font-bold text-slate-300">
                          {log.durationMs} ms
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default UsageDashboard;
