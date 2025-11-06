# Semantic Skill Badges System

## Overview

The semantic skill badges system automatically assigns the correct icons and semantic colors to skill badges based on skill categories. This ensures consistency across the app and makes it easy for developers to display skills with proper visual hierarchy.

## Quick Start

```tsx
import { Badge } from '../ui/Badge';
import { getSkillBadgeProps } from '../../utils/skillMapping';

// Automatic semantic badge with icon
const { topic, Icon } = getSkillBadgeProps("React");

<Badge variant="default" topic={topic} className="flex items-center gap-1">
  <Icon className="h-3 w-3" />
  React
</Badge>
```

## Skill Categories

### 🎨 Design & Visual Arts
**Icon:** `Palette` | **Skills:** UI/UX Design, Graphic Design, Illustration, Brand Design, Figma, Photoshop, etc.

### 💻 Development & Tech
**Icon:** `Code` | **Skills:** React, JavaScript, Python, Node.js, TypeScript, Java, Swift, etc.

### 🎵 Audio & Sound
**Icon:** `Music` | **Skills:** Music Production, Audio Engineering, Sound Design, Mixing & Mastering, Pro Tools, etc.

### 🎬 Video & Film
**Icon:** `Video` | **Skills:** Video Editing, Cinematography, Motion Graphics, Filmmaking, Premiere Pro, etc.

### ✍️ Writing & Content
**Icon:** `PenTool` | **Skills:** Copywriting, Content Writing, Script Writing, Technical Writing, Blogging, etc.

### 📸 Photography & Visual Media
**Icon:** `Camera` | **Skills:** Photography, Portrait Photography, Product Photography, Lightroom, etc.

### 🎮 3D & Animation
**Icon:** `Layers` | **Skills:** 3D Modeling, Animation, Character Design, Blender, Maya, etc.

### 💼 Business & Marketing
**Icon:** `TrendingUp` | **Skills:** Marketing, Social Media, SEO, Project Management, Analytics, etc.

### 🎓 Education & Mentoring
**Icon:** `GraduationCap` | **Skills:** Teaching, Mentoring, Consulting, Data Analysis, Coaching, etc.

### ⚡ General Skills
**Icon:** `Zap` | **Fallback** for any skills not in the mapping

## Usage Examples

### Basic Skill Badge
```tsx
import { Badge } from '../ui/Badge';
import { getSkillBadgeProps } from '../../utils/skillMapping';

const { topic, Icon } = getSkillBadgeProps("React");

<Badge variant="default" topic={topic} className="flex items-center gap-1">
  <Icon className="h-3 w-3" />
  React
</Badge>
```

### Multiple Skills with Mapping
```tsx
const skills = ["React", "Python", "Photoshop", "Video Editing"];

{skills.map((skill, index) => {
  const { topic, Icon } = getSkillBadgeProps(skill);
  return (
    <Badge key={index} variant="default" topic={topic} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {skill}
    </Badge>
  );
})}
```

### With "+X more" Badge
```tsx
import { Plus } from 'lucide-react';

{skills.slice(0, 5).map((skill, index) => {
  const { topic, Icon } = getSkillBadgeProps(skill);
  return (
    <Badge key={index} variant="default" topic={topic} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {skill}
    </Badge>
  );
})}

{skills.length > 5 && (
  <Badge variant="outline" className="flex items-center gap-1">
    <Plus className="h-3 w-3" />
    +{skills.length - 5} more
  </Badge>
)}
```

### Small Size Badges
```tsx
const { topic, Icon } = getSkillBadgeProps("JavaScript");

<Badge variant="default" topic={topic} size="sm" className="flex items-center gap-1">
  <Icon className="h-3 w-3" />
  JavaScript
</Badge>
```

## Helper Functions

### `getSkillBadgeProps(skillName: string)`
Returns the semantic props for a skill badge.

**Returns:**
```typescript
{
  topic: Topic;           // Semantic topic for consistent theming
  Icon: ComponentType;    // Lucide icon component
  category: SkillCategory; // Skill category name
}
```

**Example:**
```tsx
const result = getSkillBadgeProps("React");
// {
//   topic: "community",
//   Icon: Code,
//   category: "development"
// }
```

### `getSkillCategory(skillName: string)`
Returns just the category for a skill.

**Returns:** `SkillCategory` - One of: `'design'`, `'development'`, `'audio'`, `'video'`, `'writing'`, `'photography'`, `'3d'`, `'business'`, `'education'`, `'general'`

### `isKnownSkill(skillName: string)`
Checks if a skill exists in the mapping.

**Returns:** `boolean`

### `getSkillsByCategory(category: SkillCategory)`
Gets all skills for a specific category.

**Returns:** `string[]`

## Adding New Skills

To add new skills to the mapping, edit `src/utils/skillMapping.ts`:

```typescript
export const skillToCategoryMap: Record<string, SkillCategory> = {
  // Add your new skill here
  'your new skill': 'development', // or appropriate category
  // ...
};
```

**Note:** Skill names are automatically normalized to lowercase for matching, so "React", "react", and "REACT" will all match.

## Best Practices

1. **Always use semantic badges for skills** - Use `variant="default"` with `topic` prop
2. **Include icons** - Always show the category icon for instant recognition
3. **Use consistent sizing** - Use `size="sm"` for compact views, default for normal
4. **Add "+X more" badges** - For truncated skill lists, show how many are hidden
5. **Graceful fallbacks** - Unknown skills will automatically get `topic="community"` and `Zap` icon

## Migration from Old Badges

**Before:**
```tsx
<Badge variant="secondary">{skill}</Badge>
```

**After:**
```tsx
const { topic, Icon } = getSkillBadgeProps(skill);
<Badge variant="default" topic={topic} className="flex items-center gap-1">
  <Icon className="h-3 w-3" />
  {skill}
</Badge>
```

## Benefits

✅ **Automatic categorization** - No manual icon/color selection  
✅ **Consistent visual hierarchy** - Same category = same icon  
✅ **Better UX** - Users can quickly scan for their skills  
✅ **Developer friendly** - One helper function, done  
✅ **Extensible** - Easy to add new skills and categories  
✅ **Type-safe** - Full TypeScript support  

## Components Using Semantic Skill Badges

- ✅ `CollaborationCard` - Main collaboration listings
- ✅ `SearchResultPreview` - Search results
- ✅ `StyleGuide` - Design system reference
- 🔄 More components to be updated as needed

## Support

For questions or issues with the semantic skill badges system, refer to:
- `src/utils/skillMapping.ts` - Main mapping logic
- `src/utils/semanticColors.ts` - Semantic color system
- `src/components/ui/Badge.tsx` - Badge component

