import React, { useState, useEffect } from 'react';

const hexToRgb = (hex) => {
  try {
    const bigint = parseInt(hex.replace('#', ''), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `${r}, ${g}, ${b}`;
  } catch (e) {
    return '26, 43, 195'; // fallback blue
  }
};

const MagazineCard = ({ index, mapIndex, magazine, position, isSingle, isMobile, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const [currentCoverIndex, setCurrentCoverIndex] = useState(0);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    if (!hovered || !magazine.portada || magazine.portada.length <= 1 || imgFailed) {
      setCurrentCoverIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setCurrentCoverIndex((prev) => (prev + 1) % magazine.portada.length);
    }, 850);
    return () => clearInterval(interval);
  }, [hovered, magazine.portada, imgFailed]);

  // Alternate sizing rules (even original index elements are larger than odd ones)
  const width = isMobile
    ? (index % 2 === 0 ? '64vw' : '54vw')
    : position.width;

  const rgbColor = hexToRgb(magazine.color);

  // Double shadow style: deep dark shadow for overlapping card occlusion + colored shadow for background glow
  const boxShadow = hovered
    ? `15px 22px 30px rgba(0, 0, 0, 0.95), 8px 12px 25px rgba(${rgbColor}, 0.65)`
    : `8px 12px 18px rgba(0, 0, 0, 0.95), 4px 6px 12px rgba(${rgbColor}, 0.35)`;

  // Handle position and layout dynamically based on desktop vs mobile view
  const style = isMobile
    ? {
        position: 'relative',
        width,
        aspectRatio: '1 / 1.4', // aspect ratio fixes image warping and cropping on resize
        // On mobile, the first rendered card (mapIndex 0, which is the latest magazine due to reverse) has 0 margin-top.
        // Subsequent cards have a negative margin to cascade overlap.
        margin: mapIndex === 0 ? '0 auto' : '-22vw auto 0 auto',
        transform: `rotate(${position.rotation}deg) ${hovered ? 'scale(1.12)' : ''}`,
        zIndex: hovered ? 100 : mapIndex,
        boxShadow,
        transition: 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
      }
    : isSingle
    ? {
        position: 'relative', /* Flexbox centering inside single-magazine container */
        width,
        aspectRatio: '1 / 1.4', // maintains aspect ratio on any resolution
        transform: `rotate(${position.rotation}deg) ${hovered ? 'scale(1.12)' : ''}`,
        zIndex: hovered ? 100 : position.zIndex,
        boxShadow,
        transition: 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
      }
    : {
        position: 'absolute',
        top: position.top,
        left: position.left,
        width,
        aspectRatio: '1 / 1.4', // prevents independent height scaling that crops the cover image
        transform: `rotate(${position.rotation}deg) ${hovered ? 'scale(1.1)' : ''}`,
        // Stack order for desktop: when there are more than 6 magazines, the last ones appear at the top
        zIndex: hovered ? 100 : position.zIndex + Math.floor(index / 6) * 10,
        boxShadow,
        transition: 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
      };

  const hasCoverImage = magazine.portada && magazine.portada.length > 0 && !imgFailed;

  return (
    <div
      className={`magazine-card ${hovered ? 'hovered' : ''}`}
      style={style}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {hasCoverImage ? (
        <img
          src={magazine.portada[currentCoverIndex]}
          alt={magazine.title}
          className="magazine-cover-img"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div className="magazine-cover-fallback" style={{ backgroundColor: magazine.color }}>
          <div className="magazine-fallback-header">UNIDAD MINIMA</div>
          <div className="magazine-fallback-number">{magazine.id}</div>
          <div className="magazine-fallback-footer">{magazine.title.toUpperCase()}</div>
        </div>
      )}
    </div>
  );
};

export default MagazineCard;
