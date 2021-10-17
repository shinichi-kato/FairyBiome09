import React from 'react';
import SvgIcon from '@mui/material/SvgIcon';

export default function PersonLargeIcon(props) {
  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="5.8" r="5.7"/>
      <g transform="matrix(.92 0 0 1 1 0)">
        <ellipse cx="12" cy="18" rx="12" ry="4.7" />
        <rect y="18" width="24" height="6" rx="0" />
      </g>
    </SvgIcon>
  )
}
