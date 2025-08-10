import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './UnauthorizedPage.module.css';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.errorPage}>
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist or has been moved.</p>
      <div className={styles.errorActions}>
        <button 
          onClick={() => navigate(-1)}
          className={styles.primaryButton}
        >
          Go Back
        </button>
        <button 
          onClick={() => navigate('/')}
          className={styles.secondaryButton}
        >
          Go to Home
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;
