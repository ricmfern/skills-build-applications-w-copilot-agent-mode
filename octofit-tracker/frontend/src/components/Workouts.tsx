import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Workout = { _id?: string; title: string; reason?: string };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<Workout[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ suggestions: Workout[] }>('/api/workouts/suggestions/mona%40example.com')
      .then(({ suggestions }) => {
        if (active) setSuggestions(suggestions);
      })
      .catch((cause: unknown) => {
        if (active) setError(`Unable to load workout suggestions: ${cause instanceof Error ? cause.message : 'Unexpected error'}`);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns.">
      {error ? (
        <p role="alert">{error}</p>
      ) : suggestions === null ? (
        <p role="status">Loading workout suggestions...</p>
      ) : suggestions.length === 0 ? (
        <p role="status">No workout suggestions yet.</p>
      ) : (
        <ul className="list-group list-group-flush">
          {suggestions.map((workout, index) => (
            <li className="list-group-item" key={workout._id ?? index}>
              <strong>{workout.title}</strong>{workout.reason ? ` — ${workout.reason}` : ''}
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
