import React, { useMemo } from 'react';
import { SkinType } from '@/types/game';

interface CloudLayerProps {
  speed: number;
  skin: SkinType;
}

interface Cloud {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  opacity: number;
}

export const CloudLayer: React.FC<CloudLayerProps> = ({ speed, skin }) => {
  // Generate random clouds
  const clouds = useMemo(() => {
    const cloudList: Cloud[] = [];
    for (let i = 0; i < 8; i++) {
      cloudList.push({
        id: i,
        x: Math.random() * 100,
        y: 5 + Math.random() * 25,
        width: 60 + Math.random() * 80,
        height: 20 + Math.random() * 30,
        speed: 0.02 + Math.random() * 0.03,
        opacity: 0.4 + Math.random() * 0.4,
      });
    }
    return cloudList;
  }, []);

  // Get cloud color based on skin
  const getCloudColor = () => {
    switch (skin) {
      case 'inverted':
        return 'rgba(50, 50, 50, 0.3)';
      case 'phosphor':
        return 'rgba(0, 100, 0, 0.3)';
      case 'amber':
        return 'rgba(100, 60, 0, 0.3)';
      case 'crt':
        return 'rgba(80, 80, 80, 0.3)';
      case 'neon':
        return 'rgba(50, 0, 50, 0.3)';
      case 'winter':
        return 'rgba(200, 230, 255, 0.6)';
      case 'golden':
        return 'rgba(255, 220, 150, 0.5)';
      default:
        return 'rgba(255, 255, 255, 0.8)';
    }
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {clouds.map((cloud) => {
        // Calculate position with parallax based on game speed
        const offset = (speed * cloud.speed) % 120;
        const xPos = ((cloud.x - offset + 120) % 120) - 10;

        return (
          <div
            key={cloud.id}
            className="absolute transition-transform duration-100"
            style={{
              left: `${xPos}%`,
              top: `${cloud.y}%`,
              width: `${cloud.width}px`,
              height: `${cloud.height}px`,
              opacity: cloud.opacity,
            }}
          >
            {/* Pixel cloud shape */}
            <svg
              viewBox="0 0 100 50"
              className="w-full h-full"
              style={{ filter: 'drop-shadow(2px 2px 0px rgba(0,0,0,0.1))' }}
            >
              <rect x="10" y="25" width="80" height="20" fill={getCloudColor()} />
              <rect x="5" y="30" width="15" height="15" fill={getCloudColor()} />
              <rect x="80" y="30" width="15" height="15" fill={getCloudColor()} />
              <rect x="20" y="15" width="25" height="20" fill={getCloudColor()} />
              <rect x="40" y="10" width="30" height="25" fill={getCloudColor()} />
              <rect x="60" y="18" width="20" height="17" fill={getCloudColor()} />
            </svg>
          </div>
        );
      })}
    </div>
  );
};
