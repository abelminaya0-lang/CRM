import React from 'react';

export type TabId = 'panel' | 'fechas' | 'calendario' | 'stats' | 'objetivos' | 'pagos' | 'finanzas' | 'notas';

interface NavTabsProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  pendingRemindersCount: number;
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'panel', label: 'Panel' },
  { id: 'fechas', label: 'Rodajes & Clientes' },
  { id: 'calendario', label: 'Calendario' },
  { id: 'stats', label: 'Estadísticas' },
  { id: 'objetivos', label: 'Objetivos' },
  { id: 'pagos', label: 'Pagos & Cobros' },
  { id: 'finanzas', label: 'Finanzas' },
  { id: 'notas', label: 'Guiones & Notas' },
];

export const NavTabs: React.FC<NavTabsProps> = ({
  activeTab,
  onSelectTab,
  pendingRemindersCount,
}) => {
  return (
    <nav className="nav mb-6" id="nav">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          data-tab={tab.id}
          className={activeTab === tab.id ? 'active' : ''}
          onClick={() => onSelectTab(tab.id)}
        >
          {tab.label}
          {tab.id === 'notas' && pendingRemindersCount > 0 && (
            <span className="rec-badge">{pendingRemindersCount}</span>
          )}
        </button>
      ))}
    </nav>
  );
};
