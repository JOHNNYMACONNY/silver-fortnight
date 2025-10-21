/**
 * Evidence Test Page
 * 
 * A page for testing the Evidence Embed System.
 */

import React from 'react';
import { EvidenceDemo } from '../components/features/evidence';

const EvidenceTestPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-foreground mb-6">Evidence Embed System</h1>
      <p className="text-lg text-muted-foreground mb-8">
        This system allows users to showcase their work through embedded content from third-party platforms without storing media files directly.
      </p>
      
      <EvidenceDemo />
    </div>
  );
};

export default EvidenceTestPage;
