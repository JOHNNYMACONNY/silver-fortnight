import React from 'react';
import { Connection } from '../../../services/firestore-exports';
import ConnectionCard from './ConnectionCard';
import { Card, CardContent } from '../../ui/Card';

interface ConnectionsListProps {
  connections: Connection[];
  currentUserId: string;
  onAccept?: (connectionId: string) => void;
  onReject?: (connectionId: string) => void;
  onRemove?: (connectionId: string) => void;
  emptyMessage?: string;
}

export const ConnectionsList: React.FC<ConnectionsListProps> = ({
  connections,
  currentUserId,
  onAccept,
  onReject,
  onRemove,
  emptyMessage = 'No connections found'
}) => {
  if (!connections || connections.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          {emptyMessage}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {connections.map((connection) => (
        <ConnectionCard
          key={connection.id}
          connection={connection}
          currentUserId={currentUserId}
          onAccept={onAccept}
          onReject={onReject}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
};

export default ConnectionsList;
