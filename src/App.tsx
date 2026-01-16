import { useState } from 'react';
import { supabase } from './lib/supabase';

// Ícones em SVG para evitar erros de biblioteca externa
const IconShopping = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="商 16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>;
const IconCalc = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
const IconUser = () => <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const IconCheck = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>;
const IconWarning = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 17c-.77 1.333.192 3 1.732 3z" /></svg>;

const MARKETPLACES = {
  shopee: {
    name: 'Shopee',
    color: 'bg-[#EE4D2D]',
    commission: 0.20,
    fixedFee: 4.0,
    description: 'Volume alto! Ótimo para o Agreste.',
    rules: "Baseado no Frete Grátis Extra (Janeiro/2026)."
  },
  mercadolivre: {
    name: 'Mercado Livre',
    color: 'bg-[#FFE600]',
    textColor: 'text-slate-800',
    commission: 0.175,
    fixedFee: 6.0,
    freeShippingThreshold: 79,
    estimatedShipping: 25.0,
    description: 'Maior confiança do Brasil.',
    rules: "Anúncio Premium com frete grátis acima de R$ 79."
  },
  shein: {
    name: 'Shein Brasil',
    color: 'bg-black',
    commission: 0.10,
    fixedFee: 0,
    description: 'A gigante da moda atual.',
    rules: "Foco total em vestuário e fotos padrão revista."
  }
} as const;

type MarketplaceKey = keyof typeof MARKETPLACES;

interface CalculationResult {
  finalPrice: number;
  mktCommission: number;
  fixedFee: number;
  shipping: number;
  net: number;
}

