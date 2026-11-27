import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Entry = { _id?: string; teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<Entry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ leaderboard: Entry[] }>('/api/leaderboard')
      .then(({ leaderboard }) => {
        if (active) setLeaderboard(leaderboard);
      })
      .catch((cause: unknown) => {
        if (active) setError(`Unable to load leaderboard: ${cause instanceof Error ? cause.message : 'Unexpected error'}`);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <CapabilityCard title="Leaderboard" description="Compare team point totals.">
      {error ? (
        <p role="alert">{error}</p>
      ) : leaderboard === null ? (
        <p role="status">Loading leaderboard...</p>
      ) : leaderboard.length === 0 ? (
        <p role="status">No leaderboard rankings yet.</p>
      ) : (
        <ol className="list-group list-group-numbered">
          {leaderboard.map((entry, index) => (
            <li className="list-group-item" key={entry._id ?? index}>
              <strong>{entry.teamName}</strong> — {entry.totalPoints} points
            </li>
          ))}
        </ol>
      )}
    </CapabilityCard>
  );
}
