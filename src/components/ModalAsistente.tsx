import React, { useState, useRef, useEffect } from 'react';
import { AiMessage, DJState, FechaGig } from '../types';
import { GANADAS, money, monthKey, todayISO, uid } from '../utils/crmData';

interface ModalAsistenteProps {
  isOpen: boolean;
  onClose: () => void;
  state: DJState;
  onUpdateState: (updater: (prev: DJState) => DJState) => void;
  onShowToast: (msg: string) => void;
}

export const ModalAsistente: React.FC<ModalAsistenteProps> = ({
  isOpen,
  onClose,
  state,
  onUpdateState,
  onShowToast,
}) => {
  const [subTab, setSubTab] = useState<'chat' | 'parse'>('chat');
  const [messages, setMessages] = useState<AiMessage[]>([
    {
      role: 'bot',
      text: '¡Hola! Soy el Asistente Estratégico de IVA CREATIVA. Te ayudo a escribir guiones con ganchos (hooks) virales para TikTok, redactar propuestas comerciales para negocios por WhatsApp, hacer seguimiento de rodajes y calcular presupuestos.',
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);

  // Parse tab state
  const [parseText, setParseText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState<Partial<FechaGig> | null>(null);

  const threadEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (threadEndRef.current) {
      threadEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  if (!isOpen) return null;

  const buildSystemPrompt = () => {
    const agencyName = state.perfil.nombre || 'IVA CREATIVA';
    const currency = state.perfil.moneda || 'S/';
    const todayStr = todayISO();
    const mk = todayStr.slice(0, 7);

    const factMes = state.pagos
      .filter((p) => monthKey(p.fecha) === mk)
      .reduce((a, p) => a + (+p.monto || 0), 0);

    const ganadas = state.fechas.filter(
      (f) => GANADAS.includes(f.estado) && f.fecha >= todayStr
    );
    const consultas = state.fechas.filter((f) => f.estado === 'consulta');

    const fechasContext = state.fechas
      .slice(0, 10)
      .map(
        (f) =>
          `- ${f.fecha || 's/f'}: ${f.lugar} (${f.estado}, paquete: ${money(
            f.ticket,
            currency
          )}, contacto: ${f.contacto || 'n/a'})`
      )
      .join('\n');

    return `Eres el Director Creativo y Asistente Comercial de "${agencyName}", una agencia especializada en producción de contenido de videos de TikTok y Reels para negocios y marcas (Perú / Latinoamérica).
Tu tono es moderno, estratégico, persuasivo, orientado a ventas y retención viral en TikTok.
Utilizas terminología de producción y marketing digital (Hooks/Ganchos de 3s, Retención, Escaleta, B-Roll, UGC, Llamado a la Acción / CTA, Paquete de 8/12/16 videos, Rodaje Full Day, Adelanto 50%, Yape/Plin/Transferencia BCP).

Contexto actual de la agencia:
- Marca: ${agencyName}
- Moneda: ${currency}
- Facturado este mes: ${money(factMes, currency)}
- Rodajes activos agendados/confirmados: ${ganadas.length}
- Negocios en prospección/consulta: ${consultas.length}

Clientes y rodajes recientes:
${fechasContext || '(sin clientes aún)'}

Instrucciones:
1. Si te piden un GUION para un nicho (ej: restaurante, odontología, ropa, gimnasio), estructura el guion con:
   - Gancho (0 a 3s) visual y verbal de alta curiosidad o solución a un problema.
   - Desarrollo rápido (3 a 25s) con tomas sugeridas (B-Roll).
   - Llamado a la acción (CTA) claro a WhatsApp o perfil.
2. Si te piden un MENSAJE COMERCIAL para WhatsApp, redacta un texto profesional, cálido y persuasivo listo para copiar y enviar.
3. Brinda respuestas claras, estructuradas y directamente aplicables al negocio.`;
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text || loading) return;

    const userMsg: AiMessage = { role: 'user', text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputVal('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: buildSystemPrompt(),
          messages: newMessages.map((m) => ({
            role: m.role === 'user' ? 'user' : 'model',
            content: m.text,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Error de servidor al consultar IA');
      }

      const data = await response.json();
      const replyText = data.text || '(sin respuesta)';
      setMessages((prev) => [...prev, { role: 'bot', text: replyText }]);
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: `⚠️ Hubo un error: ${err.message || 'No se pudo conectar con el asistente'}.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    onShowToast('Copiado al portapapeles ✓');
  };

  const handleParseChat = async () => {
    const raw = parseText.trim();
    if (!raw || parsing) return;

    setParsing(true);
    setParsedData(null);

    try {
      const response = await fetch('/api/ai/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: raw,
          currentYear: new Date().getFullYear(),
        }),
      });

      if (!response.ok) throw new Error('Error al interpretar mensaje');
      const data = await response.json();
      setParsedData(data);
    } catch (err: any) {
      console.error(err);
      onShowToast('Error al interpretar el texto con IA');
    } finally {
      setParsing(false);
    }
  };

  const handleSaveParsedDate = () => {
    if (!parsedData || !parsedData.lugar) return;

    const newGig: FechaGig = {
      id: uid(),
      creado: Date.now(),
      lugar: parsedData.lugar || 'Cliente / Negocio',
      fecha: parsedData.fecha || todayISO(),
      horario: parsedData.horario || '',
      contacto: parsedData.contacto || '',
      ticket: +parsedData.ticket || 0,
      sena: 0,
      estado: 'consulta',
      notas: parsedData.notas || '',
    };

    onUpdateState((prev) => ({
      ...prev,
      fechas: [newGig, ...prev.fechas],
    }));

    onShowToast('Cliente agendado desde WhatsApp ✓');
    setParsedData(null);
    setParseText('');
    onClose();
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="modal modal-ai"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '580px' }}
      >
        <div className="modal-head">
          <h2>IA Guiones, Ventas & Rodajes</h2>
          <button className="x" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="ai-tabs">
          <button
            type="button"
            className={`ai-tab ${subTab === 'chat' ? 'active' : ''}`}
            onClick={() => setSubTab('chat')}
          >
            Director IA (Guiones & Ventas)
          </button>
          <button
            type="button"
            className={`ai-tab ${subTab === 'parse' ? 'active' : ''}`}
            onClick={() => setSubTab('parse')}
          >
            Pegar WhatsApp ➔ Agendar Cliente
          </button>
        </div>

        {subTab === 'chat' ? (
          <>
            <div className="ai-quick">
              <button
                type="button"
                onClick={() =>
                  handleSendMessage('Escribe 3 guiones de 30s con hooks virales para un restaurante de carnes y parrillas que quiere más comensales los fines de semana')
                }
              >
                🎬 Guiones con Hook Viral
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSendMessage('Redacta un mensaje de WhatsApp para enviar propuesta formal de Pack de 12 Videos TikTok (S/ 2,400) a un cliente de una clínica dental')
                }
              >
                💼 Propuesta Pack TikTok
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSendMessage('¿A qué clientes en estado consulta o con saldo pendiente debo hacerles seguimiento comercial hoy?')
                }
              >
                🎯 Seguimiento de Cierres
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSendMessage('Dame 5 ideas de formatos de video virales para negocios locales que generan alta retención en TikTok')
                }
              >
                💡 5 Formatos Virales
              </button>
            </div>

            <div className="ai-thread" id="aiThread">
              {messages.map((m, i) => (
                <div key={i} className={`ai-bubble ${m.role}`}>
                  {m.text}
                  {m.role === 'bot' && (
                    <button
                      type="button"
                      className="copybtn"
                      onClick={() => handleCopy(m.text)}
                    >
                      📋 Copiar texto
                    </button>
                  )}
                </div>
              ))}
              {loading && (
                <div className="ai-typing">IVA CREATIVA IA generando respuesta...</div>
              )}
              <div ref={threadEndRef} />
            </div>

            <div className="ai-input">
              <textarea
                rows={2}
                placeholder="Pide guiones, hooks de video, mensajes de cobro o propuestas comerciales..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <button
                className="btn sm bg-[#ef4444] text-white"
                disabled={loading}
                onClick={() => handleSendMessage()}
              >
                Enviar
              </button>
            </div>
          </>
        ) : (
          <div>
            <div className="field">
              <label>Pega aquí la conversación o mensaje del cliente de WhatsApp</label>
              <textarea
                rows={6}
                placeholder={`Ejemplo:\n"Hola IVA Creativa, somos del Restaurante El Carbón en Miraflores. Queremos cotizar un paquete de 12 TikToks para este mes. Podríamos grabar el jueves 15 de 10am a 2pm. Nuestro presupuesto es aprox S/ 2,400. Contáctame por aquí, soy Carlos 987654321"`}
                value={parseText}
                onChange={(e) => setParseText(e.target.value)}
              />
            </div>
            <button
              className="btn block bg-[#ef4444] text-white"
              disabled={parsing || !parseText.trim()}
              onClick={handleParseChat}
              style={{ marginBottom: '14px' }}
            >
              {parsing ? 'Interpretando con IA...' : '✨ Extraer datos del cliente & rodaje'}
            </button>

            {parsedData && (
              <div
                className="card pad-sm"
                style={{
                  background: 'var(--panel-2)',
                  borderColor: 'var(--accent)',
                  marginBottom: '14px',
                }}
              >
                <span className="eyebrow" style={{ marginBottom: '8px' }}>
                  Datos detectados del cliente:
                </span>
                <div style={{ fontSize: '14px', lineHeight: 1.6 }}>
                  <div><b>Cliente / Negocio:</b> {parsedData.lugar || '—'}</div>
                  <div><b>Fecha de Rodaje:</b> {parsedData.fecha || '—'}</div>
                  <div><b>Horario:</b> {parsedData.horario || '—'}</div>
                  <div><b>Contacto:</b> {parsedData.contacto || '—'}</div>
                  <div><b>Presupuesto / Tarifa:</b> S/ {parsedData.ticket?.toLocaleString('es-PE') || '0'}</div>
                  {parsedData.notas && <div><b>Notas del paquete:</b> {parsedData.notas}</div>}
                </div>
                <button
                  className="btn block sm bg-[#ef4444] text-white"
                  style={{ marginTop: '12px' }}
                  onClick={handleSaveParsedDate}
                >
                  ＋ Guardar este cliente en el Pipeline
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
