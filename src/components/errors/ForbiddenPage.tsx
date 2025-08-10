import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './UnauthorizedPage.module.css';

const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.errorPage}>
      <h1>403 - Forbidden</h1>
      <p>You don't have permission to access this page.</p>
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

export default ForbiddenPage;
