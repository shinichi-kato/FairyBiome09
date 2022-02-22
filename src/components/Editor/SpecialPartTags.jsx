import React, { useMemo } from "react";
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';

import BodyPartIcon from '@mui/icons-material/AccessibilityNew';
import EmotionPartIcon from '@mui/icons-material/FavoriteBorder';

const specialParts = [
  {
    name: 'sleep',
    icon: <BodyPartIcon />,
    caption: '眠っている'
  },
  {
    name: 'sleepy',
    icon: <BodyPartIcon />,
    caption: '眠たい',
  },
  {
    name: 'wake',
    icon: <BodyPartIcon />,
    caption: '目がさめた',
  },
  {
    name: 'cheer',
    icon: <EmotionPartIcon />,
    caption: '気分がいい'
  },
  {
    name: 'down',
    icon: <EmotionPartIcon />,
    caption: '落ち込んでいる'
  }
];


export default function SpecialPartTags({handleSetPartName}) {

  const memorizedChips = useMemo(() =>
    specialParts.map(part =>
    <Chip icon={part.icon} label={`${part.name}(${part.caption})`}
      sx={{
        margin: 1
      }}
      clickable={true}
      onClick={e=>handleSetPartName(part.name) }
      key={part.name}
    />
    )
    , [])
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap'

      }}
    >
      {memorizedChips}
    </Box>
  )
}