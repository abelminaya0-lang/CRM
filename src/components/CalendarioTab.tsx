import React, { useState } from 'react';
import { DJState } from '../types';
import { DOW, ESTADOS, MESES_LARGO, todayISO } from '../utils/crmData';

interface CalendarioTabProps {
  state: DJState;
  onOpenFecha: (id?: string | null, prefillDate?: string) => void;
}

export const CalendarioTab: React.FC<CalendarioTabProps> = ({
  state,
  onOpenFecha,
}) => {
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const title = `${MESES_LARGO[month]} ${year}`;

  const handlePrev = () => {
    const prev = new Date(year, month - 1, 1);
    setCurrentDate(prev);
  };

  const handleNext = () => {
    const next = new Date(year, month + 1, 1);
    setCurrentDate(next);
  };

  // Calendar math
  const first = new Date(year, month, 1);
  const startDow = (first.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = todayISO();

  const handleDayClick = (iso: string) => {
    const dayGigs = state.fechas.filter((f) => f.fecha === iso);
    if (dayGigs.length === 0) {
      onOpenFecha(null, iso);
    } else {
      onOpenFecha(dayGigs[0].id);
    }
  };

  return (
    <section className="screen active" id="tab-calendario">
      <div className="card">
        <div className="cal-head">
          <button className="iconbtn" id="calPrev" onClick={handlePrev}>
            ←
          </button>
          <div className="cal-title" id="calTitle">
            {title}
          </div>
          <button className="iconbtn" id="calNext" onClick={handleNext}>
            →
          </button>
        </div>

        <div className="cal-grid" id="calGrid">
          {DOW.map((d) => (
            <div key={d} className="cal-dow">
              {d}
            </div>
          ))}

          {/* Blank start cells */}
          {Array.from({ length: startDow }).map((_, i) => (
            <div key={`blank-${i}`} className="cal-cell blank" />
          ))}

          {/* Days of current month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(
              dayNum
            ).padStart(2, '0')}`;
            const isToday = iso === todayStr;
            const dayGigs = state.fechas
              .filter((f) => f.fecha === iso)
              .sort((a, b) => (a.horario || '').localeCompare(b.horario || ''));

            return (
              <div
                key={iso}
                className={`cal-cell ${isToday ? 'today' : ''}`}
                onClick={() => handleDayClick(iso)}
              >
                <span className="cd">{dayNum}</span>
                {dayGigs.slice(0, 2).map((f) => {
                  const est = ESTADOS[f.estado] || ESTADOS.consulta;
                  return (
                    <div
                      key={f.id}
                      className="cal-chip"
                      style={{ borderLeftColor: est.dot }}
                      title={f.lugar}
                    >
                      {f.lugar || 'Fecha'}
                    </div>
                  );
                })}
                {dayGigs.length > 2 && (
                  <span className="cal-more">+{dayGigs.length - 2} más</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
