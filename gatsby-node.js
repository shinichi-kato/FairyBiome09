/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.com/docs/node-apis/
 */

// You can delete this file if you're not using it

const path = require("path");
const {createFilePath } = require("gatsby-source-filesystem");

exports.onCreateNode = ({node, actions, getNode}) => {

  const {createNodeField} = actions;

  if (node.internal.type === 'Mdx') {
    const value = createFilePath({ node, getNode});

    createNodeField({
      name: "slug",
      node,
      value: `/content${value}`,
    })
  }
}

exports.createPages = ({ actions, graphql }) => {
  const { createPage } = actions
  
  return graphql(`
      {
          allMdx {
              edges {
                  node {
                      id
                      fields {
                          slug
                      }
                  }
              }
          }
      }
  `).then(result => {
      // Handling Errors.
      if (result.errors) {
          return Promise.reject(result.errors)
      }

      // Create pages.
      result.data.allMdx.edges.forEach(({ node }) => {
          createPage({
              path: node.fields.slug,
              component: path.resolve(`./src/template/StoryTemplate.jsx`),
              context: {
                  // We can use the values in this context in our page layout component.
                  id: node.id
              },
          })
      })
  })
}

exports.onCreateWebpackConfig = ({ actions: { replaceWebpackConfig }, getConfig }) => {
    const config = getConfig()
  
    config.module.rules.push({
      test: /\.worker\.js$/,
      use: { loader: 'worker-loader' }
    })
  
    replaceWebpackConfig(config)
  }