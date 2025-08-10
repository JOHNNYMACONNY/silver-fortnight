// src/components/features/portfolio/PortfolioItem.tsx

import React, { useState } from 'react';
import {
  updatePortfolioItemVisibility,
  updatePortfolioItemFeatured,
  updatePortfolioItemPinned,
  updatePortfolioItemCategory,
  deletePortfolioItem
} from '../../../services/portfolio';
import { PortfolioItem } from '../../../types/portfolio';
import { motion } from 'framer-motion';
import { Star, Pin, Eye, EyeOff, Settings, Trash2, Calendar, Users, Award, ExternalLink } from 'lucide-react';
import { getProfileImageUrl } from '../../../utils/imageUtils';

interface PortfolioItemProps {
  item: PortfolioItem;
  isOwnProfile: boolean;
  isManaging: boolean;
  onChange?: () => void;
}

const CATEGORY_OPTIONS = [
  'Web Development',
  'Mobile Development',
  'Design',
  'Data Science',
  'Marketing',
  'Writing',
  'Business',
  'Education',
  'Other'
];

export const PortfolioItemComponent: React.FC<PortfolioItemProps> = ({
  item,
  isOwnProfile,
  isManaging,
  onChange
}) => {
  const [loading, setLoading] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleToggleVisibility = async () => {
    if (!isOwnProfile || loading) return;
    setLoading(true);
    try {
      await updatePortfolioItemVisibility(item.userId, item.id, !item.visible);
      onChange && onChange();
    } catch (error) {
      console.error('Failed to update visibility:', error);
    }
    setLoading(false);
  };

  const handleToggleFeatured = async () => {
    if (!isOwnProfile || loading) return;
    setLoading(true);
    try {
      await updatePortfolioItemFeatured(item.userId, item.id, !item.featured);
      onChange && onChange();
    } catch (error) {
      console.error('Failed to update featured status:', error);
    }
    setLoading(false);
  };

  const handleTogglePinned = async () => {
    if (!isOwnProfile || loading) return;
    setLoading(true);
    try {
      await updatePortfolioItemPinned(item.userId, item.id, !item.pinned);
      onChange && onChange();
    } catch (error) {
      console.error('Failed to update pinned status:', error);
    }
    setLoading(false);
  };

  const handleCategoryChange = async (newCategory: string) => {
    if (!isOwnProfile || loading) return;
    setLoading(true);
    try {
      await updatePortfolioItemCategory(item.userId, item.id, newCategory);
      setEditingCategory(false);
      onChange && onChange();
    } catch (error) {
      console.error('Failed to update category:', error);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!isOwnProfile || loading) return;
    if (!window.confirm('Are you sure you want to delete this portfolio item? This action cannot be undone.')) return;
    setLoading(true);
    try {
      await deletePortfolioItem(item.userId, item.id);
      onChange && onChange();
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
    setLoading(false);
  };

  const formatDate = (date: any) => {
    if (!date) return 'Unknown date';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`
        portfolio-item relative backdrop-blur-md bg-card/70
        border border-border/30 rounded-xl shadow-lg
        transition-all duration-300 hover:shadow-xl hover:-translate-y-1
        hover:bg-card/80
        ${item.featured ? 'ring-2 ring-accent/50 shadow-accent/20' : ''}
        ${item.pinned ? 'bg-secondary/10' : ''}
      `}
    >
      {/* Badges */}
      <div className="absolute top-4 left-4 flex gap-2 z-10">
        {item.featured && (
          <span className="inline-flex items-center gap-1 bg-gradient-to-r from-accent/10 to-accent/20 text-accent-foreground text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-sm border border-accent/50">
            <Star className="w-3 h-3" />
            Featured
          </span>
        )}
        {item.pinned && (
          <span className="inline-flex items-center gap-1 bg-gradient-to-r from-secondary/10 to-secondary/20 text-secondary-foreground text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-sm border border-secondary/50">
            <Pin className="w-3 h-3" />
            Pinned
          </span>
        )}
        {!item.visible && isOwnProfile && (
          <span className="inline-flex items-center gap-1 bg-gradient-to-r from-background-secondary/10 to-background-secondary/20 text-text-muted text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-sm border border-border/50">
            <EyeOff className="w-3 h-3" />
            Hidden
          </span>
        )}
      </div>

      {/* Management Controls */}
      {isOwnProfile && isManaging && (
        <div className="absolute top-3 right-3 flex gap-1">
          <div className="bg-background-primary rounded-lg shadow-lg border border-border p-2">
            <div className="flex flex-col gap-1">
              <button
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  item.visible 
                    ? 'bg-success/10 text-success' 
                    : 'bg-muted/20 text-muted-foreground'
                } hover:bg-muted/30 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={handleToggleVisibility}
                disabled={loading}
                title={item.visible ? 'Hide from profile' : 'Show on profile'}
              >
                {item.visible ? '👁️ Visible' : '👁️‍🗨️ Hidden'}
              </button>
              <button
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  item.featured 
                    ? 'bg-accent/10 text-accent' 
                    : 'bg-muted/20 text-muted-foreground'
                } hover:bg-muted/30 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={handleToggleFeatured}
                disabled={loading}
                title={item.featured ? 'Remove from featured' : 'Mark as featured'}
              >
                {item.featured ? '⭐ Featured' : '⭐ Feature'}
              </button>
              <button
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  item.pinned 
                    ? 'bg-secondary/10 text-secondary' 
                    : 'bg-muted/20 text-muted-foreground'
                } hover:bg-muted/30 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={handleTogglePinned}
                disabled={loading}
                title={item.pinned ? 'Unpin from top' : 'Pin to top'}
              >
                {item.pinned ? '📌 Pinned' : '📌 Pin'}
              </button>
              <button
                className="text-xs px-2 py-1 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                onClick={handleDelete}
                disabled={loading}
                title="Delete portfolio item"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 mr-4">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {item.title}
              </h3>
              <div className="flex items-center gap-3 text-sm text-text-muted mb-2">
                <span className="flex items-center gap-1">
                  {item.sourceType === 'trade' ? '🤝' : '👥'} 
                  {item.sourceType === 'trade' ? 'Trade' : 'Collaboration'}
                </span>
                <span>•</span>
                <span>📅 {formatDate(item.completedAt)}</span>
                {item.category && (
                  <>
                    <span>•</span>
                    <span className="bg-background-secondary px-2 py-1 rounded text-xs">
                      {item.category}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Category Editing */}
          {isOwnProfile && isManaging && editingCategory && (
            <div className="mb-4 p-3 bg-background-secondary rounded-lg">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Category
              </label>
              <select
                className="w-full px-3 py-2 border border-border rounded-md focus:ring-ring focus:border-ring bg-input text-text-primary"
                value={item.category || 'Other'}
                onChange={(e) => handleCategoryChange(e.target.value)}
                disabled={loading}
              >
                {CATEGORY_OPTIONS.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <div className="flex gap-2 mt-2">
                <button
                  className="text-xs px-3 py-1 bg-background-secondary text-text-primary rounded hover:bg-background-secondary/80"
                  onClick={() => setEditingCategory(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="relative">
          <p className={`text-sm text-text-secondary ${expanded ? '' : 'line-clamp-3'}`}>
            {item.description}
          </p>
          {!expanded && item.description && item.description.length > 150 && (
            <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-card/80 to-transparent"></div>
          )}
        </div>
        {item.description && item.description.length > 150 && (
          <button onClick={() => setExpanded(!expanded)} className="text-xs text-primary mt-2">
            {expanded ? 'Show Less' : 'Show More'}
          </button>
        )}

        {/* Skills */}
        {item.skills && item.skills.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-text-primary mb-2">Skills</h4>
            <div className="flex flex-wrap gap-2">
              {item.skills.map((skill, index) => (
                <span
                  key={index}
                  className="bg-accent/10 text-accent-foreground px-3 py-1 rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Collaborators */}
        {item.collaborators && item.collaborators.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-text-primary mb-2">Collaborators</h4>
            <div className="flex flex-wrap gap-2">
              {item.collaborators.map((collaborator, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-background-secondary px-3 py-2 rounded-lg"
                >
                  {collaborator.photoURL && (
                    <img
                      src={getProfileImageUrl(collaborator.photoURL, 24)}
                      alt={collaborator.name}
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <span className="text-sm text-text-secondary">
                    {collaborator.name}
                  </span>
                  <span className="text-xs text-text-muted">
                    ({collaborator.role})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Evidence */}
        {item.evidence && item.evidence.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-text-primary">Evidence</h4>
              <button
                className="text-accent hover:text-accent-foreground text-sm"
                onClick={() => setShowEvidenceModal(true)}
              >
                View all ({item.evidence.length})
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {item.evidence.slice(0, 3).map((evidence, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 w-20 h-20 bg-background-secondary rounded-lg flex items-center justify-center"
                >
                  {evidence.type === 'image' ? (
                    <img
                      src={evidence.url}
                      alt="Evidence image"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-center">
                      <div className="text-lg">📄</div>
                      <div className="text-xs text-text-muted">
                        {evidence.type}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {isOwnProfile && isManaging && !editingCategory && (
          <div className="flex gap-2 pt-4 border-t border-border">
            <button
              className="text-sm px-3 py-1 bg-background-secondary text-text-primary rounded hover:bg-background-secondary/80"
              onClick={() => setEditingCategory(true)}
            >
              Edit Category
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 pb-6 pt-4 mt-auto">
        <div className="border-t border-border/30 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-text-muted">
            {/* These properties do not exist on the type, will be re-added later */}
            {/* <div className="flex items-center gap-1">
              <Award className="w-3 h-3" />
              <span>{item.sourceData?.rewards?.xp || 'N/A'} XP</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{item.sourceData?.participantCount || 'N/A'} Participants</span>
            </div> */}
          </div>
          {/* This property does not exist on the type, will be re-added later */}
          {/* {item.sourceUrl && (
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              View Source
              <ExternalLink className="w-3 h-3" />
            </a>
          )} */}
        </div>
      </div>

      {/* Evidence Modal */}
      {showEvidenceModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-card p-6 rounded-lg max-w-lg w-full">
            <h3 className="text-xl font-semibold mb-4 text-text-primary">Evidence</h3>
            <p className="text-text-secondary">Modal content goes here.</p>
            <button onClick={() => setShowEvidenceModal(false)} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded">
              Close
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PortfolioItemComponent;