import React from 'react'
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { graphql } from 'gatsby'
import MDXRenderer from "gatsby-plugin-mdx/mdx-renderer"
import { navigate } from "gatsby"



export const pageQuery = graphql`
  query StoryQuery($id: String) {
      mdx(id: { eq: $id }) {
          id
          body
      }
  }
`

export default function StoryTemplate({ data: { mdx } }) {

  function handleClick(){
    navigate('/create/?exec');
  }

  return (
      <Box
        sx={{
          width: "100%",
          height: "100vh",
        }}
        display="flex"
        flexDirection="column"
      >
        <Box
          sx={{
            width: "100%",
            height: "calc( 100vh - 100px )",
            overflowY: "scroll",
            overscrollBehavior: "auto",
            WebkitOverflowScrolling: "touch",
            padding: theme=>theme.spacing(2),
          }}
        >
          <Box
            sx={{padding: theme=>theme.spacing(2)}}
          >
            <MDXRenderer>{mdx.body}</MDXRenderer>
          </Box>
        </Box>
        <Box>
          <Button
            variant="contained"
            onClick={handleClick}
          >
            はじめる
          </Button>
        </Box>
      </Box>
  )
}
