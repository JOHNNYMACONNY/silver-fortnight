import React, { useState, useEffect } from "react";
import { Save, X, Check } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { SimpleModal } from "../../../components/ui/SimpleModal";
import { ProfileImage } from "../../../components/ui/ProfileImage";
import { userService } from "../../../services/entities/UserService";
import {
  uploadProfileImage,
  uploadImage,
} from "../../../services/cloudinary/cloudinaryService";
import { useToast } from "../../../contexts/ToastContext";
import { logEvent } from "../../../services/analytics";
import type { UserProfile } from "../types";
import { Copy as CopyIcon } from "lucide-react";

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  targetUserId: string;
  onSaveSuccess: (updates: Partial<UserProfile>) => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  targetUserId,
  onSaveSuccess,
}) => {
  const { showToast } = useToast();

  // Form state
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: "",
    tagline: "",
    bio: "",
    website: "",
    location: "",
  });
  const [handleInput, setHandleInput] = useState("");
  const [handleError, setHandleError] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [skillsInput, setSkillsInput] = useState("");
  const [skillsDraft, setSkillsDraft] = useState<string[]>([]);

  // Initialize form when modal opens or profile changes
  useEffect(() => {
    if (!isOpen || !userProfile) return;

    setEditForm({
      displayName: userProfile.displayName || "",
      tagline: userProfile.tagline || "",
      bio: userProfile.bio || "",
      website: userProfile.website || "",
      location: userProfile.location || "",
    });
    setHandleInput(userProfile.handle || "");
    setSkillsDraft(
      Array.isArray(userProfile.skills) ? [...userProfile.skills] : []
    );
    setAvatarFile(null);
    setAvatarPreviewUrl(null);
    setHandleError(null);
    setSkillsInput("");
  }, [isOpen, userProfile]);

  // Handle validation
  const validateHandle = (value: string) => {
    const normalized = value
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 20);
    setHandleInput(normalized);

    if (normalized && normalized.length < 3) {
      setHandleError("Handle must be at least 3 characters");
    } else {
      setHandleError(null);
    }

    return normalized;
  };

  // Add skill
  const addSkill = () => {
    const name = skillsInput.trim();
    if (!name) return;

    const exists = skillsDraft.some(
      (s) => s.toLowerCase() === name.toLowerCase()
    );
    if (!exists && skillsDraft.length < 10) {
      setSkillsDraft([...skillsDraft, name]);
    }
    setSkillsInput("");
  };

  // Remove skill
  const removeSkill = (index: number) => {
    setSkillsDraft(skillsDraft.filter((_, i) => i !== index));
  };

  // Handle save
  const handleSave = async () => {
    if (!targetUserId) return;

    setSavingEdit(true);
    try {
      // Upload avatar if selected
      let uploadedPublicId: string | undefined;
      if (avatarFile) {
        const res = await uploadProfileImage(avatarFile);
        if (res.error) {
          // Fallback to generic upload preset
          const retry = await uploadImage(avatarFile, "users/profiles");
          if (retry.error) {
            throw new Error(retry.error);
          }
          uploadedPublicId = retry.publicId;
        } else {
          uploadedPublicId = res.publicId;
        }
      }

      // Prepare updates
      const updates: any = {
        displayName: editForm.displayName?.trim() || undefined,
        tagline: editForm.tagline?.trim() || undefined,
        bio: editForm.bio?.trim() || undefined,
        website: editForm.website?.trim() || undefined,
        location: editForm.location?.trim() || undefined,
        skills: Array.isArray(skillsDraft) ? skillsDraft : [],
        profilePicture: uploadedPublicId || undefined,
      };

      // Handle validation and update
      const candidate = handleInput
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 20);
      if (candidate) {
        if (candidate.length < 3) {
          setHandleError("Handle must be at least 3 characters");
          setSavingEdit(false);
          return;
        }

        // Check handle availability
        const availabilityResult = await userService.checkHandleAvailability(
          candidate,
          targetUserId
        );
        if (availabilityResult.error) {
          console.warn(
            "Handle availability check failed",
            availabilityResult.error
          );
          // Continue anyway - non-critical error
        } else if (availabilityResult.data === false) {
          setHandleError("This handle is already taken");
          setSavingEdit(false);
          return;
        }

        updates.handle = candidate;
        setHandleError(null);
      }

      // Update user profile
      const res = await userService.updateUser(targetUserId, updates);
      if (res.error) {
        showToast(res.error.message || "Failed to update profile", "error");
        return;
      }

      // Success
      onSaveSuccess(updates);
      showToast("Profile updated", "success");
      onClose();
    } catch (e: any) {
      showToast(e?.message || "Failed to update profile", "error");
    } finally {
      setSavingEdit(false);
    }
  };

  // Copy profile link
  const copyProfileLink = async () => {
    const h = handleInput.trim() || userProfile?.handle || "";
    const path = h ? `/u/${h}` : `/profile/${targetUserId}`;
    const url = `${window.location.origin}${path}`;

    await navigator.clipboard.writeText(url);
    showToast("Profile link copied", "success");
    await logEvent("profile_share", {
      userId: targetUserId,
      hasHandle: !!h,
      method: "clipboard",
      context: "modal",
    });
  };

  return (
    <SimpleModal isOpen={isOpen} onClose={onClose} title="Edit Profile">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="space-y-4"
        aria-label="Edit profile form"
      >
        {/* Avatar uploader */}
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 rounded-full overflow-hidden ring-2 ring-border">
            {avatarPreviewUrl ? (
              <img
                src={
                  avatarPreviewUrl.startsWith("blob:")
                    ? avatarPreviewUrl
                    : undefined
                }
                alt="New avatar preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <ProfileImage
                photoURL={userProfile?.photoURL}
                profilePicture={userProfile?.profilePicture || null}
                displayName={userProfile?.displayName}
                size="lg"
                className="h-16 w-16"
              />
            )}
            {avatarPreviewUrl && (
              <button
                type="button"
                className="absolute -top-2 -right-2 bg-background border border-border rounded-full p-1 shadow"
                onClick={() => {
                  setAvatarPreviewUrl(null);
                  setAvatarFile(null);
                }}
                aria-label="Remove selected avatar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Profile Photo
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setAvatarFile(file);
                if (file) {
                  const url = URL.createObjectURL(file);
                  setAvatarPreviewUrl(url);
                } else {
                  setAvatarPreviewUrl(null);
                }
              }}
              className="block text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              PNG or JPG up to ~5MB
            </p>
          </div>
        </div>

        {/* Display Name */}
        <div>
          <label
            htmlFor="displayName"
            className="block text-sm font-medium text-muted-foreground mb-2"
          >
            Display Name
          </label>
          <input
            id="displayName"
            type="text"
            value={editForm.displayName}
            onChange={(e) =>
              setEditForm({ ...editForm, displayName: e.target.value })
            }
            className="w-full rounded-xl border-glass glassmorphic backdrop-blur-xl bg-white/5 px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-all duration-200"
            maxLength={80}
            aria-label="Display name"
          />
        </div>

        {/* Tagline */}
        <div>
          <label
            htmlFor="tagline"
            className="block text-sm font-medium text-muted-foreground mb-2"
          >
            Tagline
          </label>
          <input
            id="tagline"
            type="text"
            value={editForm.tagline}
            onChange={(e) =>
              setEditForm({ ...editForm, tagline: e.target.value })
            }
            className="w-full rounded-xl border-glass glassmorphic backdrop-blur-xl bg-white/5 px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-all duration-200"
            maxLength={120}
            placeholder="One sentence that captures what you do"
            aria-label="Tagline"
          />
        </div>

        {/* Handle */}
        <div>
          <label
            htmlFor="handle"
            className="block text-sm font-medium text-muted-foreground mb-2"
          >
            Handle
          </label>
          <input
            id="handle"
            type="text"
            value={handleInput}
            onChange={(e) => validateHandle(e.target.value)}
            placeholder="your_handle"
            className={`w-full rounded-xl glassmorphic backdrop-blur-xl bg-white/5 px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 transition-all duration-200 ${
              handleError
                ? "border-red-500 dark:border-red-500 focus:ring-red-500"
                : "border-glass focus:ring-orange-500 dark:focus:ring-orange-400"
            }`}
            maxLength={20}
            aria-label="Handle"
            aria-invalid={handleError ? "true" : "false"}
            aria-describedby={handleError ? "handle-error" : "handle-help"}
          />
          <p
            id={handleError ? "handle-error" : "handle-help"}
            className={`mt-1 text-xs ${
              handleError ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            Letters, numbers, underscores; 3–20 chars. Used for /u/your_handle.
          </p>
          {!handleError && handleInput.length >= 3 && (
            <div className="mt-1 inline-flex items-center gap-1 text-xs text-success-600 dark:text-success-400">
              <Check className="w-3.5 h-3.5" />
              Looks good
            </div>
          )}
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Profile link:</span>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-primary hover:underline"
              onClick={copyProfileLink}
              aria-label="Copy profile link"
            >
              <CopyIcon className="w-3.5 h-3.5" />
              Copy
            </button>
          </div>
        </div>

        {/* Bio */}
        <div>
          <label
            htmlFor="bio"
            className="block text-sm font-medium text-muted-foreground mb-2"
          >
            Bio
          </label>
          <textarea
            id="bio"
            value={editForm.bio}
            onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
            className="w-full rounded-xl border-glass glassmorphic backdrop-blur-xl bg-white/5 px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-all duration-200"
            rows={4}
            maxLength={500}
            aria-label="Bio"
          />
        </div>

        {/* Skills editor */}
        <div>
          <label
            htmlFor="skillsInput"
            className="block text-sm font-medium text-muted-foreground mb-1"
          >
            Skills
          </label>
          <div className="flex items-center gap-2">
            <input
              id="skillsInput"
              type="text"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSkill();
                }
              }}
              placeholder="Add a skill and press Enter"
              className="w-full rounded-xl border-glass glassmorphic backdrop-blur-xl bg-white/5 px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-all duration-200"
              aria-label="Add skill"
            />
            <Button
              type="button"
              onClick={addSkill}
              className="shrink-0"
              aria-label="Add skill to list"
            >
              Add
            </Button>
          </div>
          {skillsDraft.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {skillsDraft.map((skill, idx) => (
                <span
                  key={`${skill}-${idx}`}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-1 text-sm"
                >
                  {skill}
                  <button
                    type="button"
                    className="ml-1 rounded-full p-0.5 hover:bg-muted"
                    aria-label={`Remove ${skill}`}
                    onClick={() => removeSkill(idx)}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Up to 10 skills. Use simple names like "Audio Mixing", "Video
            Editing".
          </p>
        </div>

        {/* Website and Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="website"
              className="block text-sm font-medium text-muted-foreground mb-2"
            >
              Website
            </label>
            <input
              id="website"
              type="url"
              value={editForm.website}
              onChange={(e) =>
                setEditForm({ ...editForm, website: e.target.value })
              }
              placeholder="https://example.com"
              className="w-full rounded-xl border-glass glassmorphic backdrop-blur-xl bg-white/5 px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-all duration-200"
              aria-label="Website URL"
            />
          </div>
          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium text-muted-foreground mb-2"
            >
              Location
            </label>
            <input
              id="location"
              type="text"
              value={editForm.location}
              onChange={(e) =>
                setEditForm({ ...editForm, location: e.target.value })
              }
              className="w-full rounded-xl border-glass glassmorphic backdrop-blur-xl bg-white/5 px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-all duration-200"
              maxLength={120}
              aria-label="Location"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            aria-label="Cancel editing profile"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="gap-2"
            disabled={savingEdit}
            aria-label={savingEdit ? "Saving profile changes" : "Save profile changes"}
            aria-busy={savingEdit}
          >
            <Save className="w-4 h-4" aria-hidden="true" />
            {savingEdit ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </form>
    </SimpleModal>
  );
};
