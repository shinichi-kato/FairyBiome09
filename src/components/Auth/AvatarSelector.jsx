import React from 'react';
import { graphql, useStaticQuery } from 'gatsby';
import Box from '@mui/material/Box';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';

const query = graphql`
query {
  allFile(filter: {sourceInstanceName: {eq: "user"}, name: {eq: "avatar"}}) {
    nodes {
      relativeDirectory
    }
  }
}`;


export default function AvatarSelector(props) {
  const data = useStaticQuery(query);

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-around",
          overflow: 'hidden',
          backgroundColor: theme => theme.palette.background.paper,
          width: "100%"
        }}>
        <ImageList
          sx={{
            width: 500,
            height: 500,
            // Promote the list into his own layer on Chrome. This cost memory but helps keeping high FPS.
            transform: 'translateZ(0)',
          }}
          cols={3}
        >
          {data.allFile.nodes.map((dir, index) => (
            <ImageListItem key={index}
              onClick={() => { props.handleChangePhotoURL(dir) }}
              sx={{
                border: "4px solid",
                borderColor: dir === props.photoURL ? 'primary.main' : '#FFFFFF',
              }}
            >
              <img src={`../../user/${dir}/peace.svg`}
                style={{
                  width: 200,
                }}
                alt={dir}
              />
            </ImageListItem>
          ))}
        </ImageList>
      </Box>
    </>

  );
}