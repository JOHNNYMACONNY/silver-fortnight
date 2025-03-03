import { useState } from 'react';
import { Challenge } from '../types';
import { generateChallenge } from '../lib/ai-challenges';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { Wand, Save, RotateCcw, AlertTriangle } from 'lucide-react';

interface ChallengeEditorProps {
  challenge?: Challenge;
  type: 'weekly' | 'monthly';
  onSave: () => void;
  onCancel: () => void;
}

export function ChallengeEditor({ challenge, type, onSave, onCancel }: ChallengeEditorProps) {
  const [editedChallenge, setEditedChallenge] = useState<Partial<Challenge>>(challenge || {});
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateNew = async () => {
    setGenerating(true);
    setError(null);
    try {
      const challengeId = await generateChallenge(type, true);
      const db = await getDb();
      const challengeDoc = await getDoc(doc(db, 'challenges', challengeId));
      setEditedChallenge(challengeDoc.data() as Challenge);
    } catch (err) {
      setError('Failed to generate challenge. Please try again or edit manually.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!editedChallenge.title || !editedChallenge.description) {
      setError('Please fill in all required fields');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (challenge?.id) {
        const db = await getDb();
        await updateDoc(doc(db, 'challenges', challenge.id), {
          ...editedChallenge,
          updatedAt: new Date()
        });
      }
      onSave();
    } catch (err) {
      setError('Failed to save challenge');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">
          {challenge ? 'Edit Challenge' : 'New Challenge'}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handleGenerateNew}
            disabled={generating}
            className="btn-secondary flex items-center gap-2"
          >
            <Wand className="h-4 w-4" />
            {generating ? 'Generating...' : 'Generate with AI'}
          </button>
          {challenge && (
            <button
              onClick={() => setEditedChallenge(challenge)}
              className="btn-secondary flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            value={editedChallenge.title || ''}
            onChange={(e) => setEditedChallenge(prev => ({ ...prev, title: e.target.value }))}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter challenge title"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={editedChallenge.description || ''}
            onChange={(e) => setEditedChallenge(prev => ({ ...prev, description: e.target.value }))}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            rows={4}
            placeholder="Describe the challenge"
          />
        </div>

        {/* Requirements */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Requirements
          </label>
          {editedChallenge.requirements?.map((req, index) => (
            <div key={index} className="flex gap-4 mb-2">
              <select
                value={req.type}
                onChange={(e) => {
                  const newReqs = [...(editedChallenge.requirements || [])];
                  newReqs[index] = { ...req, type: e.target.value as any };
                  setEditedChallenge(prev => ({ ...prev, requirements: newReqs }));
                }}
                className="p-2 border rounded-lg"
              >
                <option value="trades">Trades</option>
                <option value="collaborations">Collaborations</option>
                <option value="endorsements">Endorsements</option>
                <option value="skills">Skills</option>
              </select>
              <input
                type="number"
                value={req.count}
                onChange={(e) => {
                  const newReqs = [...(editedChallenge.requirements || [])];
                  newReqs[index] = { ...req, count: parseInt(e.target.value) };
                  setEditedChallenge(prev => ({ ...prev, requirements: newReqs }));
                }}
                className="p-2 border rounded-lg w-24"
                min="1"
              />
              <input
                type="text"
                value={req.skillCategory || ''}
                onChange={(e) => {
                  const newReqs = [...(editedChallenge.requirements || [])];
                  newReqs[index] = { ...req, skillCategory: e.target.value };
                  setEditedChallenge(prev => ({ ...prev, requirements: newReqs }));
                }}
                className="p-2 border rounded-lg flex-1"
                placeholder="Skill category (optional)"
              />
            </div>
          ))}
          <button
            onClick={() => setEditedChallenge(prev => ({
              ...prev,
              requirements: [
                ...(prev.requirements || []),
                { type: 'trades', count: 1 }
              ]
            }))}
            className="text-sm text-indigo-600 hover:text-indigo-700"
          >
            + Add Requirement
          </button>
        </div>

        {/* Rewards */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rewards
          </label>
          <div className="flex gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">XP</label>
              <input
                type="number"
                value={editedChallenge.rewards?.xp || 0}
                onChange={(e) => setEditedChallenge(prev => ({
                  ...prev,
                  rewards: {
                    ...prev.rewards,
                    xp: parseInt(e.target.value)
                  }
                }))}
                className="p-2 border rounded-lg w-24"
                min="0"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Badge (optional)</label>
              <input
                type="text"
                value={editedChallenge.rewards?.badge || ''}
                onChange={(e) => setEditedChallenge(prev => ({
                  ...prev,
                  rewards: {
                    ...prev.rewards,
                    badge: e.target.value
                  }
                }))}
                className="p-2 border rounded-lg w-full"
                placeholder="Badge identifier"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-4">
          <button
            onClick={onCancel}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Challenge'}
          </button>
        </div>
      </div>
    </div>
  );
}
