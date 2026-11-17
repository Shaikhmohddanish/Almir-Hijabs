"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";

export type SwitcherGroup = { id: string; name: string; href: string; items: { name: string; detail: string; href: string }[] };

// Tabs over ruled rows. Without script every panel shows in order with its own title;
// once mounted, the container is marked enhanced and only the active panel shows.
export default function CollectionSwitcher({ groups }: { groups: SwitcherGroup[] }) {
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (root.current) root.current.dataset.enhanced = "true";
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (active + step + groups.length) % groups.length;
    setActive(next);
    tabs.current[next]?.focus();
  };

  return (
    <div className="switch" ref={root}>
      <div className="tabs" role="tablist" aria-label="Collections">
        {groups.map((g, i) => (
          <button
            key={g.id}
            ref={(node) => {
              tabs.current[i] = node;
            }}
            type="button"
            role="tab"
            id={`tab-${g.id}`}
            className="tab"
            aria-selected={i === active}
            aria-controls={`panel-${g.id}`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={onKeyDown}
          >
            {g.name}
          </button>
        ))}
      </div>
      {groups.map((g, i) => (
        <section key={g.id} id={`panel-${g.id}`} role="tabpanel" aria-labelledby={`tab-${g.id}`} className={i === active ? "panel is-active" : "panel"}>
          <h3 className="panel__title">{g.name}</h3>
          <ul className="rows">
            {g.items.map((item) => (
              <li className="row" key={item.name}>
                <h4 className="row__name"><a href={item.href}>{item.name}</a></h4>
                <p className="row__detail">{item.detail}</p>
              </li>
            ))}
          </ul>
          <p className="panel__more"><a className="link" href={g.href}>See all {g.name.toLowerCase()}</a></p>
        </section>
      ))}
    </div>
  );
}
