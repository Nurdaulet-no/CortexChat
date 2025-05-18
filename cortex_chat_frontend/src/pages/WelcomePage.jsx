import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import GLOBE from 'vanta/dist/vanta.globe.min.js';
import * as THREE from 'three';
import '../styles/WelcomePage.css'; // Styles for Vanta container & top-left area

import CursorParticles from '../components/CursorParticles';
import GlitchLogo from '../components/GlitchLogo';
import ActionButtonsTopRight from '../components/ActionButtonsTopRight';

const WelcomePage = () => {
  const [vantaEffect, setVantaEffect] = useState(null);
  const vantaRef = useRef(null); // This ref will now be for the fixed background div

  useEffect(() => {
    if (!vantaEffect && vantaRef.current) {
      setVantaEffect(
        GLOBE({
          el: vantaRef.current, // Attach Vanta to the new fixed background div
          THREE: THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          scale: 1.00,
          scaleMobile: 1.00,
          color: 0xffc973, // Globe lines color
          backgroundColor: 0x070b12, // Background for Vanta canvas
        })
      );
    }
    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, [vantaEffect]);

  const pageVariants = {
    initial: { opacity: 0 },
    in: { opacity: 1 },
    out: { opacity: 0 },
  };

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.8,
  };

  return (
    <>
      <CursorParticles />
      {/* 1. Dedicated Vanta Background Container (Fixed) */}
      <div ref={vantaRef} className="vanta-background-fixed"></div>

      {/* 2. Main Page Content Container (for motion and layout) */}
      <motion.div
        className="welcome-page-container" // This container is for content, not Vanta
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
      >
        {/* 3. Fixed Top Bar */}
        <div className="top-bar-content-wrapper">
          <div className="top-left-content-area">
            <GlitchLogo />
          </div>
          <div className="top-right-content-area">
            <ActionButtonsTopRight />
          </div>
        </div>

        {/* 4. Scrollable Content Area */}
        <div className="scrollable-content">
          <section className="content-section about-chat-section">
            <h2>About Our Chat</h2>
            <p>
              Welcome to our revolutionary chat platform! We aim to connect people
              seamlessly and securely. Our application is built with cutting-edge
              technology to provide a smooth and intuitive user experience.
            </p>
            <p>
              Whether you're looking to connect with friends, collaborate on projects,
              or build communities, our platform offers the tools you need.
            </p>
          </section>

          <section className="content-section features-section">
            <h2>Key Features</h2>
            <ul>
              <li>Real-time messaging with instant notifications.</li>
              <li>End-to-end encryption for secure conversations.</li>
              <li>Customizable user profiles and themes.</li>
              <li>Group chats and channel creation.</li>
              <li>File sharing and rich media support.</li>
              <li>Cross-platform compatibility (Desktop & Mobile).</li>
            </ul>
          </section>

          <section className="content-section last-about-chat-section">
            <h2>More About Us</h2>
            <p>
              Our mission is to foster communication and make the world a more
              connected place. We are constantly innovating and adding new features
              based on user feedback.
            </p>
            <p>
              Join our growing community and experience the future of communication.
            </p>
          </section>

          <section className="content-section contact-section">
            <h2>Contact & Support</h2>
            <p>
              Have questions, suggestions, or need support? We're here to help!
            </p>
            <div className="contact-info">
              <p><strong>Email:</strong> support@ourchatapp.com</p>
              <p><strong>Community Forum:</strong> forum.ourchatapp.com</p>
              <p><strong>FAQ:</strong> ourchatapp.com/faq</p>
            </div>
          </section>

          <footer className="footer-section">
            <p>© {new Date().getFullYear()} OurChatApp. All rights reserved.</p>
            <p>Privacy Policy | Terms of Service</p>
          </footer>
        </div>
      </motion.div>
    </>
  );
};

export default WelcomePage;