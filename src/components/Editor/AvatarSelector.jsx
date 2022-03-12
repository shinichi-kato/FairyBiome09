import React, { useState } from "react";
import { styled } from '@mui/material/styles';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Collapse from '@mui/material/Collapse';

const ExpandMore = styled((props) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
}));

export default function AvatarSelector({
  avatarDir,
  avatar,
  handleChangeAvatar,
  avatarList
}) {
  /*
    avatarDirはgraphqlのrelativeDirectoryで、'cat_sith'など
    直下のディレクトリ名が渡ってくる。
  */

  const [expanded, setExpanded] = useState(false);

  const handleExpandClick = () => {
    setExpanded(prev => !prev);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Box>
        <img src={`../../chatbot/${avatarDir}/${avatar}.svg`}
          style={{
            width: 200,
          }}
          alt={avatar}
        />
      </Box>
      <Box>
        <ExpandMore
          expand={expanded}
          onClick={handleExpandClick}
          aria-expanded={expanded}
          aria-label="show more"
        >
          <ExpandMoreIcon />
        </ExpandMore>
      </Box>
      <Box>
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <ImageList
            sx={{
              width: 500,
              height: 500,
              transform: 'translateZ(0)'
            }}
            col={3}>
            {avatarList.map((x, index) => (
              <ImageListItem key={index}
                onClick={() => handleChangeAvatar(x)}
                sx={{
                  border: "4px solid",
                  borderColor: avatar === x ? 'primary.main' : '#FFFFFF',
                }}
              >
                <img src={`../../chatbot/${avatarDir}/${x}.svg`}
                  style={{
                    width: 200,
                  }}
                  alt={x}
                />
                <ImageListItemBar
                  title={x}
                />

              </ImageListItem>
            ))}

          </ImageList>
        </Collapse>
      </Box>
    </Box>
     )
}