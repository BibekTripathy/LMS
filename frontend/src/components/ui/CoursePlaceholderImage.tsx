import React from 'react';

interface CoursePlaceholderImageProps {
  category?: string;
  className?: string;
  accentColor?: string;
}

export const CoursePlaceholderImage: React.FC<CoursePlaceholderImageProps> = ({
  category = '',
  className = 'w-full h-full',
  accentColor = '#8caaee',
}) => {
  const cat = category.toLowerCase();

  // Pattern details based on subject
  let subtitle = 'Learning Module';
  let badge = 'COURSE';

  if (cat.includes('prog') || cat.includes('code') || cat.includes('script') || cat.includes('react') || cat.includes('python')) {
    subtitle = 'Code & Logic';
    badge = 'DEV';
  } else if (cat.includes('design') || cat.includes('ui') || cat.includes('ux')) {
    subtitle = 'UI / UX Design';
    badge = 'DESIGN';
  } else if (cat.includes('data') || cat.includes('machine') || cat.includes('ai') || cat.includes('science')) {
    subtitle = 'Data & AI Models';
    badge = 'DATA';
  } else if (cat.includes('cloud') || cat.includes('devops') || cat.includes('security')) {
    subtitle = 'Systems & Infra';
    badge = 'OPS';
  } else if (cat.includes('photo') || cat.includes('writ') || cat.includes('art')) {
    subtitle = 'Creative Craft';
    badge = 'ARTS';
  }

  return (
    <svg
      viewBox="0 0 320 160"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={`grad-${badge}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={accentColor} stopOpacity="0.22" />
          <stop offset="100%" stopColor={accentColor} stopOpacity="0.08" />
        </linearGradient>
        <pattern id={`grid-${badge}`} width="20" height="20" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="20" y2="0" stroke={accentColor} strokeOpacity="0.08" strokeWidth="1" />
          <line x1="0" y1="0" x2="0" y2="20" stroke={accentColor} strokeOpacity="0.08" strokeWidth="1" />
        </pattern>
      </defs>

      {/* Card canvas */}
      <rect width="100%" height="100%" fill={`url(#grad-${badge})`} />
      <rect width="100%" height="100%" fill={`url(#grid-${badge})`} />

      {/* Decorative wave / abstract geometry */}
      <circle cx="280" cy="20" r="60" fill={accentColor} fillOpacity="0.12" />
      <circle cx="40" cy="140" r="45" fill={accentColor} fillOpacity="0.09" />
      <path
        d="M-20,120 Q80,60 180,110 T340,80 L340,180 L-20,180 Z"
        fill={accentColor}
        fillOpacity="0.07"
      />

      {/* Center mini illustration card */}
      <g transform="translate(110, 32)">
        <rect
          width="100"
          height="68"
          rx="10"
          fill="#303446"
          fillOpacity="0.85"
          stroke={accentColor}
          strokeWidth="1.5"
          strokeOpacity="0.5"
        />

        {/* Browser / Canvas header dots */}
        <circle cx="16" cy="14" r="3" fill="#ea999c" />
        <circle cx="26" cy="14" r="3" fill="#e5c890" />
        <circle cx="36" cy="14" r="3" fill="#a6d189" />

        {/* Inner layout wireframe bars */}
        <rect x="14" y="26" width="72" height="7" rx="3" fill={accentColor} fillOpacity="0.9" />
        <rect x="14" y="38" width="50" height="5" rx="2" fill="#c6d0f5" fillOpacity="0.4" />
        <rect x="14" y="47" width="62" height="5" rx="2" fill="#c6d0f5" fillOpacity="0.25" />

        {/* Small badge icon */}
        <rect x="68" y="37" width="18" height="15" rx="3" fill={accentColor} fillOpacity="0.3" />
      </g>

      {/* Badge label in bottom corner */}
      <g transform="translate(18, 118)">
        <rect
          width="54"
          height="22"
          rx="6"
          fill="#303446"
          fillOpacity="0.7"
          stroke={accentColor}
          strokeWidth="1"
          strokeOpacity="0.4"
        />
        <text
          x="27"
          y="15"
          textAnchor="middle"
          fill="#c6d0f5"
          fontSize="10"
          fontWeight="bold"
          fontFamily="system-ui, sans-serif"
          letterSpacing="0.8"
        >
          {badge}
        </text>
      </g>

      {/* Topic Subtitle */}
      <text
        x="80"
        y="133"
        fill="#c6d0f5"
        fillOpacity="0.75"
        fontSize="11"
        fontWeight="500"
        fontFamily="system-ui, sans-serif"
      >
        {subtitle}
      </text>
    </svg>
  );
};
