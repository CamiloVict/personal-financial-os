import React from 'react';
import { Landmark, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TaxScenariosProps {
  plan: any;
}

export function TaxScenarios({ plan }: TaxScenariosProps) {
  if (!plan || !plan.scenarios || plan.scenarios.length === 0) return null;

  return (
    <div>
      <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-1.5">
        <Landmark className="w-4 h-4 text-indigo-600" />
        Escenarios y Liquidación Sugerida
      </h2>

      {/* Chart Comparison */}
      <div className="glass-card rounded-xl shadow-sm p-4 mb-4">
        <h3 className="text-sm font-bold text-slate-800 mb-3">Comparativa de Escenarios Visual</h3>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={plan.scenarios.map((s: any) => ({
              name: s.name,
              base: Number(s.estimatedTaxableBase),
              impuesto: Number(s.estimatedTaxLiability),
              neto: Number(s.estimatedNetTaxPayable)
            }))} margin={{top: 0, right: 0, left: -20, bottom: 0}}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 9}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 9}} tickFormatter={(val) => `$${val/1000}k`} />
              <Tooltip cursor={{fill: '#f8fafc'}} formatter={(value: any) => `$${Number(value).toLocaleString()}`} />
              <Legend wrapperStyle={{fontSize: '9px', paddingTop: '2px'}} />
              <Bar dataKey="base" name="Base Gravable Neta" fill="#94a3b8" radius={[2, 2, 0, 0]} maxBarSize={20} />
              <Bar dataKey="impuesto" name="Impuesto Bruto" fill="#ef4444" radius={[2, 2, 0, 0]} maxBarSize={20} />
              <Bar dataKey="neto" name="Impuesto a Pagar (Neto)" fill="#6366f1" radius={[2, 2, 0, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {plan.scenarios.map((sc: any) => (
          <div key={sc.id} className={`glass-card rounded-xl p-4 shadow-sm border-2 ${sc.type === 'OPTIMIZED' ? 'border-indigo-500 relative' : 'border-slate-200'}`}>
            {sc.type === 'OPTIMIZED' && (
              <span className="absolute -top-2.5 right-3 bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Mejor Escenario</span>
            )}
            
            <h3 className="text-sm font-bold text-slate-900 mb-1">{sc.name}</h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">{sc.explanation}</p>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">Ingresos Brutos Estimados</span>
                <span className="font-semibold text-slate-800">${Number(sc.estimatedGrossIncome).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">Deducciones Aplicadas</span>
                <span className="font-semibold text-emerald-600">-${Number(sc.estimatedDeductions).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">Rentas Exentas Calculadas</span>
                <span className="font-semibold text-emerald-600">-${Number(sc.estimatedExemptions).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold border-b border-slate-200 pb-1.5">
                <span className="text-slate-700">Base Gravable Neta</span>
                <span className="text-slate-900">${Number(sc.estimatedTaxableBase).toLocaleString()}</span>
              </div>
              {Number(sc.estimatedForeignCredit) > 0 && (
                <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-1.5 bg-blue-50 p-1.5 rounded">
                  <span className="text-blue-800 font-semibold">Descuento Exterior</span>
                  <span className="font-bold text-blue-600">-${Number(sc.estimatedForeignCredit).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm font-black pt-1">
                <span className="text-slate-900">Impuesto a Pagar</span>
                <span className={sc.type === 'OPTIMIZED' ? 'text-indigo-600' : 'text-slate-800'}>
                  ${Number(sc.estimatedNetTaxPayable).toLocaleString()}
                </span>
              </div>
            </div>

            {sc.requirements && sc.requirements.length > 0 && (
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <h4 className="text-[10px] font-bold text-yellow-800 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Soportes Requeridos
                </h4>
                <ul className="list-disc pl-4 text-[10px] text-yellow-900 space-y-0.5">
                  {sc.requirements.map((req: string, i: number) => <li key={i}>{req}</li>)}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}