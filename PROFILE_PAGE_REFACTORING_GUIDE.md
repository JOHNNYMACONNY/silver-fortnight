# ProfilePage Refactoring Implementation Guide

## Quick Reference: State Consolidation

### Current State (Scattered)
```typescript
// Edit form state (5 separate states)
const [isEditOpen, setIsEditOpen] = useState(false);
const [savingEdit, setSavingEdit] = useState(false);
const [editForm, setEditForm] = useState({...});
const [handleError, setHandleError] = useState<string | null>(null);
const [avatarFile, setAvatarFile] = useState<File | null>(null);
const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
const [skillsInput, setSkillsInput] = useState("");
const [skillsDraft, setSkillsDraft] = useState<string[]>([]);

// Collaborations state (6 separate states)
const [collaborations, setCollaborations] = useState<any[] | null>(null);
const [collaborationsLoading, setCollaborationsLoading] = useState(false);
const [collabVisibleCount, setCollabVisibleCount] = useState(6);
const [collabFilter, setCollabFilter] = useState<"all" | "yours">("all");
const [userRoleByCollabId, setUserRoleByCollabId] = useState<Record<string, string>>({});
const [isLoadingMoreCollabs, setIsLoadingMoreCollabs] = useState(false);
```

### Refactored State (Consolidated)
```typescript
// Edit form state (1 reducer)
const [editState, editDispatch] = useReducer(editReducer, initialEditState);

// Collaborations state (1 reducer)
const [collabState, collabDispatch] = useReducer(collabReducer, initialCollabState);
```

---

## Extract: useProfileData Hook

**File:** `src/pages/hooks/useProfileData.ts`

```typescript
interface UseProfileDataResult {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useProfileData(userId: string | undefined): UseProfileDataResult {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    
    const loadProfile = async () => {
      try {
        setLoading(true);
        const { data, error } = await getUserProfile(userId);
        if (error) throw new Error(error);
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  return { profile, loading, error, refetch: () => loadProfile() };
}
```

---

## Extract: useCollaborationsList Hook

**File:** `src/pages/hooks/useCollaborationsList.ts`

```typescript
interface CollaborationsListState {
  items: Collaboration[];
  loading: boolean;
  error: string | null;
  visibleCount: number;
  filter: 'all' | 'yours';
  userRoles: Record<string, string>;
}

export function useCollaborationsList(
  userId: string | undefined,
  isOwnProfile: boolean
): CollaborationsListState & {
  setFilter: (filter: 'all' | 'yours') => void;
  loadMore: () => void;
  refetch: () => Promise<void>;
} {
  const [state, dispatch] = useReducer(collabReducer, initialState);

  // Fetch collaborations
  useEffect(() => {
    if (!userId) return;
    
    const fetch = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const res = await collaborationService.getCollaborationsForUser(userId);
        if (res.error) throw new Error(res.error.message);
        dispatch({ type: 'SET_ITEMS', payload: res.data || [] });
      } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Failed' });
      }
    };

    fetch();
  }, [userId]);

  // Enrich with roles
  useEffect(() => {
    if (!state.items.length) return;
    // Role enrichment logic here
  }, [state.items]);

  return {
    ...state,
    setFilter: (filter) => dispatch({ type: 'SET_FILTER', payload: filter }),
    loadMore: () => dispatch({ type: 'LOAD_MORE' }),
    refetch: async () => { /* ... */ }
  };
}
```

---

## Extract: ProfileEditModal Component

**File:** `src/pages/components/ProfileEditModal.tsx`

```typescript
interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  onSave: (updates: ProfileUpdates) => Promise<void>;
  isSaving: boolean;
}

export function ProfileEditModal({
  isOpen,
  onClose,
  profile,
  onSave,
  isSaving
}: ProfileEditModalProps) {
  const [form, setForm] = useState<EditForm>({...});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (profile) {
      setForm({
        displayName: profile.displayName || '',
        tagline: profile.tagline || '',
        bio: profile.bio || '',
        website: profile.website || '',
        location: profile.location || '',
        skills: profile.skills || []
      });
    }
  }, [profile, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    await onSave(form);
    onClose();
  };

  return (
    <SimpleModal isOpen={isOpen} onClose={onClose} title="Edit Profile">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Form fields */}
        <div>
          <label>Display Name</label>
          <input
            value={form.displayName}
            onChange={(e) => setForm({...form, displayName: e.target.value})}
            className="w-full rounded-xl border-glass..."
          />
          {errors.displayName && <p className="text-red-500">{errors.displayName}</p>}
        </div>
        {/* More fields... */}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </SimpleModal>
  );
}
```

