import React, { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import { getSyncFirebaseDb } from '../../firebase-config';
import { doc, getDoc } from 'firebase/firestore';
import { StreakType, UserStreak } from '../../types/gamification';
import { Tooltip } from '../ui/Tooltip';

interface StreakWidgetCompactProps {
  userId: string;
  type?: StreakType; // default 'login'
  className?: string;
}

export const StreakWidgetCompact: React.FC<StreakWidgetCompactProps> = ({ userId, type = 'login', className }) => {
  const [streak, setStreak] = useState<UserStreak | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const db = getSyncFirebaseDb();
        const ref = doc(db, 'userStreaks', `${userId}_${type}`);
        const snap = await getDoc(ref);
        if (!mounted) return;
        setStreak(snap.exists() ? (snap.data() as UserStreak) : null);
      } catch {
        if (!mounted) return;
        setStreak(null);
      }
    })();
    return () => { mounted = false; };
  }, [userId, type]);

  return (
    <Tooltip content={`Current ${type === 'login' ? 'login' : type === 'challenge' ? 'challenge' : 'skill practice'} streak in days.`}>
      <div className={"inline-flex items-center gap-1 text-xs text-muted-foreground " + (className || '')}>
        <Flame className="w-3.5 h-3.5 text-primary" />
        <span className="text-foreground font-medium">{streak?.currentStreak ?? 0}d</span>
        <span>({type === 'login' ? 'login' : type === 'challenge' ? 'challenge' : 'skill'})</span>
      </div>
    </Tooltip>
  );
};

export default StreakWidgetCompact;


