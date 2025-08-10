import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import CollaborationForm_legacy from '../components/features/collaborations/CollaborationForm_legacy';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const CreateCollaborationPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const handleSuccess = (collaborationId: string) => {
    navigate(`/collaborations/${collaborationId}`);
  };
  
  const handleCancel = () => {
    navigate('/collaborations');
  };
  
  if (!currentUser) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-card p-6 rounded-lg shadow-sm border border-border text-center">
          <h2 className="text-xl font-semibold text-card-foreground mb-4">Sign in Required</h2>
          <p className="text-muted-foreground mb-6">
            You need to be signed in to create a collaboration.
          </p>
          <Button asChild>
            <Link to="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6">
        <Link
          to="/collaborations"
          className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/90"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Collaborations
        </Link>
      </div>
      
      <div className="bg-card rounded-lg shadow-sm border border-border p-6">
        <h1 className="text-2xl font-bold text-card-foreground mb-6">Create a New Collaboration</h1>
        
        <CollaborationForm_legacy
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};

export default CreateCollaborationPage;
