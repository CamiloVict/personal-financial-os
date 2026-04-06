import React from 'react';
import { FileSpreadsheet, ShieldAlert } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CHART_COLORS = ['#4f46e5', '#06b6d4', '#0ea5e9', '#3b82f6', '#8b5cf6'];

interface TaxClassificationsProps {
  classifications: any[];
  pieData: any[];
}

export function TaxClassifications({ classifications, pieData }: TaxClassificationsProps) {
  const renderConfidenceBadge = (level: string) => {
    switch (level) {
      case 'HIGH': return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-md font-bold uppercase tracking-wider">Confianza Alta</span>;
      case 'MEDIUM': return <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-md font-bold uppercase tracking-wider">Confianza Media</span>;
      case 'LOW': return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-md font-bold uppercase tracking-wider">Confianza Baja</span>;
      default: return null;
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-1.5">
        <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
        Clasificación de Ingresos (Cédulas)
      </h2>

      {pieData.length > 0 && (
        <div className="glass-card rounded-xl shadow-sm p-4 mb-4">
          <h3 className="text-sm font-bold text-slate-800 mb-2">Composición del Ingreso Anual por Cédula Fiscal</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="name"
                >
                  {pieData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `$${Number(value).toLocaleString()}`} />
                <Legend wrapperStyle={{fontSize: '10px'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {classifications.map((cls: any) => (
          <div key={cls.id} className="glass-card p-4 rounded-xl shadow-sm relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full ${cls.confidenceLevel === 'HIGH' ? 'bg-green-500' : cls.confidenceLevel === 'MEDIUM' ? 'bg-orange-500' : 'bg-red-500'}`}></div>
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{cls.stream?.name || 'Ingreso Desconocido'}</h4>
                <p className="text-[10px] text-slate-500 uppercase font-semibold mt-0.5">
                  Clasificación modelada: {cls.suggestedCedula.replace(/_/g, ' ')}
                </p>
              </div>
              {renderConfidenceBadge(cls.confidenceLevel)}
            </div>
            
            <div className="bg-slate-50 border border-slate-100 p-2.5 rounded mt-2 text-xs text-slate-700">
              <strong>Análisis:</strong> {cls.explanation}
            </div>

            {cls.missingConditions && cls.missingConditions.length > 0 && (
              <div className="mt-2">
                <p className="text-[10px] font-bold text-orange-700 mb-1 flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> Pendiente de Validar:</p>
                <ul className="list-disc pl-4 text-[10px] text-slate-600 space-y-0.5">
                  {cls.missingConditions.map((cond: string, i: number) => <li key={i}>{cond}</li>)}
                </ul>
              </div>
            )}
          </div>
        ))}
        {classifications.length === 0 && (
          <div className="col-span-2 text-center p-6 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-slate-500 text-xs">
            No tienes ingresos configurados en el módulo de Cashflow para analizar.
          </div>
        )}
      </div>
    </div>
  );
}