export default function App() {
  const [step, setStep] = useState('select'); 
  const [selectedMkt, setSelectedMkt] = useState<MarketplaceKey | null>(null);
  const [targetValue, setTargetValue] = useState('');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [lead, setLead] = useState({ name: '', whatsapp: '', type: 'fabricante' });

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Salvar lead no Supabase
      const { error } = await supabase
        .from('leads')
        .insert([
          {
            name: lead.name,
            whatsapp: lead.whatsapp,
            type: lead.type,
            marketplace: selectedMkt,
            created_at: new Date().toISOString()
          }
        ]);

      if (error) {
        console.error('Erro ao salvar lead:', error);
        // Continua mesmo se houver erro no salvamento
      }
    } catch (err) {
      console.error('Erro na requisição:', err);
    }

    setStep('calc');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const calculatePrice = () => {
    const net = parseFloat(targetValue);
    if (isNaN(net) || net <= 0 || !selectedMkt) return;

    const mkt = MARKETPLACES[selectedMkt];
    let price = 0;
    let details: Omit<CalculationResult, 'finalPrice' | 'net'> = { mktCommission: 0, fixedFee: 0, shipping: 0 };

    if (selectedMkt === 'shopee') {
      price = (net + mkt.fixedFee) / (1 - mkt.commission);
      if (price * mkt.commission > 100) price = net + 100 + mkt.fixedFee;
      details = { mktCommission: Math.min(price * mkt.commission, 100), fixedFee: mkt.fixedFee, shipping: 0 };
    } 
    else if (selectedMkt === 'mercadolivre') {
      price = (net + mkt.fixedFee) / (1 - mkt.commission);
      if (price >= mkt.freeShippingThreshold) {
        price = (net + mkt.estimatedShipping) / (1 - mkt.commission);
        details = { mktCommission: price * mkt.commission, fixedFee: 0, shipping: mkt.estimatedShipping };
      } else {
        details = { mktCommission: price * mkt.commission, fixedFee: mkt.fixedFee, shipping: 0 };
      }
    }
    else if (selectedMkt === 'shein') {
      price = net / (1 - mkt.commission);
      details = { mktCommission: price * mkt.commission, fixedFee: 0, shipping: 0 };
    }

    setResult({ finalPrice: price, ...details, net: net });
    setStep('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const reset = () => {
    setStep('select');
    setSelectedMkt(null);
    setTargetValue('');
    setResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-md">
        
        {/* Header Demas Assessoria */}
        <header className="mb-10 text-center">
          <div className="bg-indigo-950 text-white py-1.5 px-6 rounded-full inline-block mb-4 text-[10px] font-bold uppercase tracking-[0.2em]">
            Demas Assessoria & Logística
          </div>
          <h1 className="text-3xl font-black text-slate-900 leading-tight italic">
            CALCULA<span className="text-indigo-600">DEMA$</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">Estratégia do Agreste para o mundo.</p>
        </header>

        {/* STEP: SELECT */}
        {step === 'select' && (
          <div className="space-y-4 animate-fadeIn">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 text-center">Onde vamos vender?</h2>
            <div className="grid gap-3">
              {Object.entries(MARKETPLACES).map(([key, mkt]) => (
                <button
                  key={key}
                  onClick={() => { setSelectedMkt(key as MarketplaceKey); setStep('lead'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className={`${mkt.color} ${'textColor' in mkt ? mkt.textColor : 'text-white'} p-6 rounded-3xl shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-between group`}
                >
                  <div className="text-left">
                    <span className="text-2xl font-black block leading-none mb-1">{mkt.name}</span>
                    <span className="text-[11px] opacity-80 font-medium uppercase tracking-wider">{mkt.description}</span>
                  </div>
                  <div className="bg-white/20 p-2 rounded-full"><IconShopping /></div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP: LEAD FORM */}
        {step === 'lead' && (
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 animate-slideUp">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3">
                <IconUser />
              </div>
              <h2 className="text-xl font-black text-slate-800">Fala, parceiro(a)!</h2>
              <p className="text-sm text-slate-500">Bota teu contato pra gente liberar o cálculo.</p>
            </div>

            <form onSubmit={handleLeadSubmit} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Seu Nome / Empresa</label>
                <input required type="text" value={lead.name} onChange={(e) => setLead({ ...lead, name: e.target.value })}
                  placeholder="Ex: Confecção Style" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 outline-none transition-all font-medium" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">WhatsApp</label>
                <input required type="tel" value={lead.whatsapp} onChange={(e) => setLead({ ...lead, whatsapp: e.target.value })}
                  placeholder="(81) 9...." className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 outline-none transition-all font-medium" />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button type="button" onClick={() => setLead({...lead, type: 'fabricante'})}
                  className={`py-3 rounded-xl text-xs font-bold transition-all border-2 ${lead.type === 'fabricante' ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-100 text-slate-400'}`}>
                  SOU FABRICANTE
                </button>
                <button type="button" onClick={() => setLead({...lead, type: 'lojista'})}
                  className={`py-3 rounded-xl text-xs font-bold transition-all border-2 ${lead.type === 'lojista' ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-100 text-slate-400'}`}>
                  SOU LOJISTA
                </button>
              </div>
              <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all uppercase tracking-widest text-sm">
                LIBERAR CALCULADORA
              </button>
            </form>
          </div>
        )}

        {/* STEP: CALC */}
        {step === 'calc' && (
          <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 animate-fadeIn">
            <div className="flex items-center gap-4 mb-10">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg text-white ${MARKETPLACES[selectedMkt].color}`}>
                <IconCalc />
              </div>
              <div>
                <h2 className="font-black text-2xl tracking-tighter">Meta no Bolso</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{MARKETPLACES[selectedMkt].name}</p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-sm font-black text-slate-700 block ml-1 text-center">
                  Quanto você quer ganhar por peça?
                </label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-300 text-2xl">R$</span>
                  <input autoFocus type="number" value={targetValue} onChange={(e) => setTargetValue(e.target.value)}
                    placeholder="0,00" className="w-full pl-16 pr-6 py-8 bg-slate-50 border-b-4 border-slate-200 rounded-3xl text-4xl font-black focus:border-indigo-600 outline-none transition-all text-slate-800" />
                </div>
                <p className="text-[10px] text-slate-400 text-center leading-relaxed font-medium">
                  (Custo da peça + Seu Lucro pretendido)
                </p>
              </div>
              
              <button onClick={calculatePrice} disabled={!targetValue || parseFloat(targetValue) <= 0}
                className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black text-lg shadow-2xl hover:bg-indigo-600 disabled:opacity-20 transition-all">
                GERAR PREÇO FINAL
              </button>
              <button onClick={() => setStep('select')} className="w-full text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                Mudar Marketplace
              </button>
            </div>
          </div>
        )}

        {/* STEP: RESULT */}
        {step === 'result' && result && (
          <div className="animate-zoomIn">
            <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
              <div className={`${MARKETPLACES[selectedMkt].color} p-12 text-center text-white`}>
                <p className="text-[10px] uppercase tracking-[0.3em] font-black opacity-70 mb-2">Preço de Anúncio</p>
                <h3 className="text-6xl font-black tracking-tighter leading-none">
                  R$ {result.finalPrice.toFixed(2).replace('.', ',')}
                </h3>
              </div>

              <div className="p-10 space-y-8">
                <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl flex items-center gap-4">
                  <div className="bg-emerald-500 p-1.5 rounded-full text-white"><IconCheck /></div>
                  <p className="text-sm font-black text-emerald-800">
                    Você recebe: R$ {result.net.toFixed(2)}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest px-2">
                    <span>Taxas Retidas</span>
                    <span>Valor</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium text-slate-600 bg-slate-50 p-3 rounded-xl">
                      <span>Comissão {MARKETPLACES[selectedMkt].name}</span>
                      <span className="text-red-500 font-bold">- R$ {result.mktCommission.toFixed(2)}</span>
                    </div>
                    {result.fixedFee > 0 && (
                      <div className="flex justify-between text-sm font-medium text-slate-600 bg-slate-50 p-3 rounded-xl">
                        <span>Taxa Fixa (Peça)</span>
                        <span className="text-red-500 font-bold">- R$ {result.fixedFee.toFixed(2)}</span>
                      </div>
                    )}
                    {result.shipping > 0 && (
                      <div className="flex justify-between text-sm font-bold text-orange-700 bg-orange-50 p-3 rounded-xl border border-orange-100">
                        <span className="flex items-center gap-1"><IconWarning /> Frete Grátis</span>
                        <span className="text-red-600">- R$ {result.shipping.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-indigo-50 p-6 rounded-3xl text-center">
                   <p className="text-xs font-bold text-indigo-900 mb-4 leading-relaxed">
                     Achou o valor alto? A Demas te ajuda a reduzir custos de frete e operação para ser mais competitivo.
                   </p>
                   <button className="w-full py-4 bg-[#25D366] text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-green-100 text-sm">
                      CHAMAR CONSULTOR NO ZAP
                   </button>
                </div>

                <button onClick={reset} className="w-full text-slate-300 text-[10px] font-black uppercase tracking-widest">
                  Novo cálculo
                </button>
              </div>
            </div>
          </div>
        )}

        <footer className="mt-12 text-center opacity-30 group hover:opacity-100 transition-opacity">
          <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
            Desenvolvido por Demas Assessoria & Logística
          </p>
          <p className="text-[9px] font-bold text-slate-400 mt-1 italic">
            "Do Agreste para o mundo"
          </p>
        </footer>
      </div>
    </div>
  );
}