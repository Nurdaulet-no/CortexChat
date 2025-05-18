// src/components/CursorParticles.jsx
import React, { useCallback } from 'react';
import Particles from 'react-tsparticles';
import { loadFull } from 'tsparticles';

const CursorParticles = () => {
  const particlesInit = useCallback(async (engine) => {
    await loadFull(engine);
  }, []);

  const options = {
    fpsLimit: 60,
    interactivity: {
      events: {
        onHover: {
          enable: true,
          mode: 'trail',
        },
      },
      modes: {
        trail: {
          delay: 0.005,
          pauseOnStop: false,
          quantity: 3,
          particles: {
            color: {
              value: '#ffffff',
              animation: {
                enable: true,
                speed: 40,
                sync: true,
              },
            },
            move: {
              outModes: {
                default: 'destroy',
              },
              speed: 2,
            },
            size: {
              value: { min: 1, max: 3 },
              animation: {
                enable: true,
                speed: 5,
                sync: false,
                startValue: 'min',
                destroy: 'max',
              },
            },
            opacity: {
              value: 0.7,
            },
          },
        },
      },
    },
    particles: {
      color: {
        value: '#ffffff',
      },
      move: {
        direction: 'none',
        enable: true,
        outModes: {
          default: 'destroy',
        },
        random: false,
        speed: 2,
        straight: false,
      },
      number: {
        density: {
          enable: true,
          area: 800,
        },
        value: 0, // No static particles, only trail
      },
      opacity: {
        value: 0.5,
      },
      shape: {
        type: 'circle',
      },
      size: {
        value: { min: 1, max: 5 },
      },
    },
    detectRetina: true,
    fullScreen: {
        enable: true,
        zIndex: 1 // Above Vanta (0 or -1), below UI content (10+)
    }
  };

  return (
    <Particles
      id="tsparticles-cursor"
      init={particlesInit}
      options={options}
      style={{
        position: 'fixed', // Ensure it covers the screen for cursor tracking
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1, // Keep this z-index consistent with options.fullScreen.zIndex
      }}
    />
  );
};

export default CursorParticles;