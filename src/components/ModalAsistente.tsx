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
      text: '¡Hola! Soy tu asistente de secretaría y management. Puedo ayudarte a redactar respuestas a clientes, armar seguimientos de fechas pendientes, organizar tu semana o darte ideas de contenido.',
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
    const djName = state.perfil.nombre || 'DJ';
    const currency = state.perfil.moneda || '$';
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
          `- ${f.fecha || 's/f'}: ${f.lugar} (${f.estado}, ticket: ${money(
            f.ticket,
            currency
          )}, contacto: ${f.contacto || 'n/a'})`
      )
      .join('\n');

    return `Eres la asistente y manager comercial del DJ ${djName} (Perú / Latinoamérica).
Tu tono es profesional, ágil, resolutivo y directo.
Utilizas terminología de la industria de eventos y vida nocturna cuando corresponde (adelanto/seña, fecha, club, discoteca, corporativo, ticket/tarifa, set, cabina, Yape/Plin/transferencia), con excelente trato comercial.

Contexto actual del DJ:
- Nombre: ${djName}
- Moneda: ${currency}
- Facturado este mes: ${money(factMes, currency)}
- Fechas confirmadas/reservadas próximas: ${ganadas.length}
- Consultas abiertas pendientes de cierre: ${consultas.length}

Últimas fechas registradas:
${fechasContext || '(sin fechas aún)'}

Instrucciones:
1. Si te piden redactar un mensaje para un cliente o local, entrega el texto listo para copiar y enviar por WhatsApp.
2. Si te piden consejos de seguimiento o cobro, indícales exactamente a quién escribirle y qué mensaje enviar.
3. Responde con respuestas concisas, estructuradas y fáciles de leer.`;
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
      lugar: parsedData.lugar || 'Evento',
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

    onShowToast('Fecha creada desde chat ✓');
    setParsedData(null);
    setParseText('');
    onClose();
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="modal modal-ai"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '560px' }}
      >
        <div className="modal-head">
          <h2>Secretaría & Asistente IA</h2>
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
            Secretaría (Chat)
          </button>
          <button
            type="button"
            className={`ai-tab ${subTab === 'parse' ? 'active' : ''}`}
            onClick={() => setSubTab('parse')}
          >
            Pegar chat ➔ Crear fecha
          </button>
        </div>

        {subTab === 'chat' ? (
          <>
            <div className="ai-quick">
              <button
                type="button"
                onClick={() =>
                  handleSendMessage('Redactar respuesta para pasar presupuesto a un cliente que consulta por un cumple de 15')
                }
              >
                💬 Redactar presupuesto
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSendMessage('¿A quién le hago seguimiento hoy según mis fechas abiertas?')
                }
              >
                🎯 Seguimiento hoy
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSendMessage('Organizá mi semana de DJ comercial y fechas')
                }
              >
                📅 Plan de la semana
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSendMessage('5 ideas de reels o contenido para esta semana')
                }
              >
                💡 5 ideas de contenido
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
                <div className="ai-typing">Secretaría escribiendo...</div>
              )}
              <div ref={threadEndRef} />
            </div>

            <div className="ai-input">
              <textarea
                rows={2}
                placeholder="Escribile a tu secretaría... (ej: 'redactá un recordatorio de saldo para el cliente')"
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
                className="btn sm"
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
              <label>Pegá acá la conversación de WhatsApp con el cliente o boliche</label>
              <textarea
                rows={6}
                placeholder={`Ejemplo:\n"Hola crack, te hablo de Club Velvet. Queremos ver si tenés libre el sábado 24 de agosto de 02:00 a 05:30. Tenemos un presupuesto de 200k. Avisame si te sirve."`}
                value={parseText}
                onChange={(e) => setParseText(e.target.value)}
              />
            </div>
            <button
              className="btn block"
              disabled={parsing || !parseText.trim()}
              onClick={handleParseChat}
              style={{ marginBottom: '14px' }}
            >
              {parsing ? 'Interpretando con IA...' : '✨ Interpretar datos de la fecha'}
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
                  Datos detectados:
                </span>
                <div style={{ fontSize: '14px', lineHeight: 1.6 }}>
                  <div><b>Lugar:</b> {parsedData.lugar || '—'}</div>
                  <div><b>Fecha:</b> {parsedData.fecha || '—'}</div>
                  <div><b>Horario:</b> {parsedData.horario || '—'}</div>
                  <div><b>Contacto:</b> {parsedData.contacto || '—'}</div>
                  <div><b>Ticket:</b> ${parsedData.ticket?.toLocaleString('es-AR') || '0'}</div>
                  {parsedData.notas && <div><b>Notas:</b> {parsedData.notas}</div>}
                </div>
                <button
                  className="btn block sm"
                  style={{ marginTop: '12px' }}
                  onClick={handleSaveParsedDate}
                >
                  ＋ Guardar esta fecha en el CRM
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
