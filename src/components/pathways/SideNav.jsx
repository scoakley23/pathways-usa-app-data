import React from 'react';
import { Link } from 'react-router-dom';
import { Amio } from '@/components/pathways/Amio';
import { TABS } from '@/components/pathways/BottomTabs';

// The desktop side menu (desktop vision A, "Amio at your side"): from 1024px
// wide it replaces the bottom tabs and the header's tab pills. Amio with the
// "amio" wordmark (the wordmark is allowed here on desktop and on Launch
// only), then Today · Course · Interview · Me; the open tab is navy with
// white text. `badges` shows a count next to a tab, e.g. { me: 2 }.
export default function SideNav({ active, labels = {}, badges = {}, unreadLabel = 'unread notifications', className = '' }) {
  return (
    <nav
      aria-label="Main"
      className={`fixed inset-y-0 start-0 z-40 w-[232px] border-e border-line bg-paper px-4 py-8 flex-col gap-1.5 ${className}`}
    >
      <Link to="/" aria-label="Amio" className="mb-6 flex items-center gap-2.5 rounded-button px-3 min-h-tap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy">
        <Amio size={40} />
        <span className="font-display text-[1.625rem] leading-none tracking-[-0.03em]" aria-hidden="true">amio</span>
      </Link>
      {TABS.map((tab) => {
        const on = tab.id === active;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.id}
            to={tab.path}
            aria-current={on ? 'page' : undefined}
            className={`flex items-center gap-3 min-h-[3rem] rounded-button px-3.5 text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-paper ${on ? 'bg-navy text-white font-bold' : 'text-navy font-semibold hover:bg-line-soft'}`}
          >
            <Icon className="w-[22px] h-[22px] shrink-0" strokeWidth={2} active={on} />
            <span className="truncate">{labels[tab.id] || tab.label}</span>
            {badges[tab.id] > 0 && (
              <span className={`ms-auto min-w-6 h-6 px-1.5 rounded-button text-xs font-bold grid place-items-center ${on ? 'bg-white text-navy' : 'bg-denim text-white'}`}>
                {badges[tab.id]}<span className="sr-only"> {unreadLabel}</span>
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
