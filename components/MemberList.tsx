'use client';

import { useState } from 'react';
import type { User } from '@/lib/db';

export function MemberList({ members }: { members: User[] }) {
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
