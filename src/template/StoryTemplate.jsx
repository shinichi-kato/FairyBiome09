import React from 'react'
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import { graphql } from 'gatsby'
import MDXRenderer from "gatsby-plugin-mdx/mdx-renderer"
import { navigate } from "gatsby"

const useStyles = makeStyles((theme) => ({
  rootWhoseChildUsesFlexGrow: {
    width: "100%",
    height: "100vh",
    // backgroundImage: "url(../images/landing-bg.png)",
    // backgroundPosition: "center bottom",
  },
  content: {
    padding: theme.spacing(2),

  },
  grow: {
    width: "100%",
    height: "calc( 100vh - 100px )",
    overflowY: "scroll",
    overscrollBehavior: "auto",
    WebkitOverflowScrolling: "touch",
    padding: theme.spacing(2),
  },
}));

export const pageQuery = graphql`
  query StoryQuery($id: String) {
      mdx(id: { eq: $id }) {
          id
          body
      }
  }
`

export default function StoryTemplate({ data: { mdx } }) {
  const classes = useStyles();

  function handleClick(){
    navigate('/create/?exec');
  }

  return (
      <Box
        className={classes.rootWhoseChildUsesFlexGrow}
        display="flex"
        flexDirection="column"
      >
        <Box
          className={classes.grow}
        >
          <Box className={classes.content}>
            <MDXRenderer>{mdx.body}</MDXRenderer>
          </Box>
        </Box>
        <Box>
          <Button
            className={classes.button}
            variant="contained"
            onClick={handleClick}
          >
            はじめる
          </Button>
        </Box>
      </Box>
  )
}
