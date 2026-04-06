import { Network } from 'lucide-react';

export function AllocatorPageHeader() {
  return (
    <header className="flex justify-between items-end border-b border-slate-200/50 pb-4 mb-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <div className="p-1 bg-fuchsia-100 rounded-md">
            <Network className="w-4 h-4 text-fuchsia-600" />
          </div>
          Simulador de asignación de capital
        </h1>
        <p className="text-slate-500 mt-1 text-[11px] leading-relaxed max-w-3xl">
          Indica un monto hipotético; el modelo cruza impuestos, deudas y metas registradas y muestra
          escenarios con efectos estimados. No es asesoría ni instrucción de actuar.
        </p>
      </div>
    </header>
  );
}
