import React from "react";
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';

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

  return (
    <ImageList
      sx={{
        width: 500,
        height: 500,
        transform: 'translateZ(0)'
      }}
      col={3}>
      {avatarList.map((x, index) => (
        <ImageListItem key={index}
          onClick={() => handleChangeAvatar()}
          sx={{
            border: "4px solid",
            borderColor: avatar === x ? 'primary.main' : '#FFFFFF',
          }}
        >
          <img src={`{../../chatbot/${avatarDir}/${avatar.svg}`}
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

  )
}