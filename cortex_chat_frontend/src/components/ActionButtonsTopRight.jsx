import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import styles from './ActionButtonsTopRight.module.css';

// Optional: Sound effect functions
const playHoverSound = () => {
  const audio = new Audio('/assets/sounds/hover.mp3');
  audio.volume = 0.3;
  audio.play().catch(e => console.warn("Audio play failed:", e));
};

const playClickSound = () => {
  const audio = new Audio('/assets/sounds/click.mp3');
  audio.volume = 0.5;
  audio.play().catch(e => console.warn("Audio play failed:", e));
};

const ActionButton = ({ to, text, type, onClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleClick = (e) => {
    e.preventDefault();
    playClickSound();
    setIsOpen(true);
    setTimeout(() => {
      navigate(to);
    }, 600);
  };

  return (
    <motion.div
      className={`${styles.cyberButton} ${type === 'signin' ? styles.btnSignin : styles.btnSignup} ${isOpen ? styles.open : ''}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={playHoverSound}
      onClick={handleClick}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 14, delay: type === 'signin' ? 0.6 : 0.75 }}
    >
      <span className={styles.buttonText}>{text}</span>
      <span className={styles.line1}></span>
      <span className={styles.line2}></span>
      <span className={styles.line3}></span>
      <span className={styles.line4}></span>
    </motion.div>
  );
};

const ActionButtonsTopRight = () => {
  return (
    <div className={styles.buttonsContainer}>
      <ActionButton to="/login" text="Sign In" type="signin" />
      <ActionButton to="/register" text="Sign Up" type="signup" />
    </div>
  );
};

export default ActionButtonsTopRight;