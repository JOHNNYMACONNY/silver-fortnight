import React from 'react';
import Box from '../components/layout/primitives/Box';
import Stack from '../components/layout/primitives/Stack';

const HelpReputation: React.FC = () => {
  return (
    <Box className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Stack gap="lg">
        <h1 className="text-3xl font-bold text-foreground">Reputation</h1>
        <p className="text-muted-foreground">
          Reputation is a composite score from 0–100 that reflects your activity and community standing.
        </p>
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Formula</h2>
          <ul className="list-disc pl-6 text-muted-foreground">
            <li>XP: 50%</li>
            <li>Completed Trades: 30%</li>
            <li>Followers: 20%</li>
          </ul>
          <p className="text-muted-foreground mt-3">
            Normalization caps: XP/5000, trades/100, followers/1000. Composite = round(100 × (0.5×xpNorm + 0.3×tradesNorm + 0.2×followersNorm)).
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">When does it update?</h2>
          <ul className="list-disc pl-6 text-muted-foreground">
            <li>When XP is awarded</li>
            <li>When you gain or lose followers</li>
          </ul>
        </div>
      </Stack>
    </Box>
  );
};

export default HelpReputation;

