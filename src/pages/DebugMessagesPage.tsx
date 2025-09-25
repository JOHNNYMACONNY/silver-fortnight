/**
 * Debug Messages Page
 * 
 * This page provides debugging tools to check the database structure
 * and diagnose messaging issues.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { getSyncFirebaseDb } from '../firebase-config';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Alert, AlertDescription } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';

export const DebugMessagesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runDebugCheck = async () => {
    if (!currentUser) {
      setError('You must be logged in to run debug checks');
      return;
    }

    setLoading(true);
    setError(null);
    setDebugInfo(null);

    try {
      const db = getSyncFirebaseDb();
      const userId = currentUser.uid;

      console.log(`Running debug check for user: ${userId}`);

      // Check 1: Get all conversations (without filters)
      const allConversationsRef = collection(db, 'conversations');
      const allConversationsQuery = query(allConversationsRef, limit(10));
      const allConversationsSnapshot = await getDocs(allConversationsQuery);
      
      const allConversations = allConversationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Check 2: Get conversations with participantIds filter
      const participantConversationsRef = collection(db, 'conversations');
      const participantQuery = query(
        participantConversationsRef,
        where('participantIds', 'array-contains', userId),
        limit(10)
      );
      
      let participantConversations: any[] = [];
      try {
        const participantSnapshot = await getDocs(participantQuery);
        participantConversations = participantSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (participantError: any) {
        console.log('Participant query failed:', participantError.message);
      }

      // Check 3: Get conversations with participants filter (legacy)
      const legacyConversationsRef = collection(db, 'conversations');
      const legacyQuery = query(
        legacyConversationsRef,
        where('participants', 'array-contains', { id: userId }),
        limit(10)
      );
      
      let legacyConversations: any[] = [];
      try {
        const legacySnapshot = await getDocs(legacyQuery);
        legacyConversations = legacySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (legacyError: any) {
        console.log('Legacy query failed:', legacyError.message);
      }

      // Check 4: Check user's profile
      const userRef = collection(db, 'users');
      const userQuery = query(userRef, where('uid', '==', userId));
      const userSnapshot = await getDocs(userQuery);
      const userProfile = userSnapshot.docs.length > 0 ? userSnapshot.docs[0].data() : null;

      const debugData = {
        userId,
        timestamp: new Date().toISOString(),
        checks: {
          allConversations: {
            count: allConversations.length,
            data: allConversations
          },
          participantConversations: {
            count: participantConversations.length,
            data: participantConversations,
            error: participantConversations.length === 0 ? 'No conversations found with participantIds filter' : null
          },
          legacyConversations: {
            count: legacyConversations.length,
            data: legacyConversations,
            error: legacyConversations.length === 0 ? 'No conversations found with participants filter' : null
          },
          userProfile: {
            exists: !!userProfile,
            data: userProfile
          }
        }
      };

      setDebugInfo(debugData);
      console.log('Debug check completed:', debugData);

    } catch (err: any) {
      console.error('❌ Error running debug check:', err);
      setError(`Failed to run debug check: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <Alert variant="destructive">
              <AlertDescription>
                You must be logged in to run debug checks.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Debug Messages System</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            This tool will check the database structure and help diagnose messaging issues.
          </p>
          
          <Button 
            onClick={runDebugCheck} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Running Debug Check...' : 'Run Debug Check'}
          </Button>

          {debugInfo && (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  Debug check completed at {debugInfo.timestamp}
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">All Conversations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Badge variant="outline">
                        Count: {debugInfo.checks.allConversations.count}
                      </Badge>
                      {debugInfo.checks.allConversations.data.map((conv: any, index: number) => (
                        <div key={index} className="text-xs p-2 bg-muted rounded">
                          <div><strong>ID:</strong> {conv.id}</div>
                          <div><strong>Type:</strong> {conv.type || 'unknown'}</div>
                          <div><strong>ParticipantIds:</strong> {JSON.stringify(conv.participantIds || [])}</div>
                          <div><strong>Participants:</strong> {JSON.stringify(conv.participants || [])}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">User's Conversations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Badge variant={debugInfo.checks.participantConversations.count > 0 ? "default" : "destructive"}>
                        Count: {debugInfo.checks.participantConversations.count}
                      </Badge>
                      {debugInfo.checks.participantConversations.error && (
                        <Alert variant="destructive">
                          <AlertDescription className="text-xs">
                            {debugInfo.checks.participantConversations.error}
                          </AlertDescription>
                        </Alert>
                      )}
                      {debugInfo.checks.participantConversations.data.map((conv: any, index: number) => (
                        <div key={index} className="text-xs p-2 bg-muted rounded">
                          <div><strong>ID:</strong> {conv.id}</div>
                          <div><strong>Type:</strong> {conv.type || 'unknown'}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">User Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant={debugInfo.checks.userProfile.exists ? "default" : "destructive"}>
                    {debugInfo.checks.userProfile.exists ? 'Exists' : 'Not Found'}
                  </Badge>
                  {debugInfo.checks.userProfile.data && (
                    <div className="mt-2 text-xs p-2 bg-muted rounded">
                      <pre>{JSON.stringify(debugInfo.checks.userProfile.data, null, 2)}</pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};