import React from 'react';
import { themeClasses } from '../../utils/themeUtils';

const DefaultBanner: React.FC = () => {
  return (
    <div className={`p-4 rounded-md ${themeClasses.card} ${themeClasses.text}`}>
      <p>This is a default banner that adapts to the current theme.</p>
    </div>
  );
};

export default DefaultBanner;
