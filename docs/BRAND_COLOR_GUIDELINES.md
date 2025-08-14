## Brand Color Semantics

This project uses topic-driven color semantics for consistent styling across pages and components (Tailwind v4 tokens).

- **Trades (orange / primary)**: `topic="trades"`
  - Use for browse trades, active trades, and trade CTAs/stats.
  - Tokens: `text-primary`, `bg-primary`, `bg-primary/10`, `ring-primary/40`.

- **Collaboration (purple / accent)**: `topic="collaboration"`
  - Use for teamwork, collaborations, messages.
  - Tokens: `text-accent`, `bg-accent`, `bg-accent/10`, `ring-accent/40`.

- **Community & Data (blue / secondary)**: `topic="community"`
  - Use for user directory, community navigation, real-time/live badges, completion metrics.
  - Tokens: `text-secondary`, `bg-secondary`, `bg-secondary/10`, `ring-secondary/40`.

- **Success & Rewards (green / success)**: `topic="success"`
  - Use for rewards, achievements, leaderboard, positive statuses.
  - Tokens: `text-success`, `bg-success`, `bg-success/10`, `ring-success/40`.

### Implementation

- `src/utils/semanticColors.ts`: `semanticClasses(topic)` helper returns Tailwind class sets for text, subtle bg, solid bg, ring, badges, links, and gradients.
- `Button` and `Badge` accept an optional `topic` prop to apply semantic colors automatically.
- `Card` supports brand-aware glows via `glowColor="orange|blue|purple"`.
- `TopicLink` wraps `react-router-dom` `Link` or an anchor and applies semantic link styling by topic.

### Usage Examples

```tsx
<Badge topic="trades">Active</Badge>
<Badge topic="collaboration">Team</Badge>
<Badge topic="success">Rewards</Badge>
<Badge topic="community">Live</Badge>

<Button topic="trades">Browse Trades</Button>
<Button topic="collaboration">Start Collaboration</Button>

<TopicLink to="/trades" topic="trades">Browse Trades</TopicLink>
<TopicLink to="/users" topic="community">Browse Users</TopicLink>
```

### Notes

- Prefer semantic tokens over raw color utilities to avoid drift and to keep theming flexible.
- In dark mode, subtle backgrounds should pair with tokenized text colors for contrast.
- Keep gradients minimal and purposeful (hero, premium cards, primary CTAs).

### Home Page Semantics (canonical mapping)

- Trades (orange) on Home:
  - “Browse Trades” link/CTA: trades topic (orange) for label and arrow.
  - “Active Trades” stat: trades topic (orange).
- Completion (blue) on Home:
  - “Completed” stat remains blue to indicate completion status vs. trade category.
- Collaboration (purple): collaborations card, team/messages links.
- Community (blue): user directory and community links.
- Success (green): challenges and leaderboard links/badges.


