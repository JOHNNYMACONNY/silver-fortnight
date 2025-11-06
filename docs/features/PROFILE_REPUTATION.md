# Profile Reputation

## What is reputation?

Reputation is a composite score from 0–100 that reflects a user's activity and community standing.

## Formula

- XP: 50%
- Completed Trades: 30%
- Followers: 20%

Normalization caps ensure fairness across different activity scales:

- XP normalized by 5000 (i.e., min(1, XP/5000))
- Trades normalized by 100 (i.e., min(1, trades/100))
- Followers normalized by 1000 (i.e., min(1, followers/1000))

Composite score is: round(100 × (0.5×xpNorm + 0.3×tradesNorm + 0.2×followersNorm)).

## When does it update?

- When XP is awarded.
- When a follow/unfollow occurs (followers count changes).

The latest score and timestamp are cached in `socialStats.reputationScore` and `socialStats.reputationLastComputedAt`.

## Backfill

For existing users, run the backfill script to compute initial scores.

