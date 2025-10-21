import React from 'react';
import { ChangeRequest } from '../../../services/firestore-exports';
import { formatDate, getRelativeTimeString } from '../../../utils/dateUtils';
import { motion } from 'framer-motion';
import { cn } from '../../../utils/cn';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { Badge } from '../../ui/Badge';

interface ChangeRequestHistoryProps {
  changeRequests: ChangeRequest[];
  className?: string;
}

/**
 * Component to display the history of change requests for a trade
 */
const ChangeRequestHistory: React.FC<ChangeRequestHistoryProps> = ({
  changeRequests,
  className = ''
}) => {
  if (!changeRequests || changeRequests.length === 0) {
    return null;
  }

  // Sort change requests by date (newest first)
  const sortedRequests = [...changeRequests].sort((a, b) => {
    const dateA = a.requestedAt ? new Date(a.requestedAt.seconds * 1000) : new Date();
    const dateB = b.requestedAt ? new Date(b.requestedAt.seconds * 1000) : new Date();
    return dateB.getTime() - dateA.getTime();
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'default';
      case 'addressed':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Change Request History</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {sortedRequests.map((request) => (
              <li key={request.id} className="py-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center mb-2">
                      <Badge variant={getStatusVariant(request.status)}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {request.requestedAt && getRelativeTimeString(new Date(request.requestedAt.seconds * 1000))}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">
                      Changes Requested on {request.requestedAt && formatDate(new Date(request.requestedAt.seconds * 1000))}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground whitespace-pre-line">
                      {request.reason}
                    </p>
                  </div>
                </div>
                
                {request.resolvedAt && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      {request.status === 'addressed' ? 'Addressed' : 'Rejected'} on {formatDate(new Date(request.resolvedAt.seconds * 1000))}
                    </p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ChangeRequestHistory;
