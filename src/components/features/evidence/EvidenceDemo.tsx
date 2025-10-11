/**
 * EvidenceDemo Component
 *
 * A demo component for testing the Evidence Embed System.
 */

import React, { useState } from 'react';
import { EvidenceSubmitter } from './EvidenceSubmitter';
import { EvidenceGallery } from './EvidenceGallery';
import { EmbeddedEvidence } from '../../../utils/embedUtils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../ui/Card';
import { Button } from '../../ui/Button';

export const EvidenceDemo: React.FC = () => {
  const [evidenceItems, setEvidenceItems] = useState<EmbeddedEvidence[]>([]);
  const [showSubmitter, setShowSubmitter] = useState(false);

  const handleSubmit = async (evidence: EmbeddedEvidence) => {
    setEvidenceItems([...evidenceItems, evidence]);
    setShowSubmitter(false);
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Evidence Embed System Demo</h2>

      {!showSubmitter ? (
        <div className="mb-6">
          <Button onClick={() => setShowSubmitter(true)}>Add Evidence</Button>
        </div>
      ) : (
        <div className="mb-6">
          <EvidenceSubmitter
            onSubmit={handleSubmit}
            onCancel={() => setShowSubmitter(false)}
          />
        </div>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Supported Services</CardTitle>
          <CardDescription>
            You can embed content from the following services:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <h4 className="font-medium">Video</h4>
              <ul className="list-disc list-inside text-sm">
                <li>YouTube (youtube.com)</li>
                <li>Vimeo (vimeo.com)</li>
                <li>Loom (loom.com)</li>
              </ul>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <h4 className="font-medium">Images</h4>
              <ul className="list-disc list-inside text-sm">
                <li>Imgur (imgur.com)</li>
              </ul>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <h4 className="font-medium">Documents</h4>
              <ul className="list-disc list-inside text-sm">
                <li>Google Docs (docs.google.com)</li>
                <li>Google Sheets (sheets.google.com)</li>
                <li>Google Slides (slides.google.com)</li>
                <li>Google Drive Files (drive.google.com/file)</li>
                <li>Google Drive Folders (drive.google.com/drive/folders)</li>
              </ul>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <h4 className="font-medium">Code</h4>
              <ul className="list-disc list-inside text-sm">
                <li>GitHub Gist (gist.github.com)</li>
                <li>CodePen (codepen.io)</li>
              </ul>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <h4 className="font-medium">Design</h4>
              <ul className="list-disc list-inside text-sm">
                <li>Figma (figma.com)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <EvidenceGallery
        evidence={evidenceItems}
        title="Your Evidence"
        emptyMessage="Add some evidence to see it displayed here."
      />
    </div>
  );
};
