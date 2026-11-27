import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = { _id?: string; type: string; minutes: number; points: number };

export default function Activities() {
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ activities: Activity[] }>('/api/activities')
      .then(({ activities }) => {
        if (active) setActivities(activities);
      })
      .catch((cause: unknown) => {
        if (active) setError(`Unable to load activities: ${cause instanceof Error ? cause.message : 'Unexpected error'}`);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <CapabilityCard title="Activities" description="Track student activity minutes and points.">
      {error ? (
        <p role="alert">{error}</p>
      ) : activities === null ? (
        <p role="status">Loading activities...</p>
      ) : activities.length === 0 ? (
        <p role="status">No activities yet.</p>
      ) : (
        <ul className="list-group list-group-flush">
          {activities.map((activity, index) => (
            <li className="list-group-item" key={activity._id ?? index}>
              <strong>{activity.type}</strong> — {activity.minutes} minutes · {activity.points} points
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
