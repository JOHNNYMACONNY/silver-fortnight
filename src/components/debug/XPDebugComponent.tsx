import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { getUserXP } from '../../services/gamification';
import { initializeTestUserXP } from '../../utils/testXP';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Alert, AlertDescription, AlertTitle } from '../ui/Alert';
import { Loader2 } from 'lucide-react';

const XPDebugComponent: React.FC = () => {
  const { currentUser } = useAuth();
  const [xpData, setXpData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testGetUserXP = async () => {
    if (!currentUser?.uid) {
      setError('No user logged in');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getUserXP(currentUser.uid);
      if (result.success) {
        setXpData(result.data);
      } else {
        setError(result.error || 'Failed to get XP');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testAddXP = async () => {
    if (!currentUser?.uid) {
      setError('No user logged in');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await initializeTestUserXP(currentUser.uid);
      if (result.success) {
        await testGetUserXP();
      } else {
        setError(result.error || 'Failed to add test XP');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.uid) {
      testGetUserXP();
    } else {
      setError('User not logged in');
    }
  }, [currentUser?.uid]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>XP Debug Info</CardTitle>
      </CardHeader>
      <CardContent className="text-sm space-y-4">
        <div>
            <p><strong>Current User ID:</strong> {currentUser?.uid || 'None'}</p>
            <p><strong>User Email:</strong> {currentUser?.email || 'None'}</p>
        </div>

        {error && (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        {xpData && (
          <div>
            <p className="font-semibold mb-2"><strong>XP Data:</strong></p>
            <pre className="bg-muted p-2 rounded text-xs overflow-auto">
              {JSON.stringify(xpData, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="flex space-x-2">
            <Button 
              onClick={testGetUserXP}
              disabled={loading}
              variant="outline"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Test XP Fetch
            </Button>
            <Button 
              onClick={testAddXP}
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Test XP
            </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default XPDebugComponent;
