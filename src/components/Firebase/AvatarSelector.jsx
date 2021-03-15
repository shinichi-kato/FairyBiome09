import React from 'react';
import { graphql, useStaticQuery } from 'gatsby';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Avatar from '@material-ui/core/Avatar';

const query = graphql`
query a {
  allFile(filter: {sourceInstanceName: {eq: "avatar"}, absolutePath: {}, relativeDirectory: {eq: "user"}}) {
    edges {
      node {
        relativePath
        relativeDirectory
      }
    }
  }
}`;

const useStyles = makeStyles(theme => ({
  button: {
    borderRadius: 0,
    padding: 0,
  }
}));


export default function AvatarSelector(props) {
  const data = useStaticQuery(query);
  const classes = useStyles();

  return (
    data.allFile.edges.map(node => {
      const path = node.node.relativePath;
      return (
      <Button
        className={classes.button}
        color={props.photoURL===path ? "primary" : "default"}
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