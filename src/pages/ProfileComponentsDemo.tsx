import React, { useState } from 'react';
import ProfileBanner from '../components/ui/ProfileBanner';
import type { BannerData } from '../utils/imageUtils';
import { ReputationBadge } from '../components/ui/ReputationBadge';
import SkillBadge from '../components/ui/SkillBadge';
import SkillSelector from '../components/ui/SkillSelector';
import type { Skill } from '../types/collaboration';
import ProfileCard from '../components/ui/ProfileCard';
import ProfileHoverCard from '../components/ui/ProfileHoverCard';

export const ProfileComponentsDemo: React.FC = () => {
  const [bannerURL, setBannerURL] = useState<string | BannerData>('');
  const [skills, setSkills] = useState<Skill[]>([
    { id: '1', name: 'React', level: 'expert' },
    { id: '2', name: 'TypeScript', level: 'expert' },
    { id: '3', name: 'UI Design', level: 'intermediate' },
    { id: '4', name: 'Node.js', level: 'intermediate' },
    { id: '5', name: 'Firebase', level: 'beginner' }
  ]);

  // Sample user data for demo
  const sampleUser = {
    userId: 'user123',
    displayName: 'Jane Smith',
    photoURL: 'https://randomuser.me/api/portraits/women/44.jpg',
    location: 'San Francisco, CA',
    joinDate: new Date(2022, 5, 15),
    bio: 'Full-stack developer with a passion for creating beautiful and functional web applications.',
    skills: skills,
    reputationScore: 85
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-card rounded-lg shadow-sm border border-border p-6">
        <h1 className="text-3xl font-bold text-foreground mb-8">Profile Components Demo</h1>

        <div className="space-y-12">
          {/* Profile Banner */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Profile Banner</h2>
            <div className="space-y-4">
              <ProfileBanner
                bannerUrl={bannerURL}
                isEditable={true}
                onBannerChange={(data: BannerData) => setBannerURL(data)}
                onBannerRemove={() => setBannerURL('')}
                height="md"
              />
              <p className="text-sm text-muted-foreground">
                Try clicking on the banner to upload an image.
              </p>
            </div>
          </section>

          {/* Reputation Badge */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Reputation Badges</h2>
            <div className="flex flex-wrap gap-4">
              <div>
                <ReputationBadge score={95} />
                <p className="text-sm text-muted-foreground mt-1">Elite (95)</p>
              </div>
              <div>
                <ReputationBadge score={82} />
                <p className="text-sm text-muted-foreground mt-1">Expert (82)</p>
              </div>
              <div>
                <ReputationBadge score={65} />
                <p className="text-sm text-muted-foreground mt-1">Advanced (65)</p>
              </div>
              <div>
                <ReputationBadge score={45} />
                <p className="text-sm text-muted-foreground mt-1">Intermediate (45)</p>
              </div>
              <div>
                <ReputationBadge score={25} />
                <p className="text-sm text-muted-foreground mt-1">Beginner (25)</p>
              </div>
            </div>
          </section>

          {/* Skill Badges */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Skill Badges</h2>
            <div className="flex flex-wrap gap-2">
              <SkillBadge skill="React" level="expert" />
              <SkillBadge skill="TypeScript" level="expert" />
              <SkillBadge skill="UI Design" level="intermediate" />
              <SkillBadge skill="Node.js" level="intermediate" />
              <SkillBadge skill="Firebase" level="beginner" />
            </div>
          </section>

          {/* Skill Selector */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Skill Selector</h2>
            <SkillSelector
              selectedSkills={skills}
              onChange={setSkills}
              maxSkills={10}
            />
          </section>

          {/* Profile Card */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Profile Card</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ProfileCard
                userId={sampleUser.userId}
                displayName={sampleUser.displayName}
                photoURL={sampleUser.photoURL}
                location={sampleUser.location}
                joinDate={sampleUser.joinDate}
                bio={sampleUser.bio}
                skills={sampleUser.skills}
                reputationScore={sampleUser.reputationScore}
              />
              
              <ProfileCard
                userId="user456"
                displayName="John Doe"
                photoURL="https://randomuser.me/api/portraits/men/32.jpg"
                location="New York, NY"
                joinDate={new Date(2021, 2, 10)}
                bio="UX designer with a background in psychology."
                  skills={[
                    { id: '1', name: 'UI/UX', level: 'expert' },
                    { id: '2', name: 'Figma', level: 'intermediate' },
                    { id: '3', name: 'User Research', level: 'intermediate' }
                  ]}
                reputationScore={72}
              />
            </div>
          </section>

          {/* Profile Hover Card */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Profile Hover Card</h2>
            <p className="mb-4">
              Hover over the names below to see profile previews:
            </p>
            <div className="space-y-2">
              <div>
                <ProfileHoverCard
                  userId={sampleUser.userId}
                  displayName={sampleUser.displayName}
                  photoURL={sampleUser.photoURL}
                  bio={sampleUser.bio}
                  skills={sampleUser.skills}
                  reputationScore={sampleUser.reputationScore}
                >
                  <span className="text-primary font-medium cursor-pointer">
                    {sampleUser.displayName}
                  </span>
                </ProfileHoverCard>
                {' '}is a full-stack developer based in San Francisco.
              </div>
              
              <div>
                <span>I recently collaborated with </span>
                <ProfileHoverCard
                  userId="user456"
                  displayName="John Doe"
                  photoURL="https://randomuser.me/api/portraits/men/32.jpg"
                  bio="UX designer with a background in psychology."
                  skills={[
                    { id: '1', name: 'UI/UX', level: 'expert' },
                    { id: '2', name: 'Figma', level: 'intermediate' },
                    { id: '3', name: 'User Research', level: 'intermediate' }
                  ]}
                  reputationScore={72}
                >
                  <span className="text-primary font-medium cursor-pointer">
                    John Doe
                  </span>
                </ProfileHoverCard>
                <span> on a design collaboration.</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ProfileComponentsDemo;
