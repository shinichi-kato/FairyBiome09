import React from 'react';
import SvgIcon from '@mui/material/SvgIcon';

export default function PersonLargeIcon(props) {
  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="8.3" r="3.4" />
      <g transform="matrix(.54 0 0 .59 5.5 4.9)">
        <ellipse cx="12" cy="18" rx="12" ry="4.7" />
        <rect y="18" width="24" height="6" rx="0" />
      </g>
    </SvgIcon>
  )
}

