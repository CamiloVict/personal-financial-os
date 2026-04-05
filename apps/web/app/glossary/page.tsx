'use client';
import React, { useState } from 'react';
import { BookOpen, Search, Lightbulb, Landmark, Scale, PieChart, Info } from 'lucide-react';
import Link from 'next/link';

export default function GlossaryPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    {
      id: 'investments',
      name: 'Inversiones y Retornos',
      icon: <PieChart className="w-4 h-4 text-blue-600" />,
      color: 'blue',
      terms: [
        {
          term: 'ROI (Retorno sobre la Inversión)',
          definition: 'Es el porcentaje de ganancia o pérdida que obtienes sobre el total del dinero invertido. Si compras algo en $100 y te da $10 de ganancia al año, tu ROI es del 10%.',
          example: 'Útil para comparar qué inversión te da más dinero anualmente por cada peso invertido.'
        },
        {
          term: 'Cash-on-Cash Return',
          definition: 'A diferencia del ROI general, el Cash-on-Cash mide cuánto dinero en efectivo te entra anualmente respecto a tu propio efectivo inicial (cuota inicial o down payment), excluyendo la plata prestada por el banco.',
          example: 'Compraste un apto de $500M pero tú solo pusiste $150M. Si el arriendo te deja $15M libres al año, tu Cash-on-Cash es del 10% ($15M / $150M), lo cual es excelente porque el banco puso el resto del capital.'
        },
        {
          term: 'Tasa de Oportunidad (Línea Base)',
          definition: 'Es el rendimiento que dejarías de ganar si no invirtieras tu dinero en tu opción más segura y pasiva (ej. un CDT al 8%). Toda nueva inversión (ej. un negocio o un inmueble) debería rentar MÁS que tu tasa de oportunidad para que valga la pena el riesgo.',
          example: 'Si un CDT te da 10% sin hacer nada, tu "Tasa de Oportunidad" es 10%. No deberías montar un negocio que rinda el 5%.'
        },
        {
          term: 'Valorización (Appreciation)',
          definition: 'El aumento del valor de mercado de un activo (como una casa, una acción) con el paso del tiempo.',
          example: 'Una casa comprada en $200M que el próximo año vale $210M tuvo una valorización del 5%.'
        }
      ]
    },
    {
      id: 'debt',
      name: 'Deudas y Apalancamiento',
      icon: <Scale className="w-4 h-4 text-indigo-600" />,
      color: 'indigo',
      terms: [
        {
          term: 'Apalancamiento (Leverage)',
          definition: 'Usar dinero prestado (deuda) para comprar un activo, con la expectativa de que el activo genere más dinero (o se valorice más rápido) de lo que cuestan los intereses de la deuda.',
          example: 'Usar una hipoteca del banco para comprar un apartamento para alquilar.'
        },
        {
          term: 'Apalancamiento Positivo',
          definition: 'Ocurre cuando el retorno que produce el activo (arriendo + valorización) es MAYOR al costo de los intereses de la deuda. ¡Te estás enriqueciendo con dinero del banco!',
          example: 'Pagas 11% de interés, pero la casa se valoriza al 5% y te da 8% en arriendo (13% total). Estás ganando un 2% extra sobre dinero que no era tuyo.'
        },
        {
          term: 'Deuda Buena',
          definition: 'Deuda utilizada para adquirir activos que se aprecian o generan ingresos, y que idealmente ofrece beneficios fiscales (como deducir los intereses de tus impuestos).',
          example: 'Un crédito hipotecario o un préstamo para expandir tu negocio.'
        },
        {
          term: 'Deuda Mala',
          definition: 'Deuda con altas tasas de interés utilizada para comprar cosas que pierden valor (se deprecian) o para financiar gastos de consumo diario.',
          example: 'Tarjetas de crédito o créditos de libre inversión usados para viajes o ropa.'
        },
        {
          term: 'Tasa E.A. (Efectiva Anual)',
          definition: 'Es la tasa de interés real que pagas o ganas en un año, teniendo en cuenta que los intereses se cobran (o capitalizan) mes a mes. Es la medida estándar para comparar préstamos en Colombia.',
          example: 'Si un préstamo dice "2% mensual", la tasa E.A. será mayor al 24% por el efecto compuesto.'
        }
      ]
    },
    {
      id: 'taxes',
      name: 'Impuestos y Beneficios (Colombia)',
      icon: <Landmark className="w-4 h-4 text-emerald-600" />,
      color: 'emerald',
      terms: [
        {
          term: 'Escudo Fiscal (Tax Shield)',
          definition: 'Es el ahorro de dinero en impuestos que logras al utilizar herramientas legales (deducciones o rentas exentas) que disminuyen tu base gravable (sobre la cual se calcula tu impuesto).',
          example: 'Si pagas $10M en intereses hipotecarios al año, la ley te deja "restar" esos $10M de tu salario antes de calcular tus impuestos, ahorrándote millones.'
        },
        {
          term: 'UVT (Unidad de Valor Tributario)',
          definition: 'Es una medida oficial del gobierno colombiano para estandarizar los topes y valores de los impuestos. Se actualiza cada año según la inflación.',
          example: 'En lugar de decir "tope de 40 millones", la ley dice "1000 UVT", así no tienen que cambiar la ley cada año.'
        },
        {
          term: 'Base Gravable',
          definition: 'Es el monto final (después de restar todas tus deducciones y rentas exentas a tu ingreso bruto) sobre el cual la DIAN te aplica el porcentaje de impuestos que debes pagar.',
          example: 'Ganaste $100M, tienes beneficios fiscales por $30M. Tu base gravable es $70M. Pagarás impuestos solo sobre esos $70M.'
        },
        {
          term: 'Renta Exenta',
          definition: 'Una porción de tus ingresos que la ley permite que NO pague impuestos. Por ejemplo, los aportes a fondos de pensión voluntaria (FPV) o cuentas de ahorro para vivienda (AFC).',
          example: 'Cuentas AFC, Aportes a Pensión Voluntaria (FPV), o el 25% de salario (renta exenta laboral automática).'
        },
        {
          term: 'Deducciones Legales',
          definition: 'Gastos permitidos por la ley que puedes restar de tus ingresos para bajar tus impuestos.',
          example: 'Tener dependientes económicos (hijos, padres), pagar medicina prepagada, o pagar intereses de vivienda.'
        },
        {
          term: 'Cédulas Fiscales',
          definition: 'El sistema colombiano divide tus ingresos en "Cédulas" (cajones) dependiendo de dónde vienen (Laboral, Rentas de Capital, Dividendos, etc.), y cada cajón tiene reglas y topes diferentes.',
          example: 'El salario va en la "Cédula General", los dividendos en la "Cédula de Dividendos".'
        },
        {
          term: 'Cuentas AFC (Ahorro Fomento Construcción)',
          definition: 'Cuentas bancarias en Colombia diseñadas para comprar vivienda o pagar cuotas de créditos hipotecarios. El dinero depositado desde tu nómina a esta cuenta baja automáticamente tus impuestos (es renta exenta).',
          example: ''
        },
        {
          term: 'FPV (Fondo de Pensión Voluntaria)',
          definition: 'Vehículo de inversión en Colombia que ofrece beneficios fiscales (renta exenta) similares a la cuenta AFC, si cumples requisitos de permanencia (10 años) o usas el dinero para comprar vivienda.',
          example: ''
        }
      ]
    }
  ];

  const filteredCategories = categories.map(cat => {
    return {
      ...cat,
      terms: cat.terms.filter(t => 
        t.term.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.definition.toLowerCase().includes(searchTerm.toLowerCase())
      )
    };
  }).filter(cat => cat.terms.length > 0);

  return (
    <div className="space-y-4 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <header className="flex justify-between items-end border-b border-slate-200/50 pb-3 mb-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <div className="p-1 bg-slate-100 rounded-md">
              <BookOpen className="w-4 h-4 text-slate-600" />
            </div>
            Glosario Financiero
          </h1>
          <p className="text-slate-500 mt-1 text-[11px] leading-relaxed">
            Entiende de forma simple los conceptos técnicos utilizados en los simuladores y paneles de la plataforma.
          </p>
        </div>
      </header>

      <div className="relative mb-6">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
        <input 
          type="text" 
          placeholder="Buscar un término (Ej. ROI, UVT, Apalancamiento)..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400 transition-all"
        />
      </div>

      {filteredCategories.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-100">
          <Info className="w-6 h-6 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-600">No encontramos ningún término que coincida con "{searchTerm}"</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredCategories.map(category => (
            <div key={category.id} className="space-y-3">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                <div className={`bg-${category.color}-100 p-1 rounded`}>
                  {category.icon}
                </div>
                {category.name}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {category.terms.map((item, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className={`font-bold text-sm text-${category.color}-700 mb-1.5`}>{item.term}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed mb-2">{item.definition}</p>
                    {item.example && (
                      <div className="bg-slate-50 p-2 rounded-lg mt-2 flex gap-1.5 items-start border border-slate-100">
                        <Lightbulb className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-slate-500 italic leading-relaxed"><strong>Ejemplo:</strong> {item.example}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}