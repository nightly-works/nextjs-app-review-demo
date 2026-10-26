'use client';

import { useState } from 'react';
export function MemberList({ members }: { members: { id: string; name: string }[] }) {
  const [filter, setFilter] = useState('');
  const shown = members.filter((m) => m.name.toLowerCase().includes(filter.toLowerCase()));
  return (
    <section>
      <h2>Team</h2>
      <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter" />
      <ul>
        {shown.map((m) => (
          <li key={m.id}>{m.name}</li>
        ))}
      </ul>
    </section>
  );
}
