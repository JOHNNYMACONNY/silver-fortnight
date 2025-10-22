import React from 'react';
import { mockUser } from '@/data/mockUser';

const UserProfilePage: React.FC = () => {
  return (
    <div>
      <img src={mockUser.profilePicture} alt={mockUser.name} />
      <h1>{mockUser.name}</h1>
      <p>{mockUser.email}</p>
      <p>{mockUser.bio}</p>
      <div>
        <span>{mockUser.followers} Followers</span>
        <span>{mockUser.following} Following</span>
      </div>
      <div>
        <h2>Posts</h2>
        <ul>
          {mockUser.posts.map(post => (
            <li key={post.id}>
              <h3>{post.title}</h3>
              <p>{post.content}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default UserProfilePage;
