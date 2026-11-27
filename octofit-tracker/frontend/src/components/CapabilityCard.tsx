import { useEffect, useState, type ReactNode } from 'react';
import { getJson } from '../api/client.js';

type DataItem = Record<string, unknown>;
type Props = {
  title: string;
  description: string;
  endpoint: string;
  responseKey: string;
  emptyMessage: string;
  renderItem: (item: DataItem) => ReactNode;
};

function isRecord(value: unknown): value is DataItem {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isRecordArray(value: unknown): value is DataItem[] {
  return Array.isArray(value) && value.every(isRecord);
}

export function CapabilityCard({ title, description, endpoint, responseKey, emptyMessage, renderItem }: Props) {
  const [items, setItems] = useState<DataItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setItems(null);
    setError(null);

    getJson<unknown>(endpoint)
      .then((response) => {
        if (!isRecord(response) || !isRecordArray(response[responseKey])) {
          throw new Error('Invalid response from server');
        }
        if (active) setItems(response[responseKey]);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        const detail = cause instanceof Error ? cause.message : 'Unexpected error';
        setError(`Unable to load ${title.toLowerCase()}: ${detail}`);
      });

    return () => {
      active = false;
    };
  }, [endpoint, responseKey, title]);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {error ? (
          <p role="alert">{error}</p>
        ) : items === null ? (
          <p role="status">Loading {title.toLowerCase()}...</p>
        ) : items.length === 0 ? (
          <p role="status">{emptyMessage}</p>
        ) : (
          <ul className="list-group list-group-flush">
            {items.map((item, index) => {
              const id = item._id;
              const key = typeof id === 'string' || typeof id === 'number' ? id : index;
              return <li className="list-group-item" key={key}>{renderItem(item)}</li>;
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
