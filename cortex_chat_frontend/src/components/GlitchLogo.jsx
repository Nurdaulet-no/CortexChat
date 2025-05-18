import React from 'react';
import styles from './GlitchLogo.module.css';

const GlitchLogo = () => {
  return (
    <div className={styles.logoContainer}>
      <div className={styles.blackHole}></div>
      <p className={styles.glitchText} data-text="DevilChat">
        CortexChat
      </p>
    </div>
  );
};

export default GlitchLogo;