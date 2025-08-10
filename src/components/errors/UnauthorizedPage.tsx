import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { AlertTriangle } from 'lucide-react';

const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto bg-destructive/10 p-3 rounded-full">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="mt-4 text-2xl font-bold">401 - Unauthorized</CardTitle>
          <CardDescription>
            You need to be signed in to access this page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center gap-4">
            <Button onClick={() => navigate('/login')}>
              Sign In
            </Button>
            <Button variant="outline" onClick={() => navigate('/')}>
              Go to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnauthorizedPage;
