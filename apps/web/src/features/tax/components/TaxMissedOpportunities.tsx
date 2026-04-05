import React from 'react';
import { TrendingDown } from 'lucide-react';

interface TaxMissedOpportunitiesProps {
  profile: any;
}

export function TaxMissedOpportunities({ profile }: TaxMissedOpportunitiesProps) {
  if (!profile) return null;
  const isMissing = !profile.hasAFC || !profile.hasVoluntaryPension || !profile.hasHousingInterest || !profile.hasPrepaidMedicine;
  if (!isMissing) return null;

  return (
    <div className="mt-6 bg-orange-50 border border-orange-200 rounded-xl p-4 shadow-sm">
      <h3 className="text-sm font-bold text-orange-900 mb-1.5 flex items-center gap-1.5">
        <TrendingDown className="w-4 h-4 text-orange-600" />
        Oportunidades de Optimización No Aprovechadas
      </h3>
      <p className="text-xs text-slate-700 mb-4">
        Según tu perfil actual, no estás utilizando algunas de las principales herramientas legales en Colombia para reducir tus impuestos. Considera habilitar y soportar las siguientes opciones si aplican a tu caso real:
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {!profile.hasAFC && (
          <div className="bg-white border border-orange-200 p-3 rounded-lg shadow-sm">
            <h4 className="font-bold text-orange-800 mb-1 text-xs">Ahorro en Cuenta AFC</h4>
            <p className="text-[10px] text-slate-600 leading-relaxed">
              El dinero depositado cuenta como <strong>Renta Exenta</strong>. Si destinas ahorros a vivienda (hasta el 30% de tu ingreso o 3,800 UVT anuales), reducirás dramáticamente tu base gravable antes del cálculo de tu impuesto final.
            </p>
          </div>
        )}
        {!profile.hasVoluntaryPension && (
          <div className="bg-white border border-orange-200 p-3 rounded-lg shadow-sm">
            <h4 className="font-bold text-orange-800 mb-1 text-xs">Aportes a Pensión Voluntaria (FPV)</h4>
            <p className="text-[10px] text-slate-600 leading-relaxed">
              El capital aportado a FPV también es <strong>Renta Exenta</strong>. Funciona como un fondo de inversión, pero te ahorra impuestos inmediatamente (sujeto a límite del 30%) siempre que cumplas la permanencia de 10 años o destines el dinero a vivienda.
            </p>
          </div>
        )}
        {!profile.hasHousingInterest && (
          <div className="bg-white border border-orange-200 p-3 rounded-lg shadow-sm">
            <h4 className="font-bold text-orange-800 mb-1 text-xs">Intereses de Crédito Hipotecario</h4>
            <p className="text-[10px] text-slate-600 leading-relaxed">
              Si pagas cuotas de un préstamo de vivienda o leasing habitacional, los intereses que abonas (hasta 100 UVT mensuales) se deducen directamente de tus ingresos.
            </p>
          </div>
        )}
        {!profile.hasPrepaidMedicine && (
          <div className="bg-white border border-orange-200 p-3 rounded-lg shadow-sm">
            <h4 className="font-bold text-orange-800 mb-1 text-xs">Medicina Prepagada o Pólizas</h4>
            <p className="text-[10px] text-slate-600 leading-relaxed">
              Tener planes de salud adicionales a la EPS te otorga una <strong>Deducción</strong> directa de tu base gravable de hasta 16 UVT mensuales (para ti, tu cónyuge o hijos dependientes).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}