---

## Extract: ProfileShareMenu Component

**File:** `src/pages/components/ProfileShareMenu.tsx`

```typescript
interface ProfileShareMenuProps {
  isOpen: boolean;
  onClose: () => void;
  profileUrl: string;
  profileName: string;
  position?: { top: number; left: number };
}

export function ProfileShareMenu({
  isOpen,
  onClose,
  profileUrl,
  profileName,
  position
}: ProfileShareMenuProps) {
  const { showToast } = useToast();

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      showToast('Profile link copied', 'success');
      onClose();
    } catch {
      showToast('Failed to copy link', 'error');
    }
  };

  const handleShareTwitter = () => {
    const text = `Check out ${profileName}'s profile on TradeYa!`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(profileUrl)}`,
      '_blank'
    );
    onClose();
  };

  // Similar for LinkedIn, Facebook, native share...

  if (!isOpen) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 w-56 glassmorphic..."
        style={position}
      >
        <button onClick={handleCopyLink} className="w-full px-4 py-2.5...">
          <Link2 className="w-4 h-4" />
          <span>Copy link</span>
        </button>
        {/* More share options... */}
      </div>
    </>,
    document.body
  );
}
```

---

## Type Definitions to Add

**File:** `src/types/profile.ts`

```typescript
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  handle?: string;
  verified?: boolean;
  handlePrivate?: boolean;
  tagline?: string;
  photoURL?: string;
  bio?: string;
  skills?: string[];
  location?: string;
  website?: string;
  profilePicture?: string;
  banner?: BannerData | string | null;
  bannerFx?: {
    enable: boolean;
    preset: EffectsPreset;
    opacity: number;
    blendMode: EffectsBlendMode;
  };
  metadata?: {
    creationTime?: string;
    lastSignInTime?: string;
  };
}

export interface ProfileStats {
  totalTrades: number;
  tradesThisWeek: number;
  currentXP: number;
}

export interface ProfileReview {
  rating: number;
  comment: string;
}

export interface Collaboration {
  id: string;
  title: string;
  creatorId: string;
  participants: string[];
  // ... other fields
}

export interface Trade {
  id: string;
  title: string;
  creatorId: string;
  // ... other fields
}
```

---

## Testing Strategy

### Unit Tests for Hooks
```typescript
describe('useProfileData', () => {
  it('loads profile data on mount', async () => {
    const { result } = renderHook(() => useProfileData('user-123'));
    expect(result.current.loading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.profile).toBeDefined();
    });
  });

  it('handles errors gracefully', async () => {
    // Mock error scenario
    const { result } = renderHook(() => useProfileData('invalid'));
    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });
  });
});
```

### Component Tests
```typescript
describe('ProfileEditModal', () => {
  it('renders form fields', () => {
    render(
      <ProfileEditModal
        isOpen={true}
        onClose={jest.fn()}
        profile={mockProfile}
        onSave={jest.fn()}
        isSaving={false}
      />
    );
    expect(screen.getByLabelText('Display Name')).toBeInTheDocument();
  });

  it('calls onSave with form data', async () => {
    const onSave = jest.fn();
    render(
      <ProfileEditModal
        isOpen={true}
        onClose={jest.fn()}
        profile={mockProfile}
        onSave={onSave}
        isSaving={false}
      />
    );
    // Fill form and submit
    await userEvent.click(screen.getByText('Save Changes'));
    expect(onSave).toHaveBeenCalled();
  });
});
```

---

## Migration Checklist

- [ ] Create type definitions file
- [ ] Extract useProfileData hook
- [ ] Extract useCollaborationsList hook
- [ ] Extract useTradesList hook
- [ ] Extract ProfileEditModal component
- [ ] Extract ProfileShareMenu component
- [ ] Extract ProfileHeader component
- [ ] Extract ProfileTabs component
- [ ] Update main ProfilePage to use extracted components
- [ ] Add unit tests for hooks
- [ ] Add component tests
- [ ] Performance testing (before/after)
- [ ] Accessibility audit
- [ ] Update documentation

