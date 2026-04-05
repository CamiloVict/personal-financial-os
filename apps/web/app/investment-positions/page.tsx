'use client';
import React, { useState, useEffect } from 'react';
import { PieChart as PieChartIcon, Activity } from 'lucide-react';
import { useGlobalStore } from '@/shared/store/global';
import { 
  useInvestmentPositions, 
  useInvestmentTypes, 
  useCreateInvestmentPosition, 
  useDeleteInvestmentPosition, 
  useCreateInvestmentEvent 
} from '@/features/investments/api/queries';

import {
  PositionForm,
  PositionList,
  PositionCharts,
  PositionEventModal
} from '@/features/investments/components';

export default function InvestmentPositionsPage() {
  const { currentUserId } = useGlobalStore();
  
  const { data: positions = [], isLoading: isLoadingPos } = useInvestmentPositions(currentUserId);
  const { data: types = [], isLoading: isLoadingTypes } = useInvestmentTypes(currentUserId);
  
  const createPositionMutation = useCreateInvestmentPosition(currentUserId);
  const deletePositionMutation = useDeleteInvestmentPosition(currentUserId);
  const createEventMutation = useCreateInvestmentEvent(currentUserId);

  const loading = isLoadingPos || isLoadingTypes;

  const [name, setName] = useState('');
  const [typeId, setTypeId] = useState('');
  const [initialCapital, setInitialCapital] = useState<string>('');
  const [currency, setCurrency] = useState('USD');
  const [startDate, setStartDate] = useState('');

  const [selectedPosition, setSelectedPosition] = useState<any>(null);
  const [eventType, setEventType] = useState('PROFIT_DISTRIBUTION');
  const [eventAmount, setEventAmount] = useState<string>('');
  const [eventDate, setEventDate] = useState('');
  const [eventObs, setEventObs] = useState('');

  useEffect(() => {
    if (types.length > 0 && !typeId) {
      setTypeId(types[0].id);
    }
  }, [types, typeId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedDate = startDate ? new Date(startDate).toISOString() : new Date().toISOString();
    
    createPositionMutation.mutate({
      userId: currentUserId,
      typeId,
      name,
      startDate: parsedDate,
      initialCapital: Number(initialCapital) || 0,
      currency,
      currentEstimatedValue: Number(initialCapital) || 0,
      status: 'ACTIVE'
    }, {
      onSuccess: () => {
        setName(''); 
        setInitialCapital(''); 
        setStartDate('');
      }
    });
  };

  const handleEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPosition) return;

    const parsedDate = eventDate ? new Date(eventDate).toISOString() : new Date().toISOString();
    
    createEventMutation.mutate({
      investmentId: selectedPosition.id,
      type: eventType,
      amount: Number(eventAmount) || 0,
      date: parsedDate,
      observations: eventObs,
      currency: selectedPosition.currency
    }, {
      onSuccess: () => {
        setSelectedPosition(null);
        setEventType('PROFIT_DISTRIBUTION');
        setEventAmount('');
        setEventDate('');
        setEventObs('');
      }
    });
  };

  const positionsPieData = positions.reduce((acc: any[], curr: any) => {
    const typeName = curr.type?.name || 'Otro';
    const amount = Number(curr.currentEstimatedValue);
    const existing = acc.find(item => item.name === typeName);
    if (existing) existing.value += amount;
    else acc.push({ name: typeName, value: amount });
    return acc;
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex justify-between items-end border-b border-slate-200/50 pb-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <PieChartIcon className="w-5 h-5 text-blue-600" />
            </div>
            Portafolio
          </h1>
          <p className="text-slate-500 mt-2 text-sm leading-relaxed">
            Registra tus activos y realiza un seguimiento detallado de capital, valorización y flujo.
          </p>
        </div>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
        
        <PositionForm 
          types={types}
          typeId={typeId} setTypeId={setTypeId}
          name={name} setName={setName}
          initialCapital={initialCapital} setInitialCapital={setInitialCapital}
          currency={currency} setCurrency={setCurrency}
          startDate={startDate} setStartDate={setStartDate}
          onSubmit={handleSubmit}
          isPending={createPositionMutation.isPending}
        />

        <div className="lg:col-span-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">Activos en Portafolio</h3>
            {loading && <Activity className="w-5 h-5 text-blue-500 animate-spin" />}
          </div>

          <PositionCharts 
            pieData={positionsPieData}
            positions={positions}
          />
          
          <PositionList 
            positions={positions}
            onSelectPosition={setSelectedPosition}
            onDeletePosition={(id) => deletePositionMutation.mutate(id)}
            isDeleting={deletePositionMutation.isPending}
          />

          {positions.length === 0 && !loading && (
            <div className="glass-card border-dashed border-slate-300 p-12 rounded-xl text-center text-slate-500 flex flex-col items-center gap-3">
              <PieChartIcon className="w-10 h-10 text-slate-300" />
              <p className="font-semibold text-base">No tienes inversiones registradas.</p>
            </div>
          )}
        </div>

      </div>

      <PositionEventModal 
        selectedPosition={selectedPosition}
        setSelectedPosition={setSelectedPosition}
        eventType={eventType} setEventType={setEventType}
        eventAmount={eventAmount} setEventAmount={setEventAmount}
        eventDate={eventDate} setEventDate={setEventDate}
        eventObs={eventObs} setEventObs={setEventObs}
        onSubmit={handleEventSubmit}
        isPending={createEventMutation.isPending}
      />
    </div>
  );
}