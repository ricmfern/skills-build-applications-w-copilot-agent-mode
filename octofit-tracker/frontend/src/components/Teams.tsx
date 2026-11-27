import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = { _id?: string; name: string; mascot?: string; members?: string[] };

export default function Teams() {
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ teams: Team[] }>('/api/teams')
      .then(({ teams }) => {
        if (active) setTeams(teams);
      })
      .catch((cause: unknown) => {
        if (active) setError(`Unable to load teams: ${cause instanceof Error ? cause.message : 'Unexpected error'}`);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <CapabilityCard title="Teams" description="Manage teams and members.">
      {error ? (
        <p role="alert">{error}</p>
      ) : teams === null ? (
        <p role="status">Loading teams...</p>
      ) : teams.length === 0 ? (
        <p role="status">No teams yet.</p>
      ) : (
        <ul className="list-group list-group-flush">
          {teams.map((team, index) => (
            <li className="list-group-item" key={team._id ?? index}>
              <strong>{team.name}</strong>{team.mascot ? ` — ${team.mascot}` : ''}
              {team.members?.length ? ` · ${team.members.length} members` : ''}
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
