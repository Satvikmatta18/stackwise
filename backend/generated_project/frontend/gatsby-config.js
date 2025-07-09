/**
 * @type {import('gatsby').GatsbyConfig}
 */
module.exports = {
  siteMetadata: {
    title: `Random Color App`,
    siteUrl: `http://localhost:8000` // Default Gatsby development URL
  },
  plugins: [
    // Standard Gatsby plugins for image optimization (common in new Gatsby projects)
    `gatsby-plugin-image`,
    `gatsby-plugin-sharp`,
    `gatsby-transformer-sharp`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images` // Standard path for sourcing images
      }
    }
  ]
};
