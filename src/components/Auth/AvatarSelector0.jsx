import React from 'react';
import { graphql, useStaticQuery } from 'gatsby';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';

const query = graphql`
query  {
  allFile(filter: {sourceInstanceName: {eq: "user"}}) {
    edges {
      node {
        relativePath
        relativeDirectory
      }
    }
  }
}`;


export default function AvatarSelector(props) {
  const data = useStaticQuery(query);

  return (
    data.allFile.edges.map(node => {
      const path = node.node.relativePath;
      return (
      <Button
        sx={{
          borderRadius: 0,
          padding: 0,
        }}
        key={path}
        image={path}
        variant={props.photoURL===path ? "contained" : "text"}
        disableElevation={props.photoURL !== path}
        onClick={()=>{props.handleChangePhotoURL(path)}}
      >
        <Avatar src={`../../avatar/${path}`} alt={path}/>
      </Button>       
    )})
  );
}