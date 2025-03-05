import { useState } from 'react';
import { Edit, Trash2, RotateCcw } from 'lucide-react';
import { useAdmin } from '../contexts/AdminContext';
import { getDb } from '../lib/firebase';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';

interface ManagementActionsProps {
  itemId: string;
  collectionName: 'trades' | 'projects' | 'challenges';
  onEdit?: () => void;
  canRegenerate?: boolean;
  onRegenerate?: () => void;
}

export function ManagementActions({ 
  itemId, 
  collectionName,
  onEdit,
  canRegenerate,
  onRegenerate 
}: ManagementActionsProps) {
  const { isAdmin, adminModeEnabled } = useAdmin();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isAdmin || !adminModeEnabled) {
    return null;
  }

  const handleDelete = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    try {
      setIsDeleting(true);
      const db = await getDb();
      await deleteDoc(doc(db, collectionName, itemId));
      // Redirect or refresh will be handled by the parent component through state changes
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {onEdit && (
        <button
          onClick={onEdit}
          className="p-2 rounded-full hover:bg-neon-blue/20 text-neon-blue transition-colors"
          title="Edit"
        >
          <Edit className="h-4 w-4" />
        </button>
      )}
      
      {canRegenerate && onRegenerate && (
        <button
          onClick={onRegenerate}
          className="p-2 rounded-full hover:bg-neon-purple/20 text-neon-purple transition-colors"
          title="Regenerate"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      )}

      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className={`p-2 rounded-full transition-colors ${
          showConfirm 
            ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' 
            : 'hover:bg-red-500/20 text-red-500'
        }`}
        title={showConfirm ? 'Click again to confirm deletion' : 'Delete'}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
