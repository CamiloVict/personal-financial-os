import { Network } from 'lucide-react';

export function AllocatorPageHeader() {
  return (
    <header className="flex justify-between items-end border-b border-slate-200/50 pb-4 mb-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <div className="p-1 bg-fuchsia-100 rounded-md">
            <Network className="w-4 h-4 text-fuchsia-600" />
          </div>
          Capital Allocator (IA)
        </h1>
        <p className="text-slate-500 mt-1 text-[11px] leading-relaxed max-w-3xl">
          El motor inteligente que cruza tus impuestos, deudas y metas. Dinos cuánto dinero
          extra tienes para invertir este mes y te diremos exactamente dónde ponerlo para
          maximizar tu retorno garantizado.
        </p>
      </div>
    </header>
  );
}
