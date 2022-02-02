require("dotenv").config();

module.exports = {
  flags: {
    DEV_WEBPACK_CACHE: true,
    PARALLEL_SOURCING: true,
    PARALLEL_QUERY_RUNNING: true,
  },
  siteMetadata: {
    title: `FairyBiome`,
    version: "0.9.1",
    description: `Small community chat with Ecosystem + Chatbot `,
    author: `skato21r@iris.eonet.ne.jp`,
    ecosystem: {
      randomSeed: 22563, // 1-65563
      changeRate: 0.00000001, // 天候変化の速度
      updateInterval: 6000, // msec, 天候表示のアップデート周期
    },
    chatbot: {
      allowUserOwnSystemBot: true, // @systemのボットをユーザがロードできる(開発用)
      logViewLength: 100, // 表示するログの長さ
      logStoreLength: 10000, // 保存するログの長さ
      forestEncounter: {
        randomSeed: 243, // 1-65563
        changeRate: 0.00000001, // 乱数の変化速度
        usersFairy: 0.98, // 0~1.00: 乱数がこの値以下ならfirestore上の妖精に出会う
        tutor: 0.99, // 0~1.00: 次に乱数がこの値以下ならtutorに出会う
      },
    },
    palette: [
      // based on autism color palette
      // https://www.color-hex.com/color-palette/10394
      '#3bb150bb', '#f5eb50bb', '#a52228bb', '#7acedcbb', '#212962bb', '#b68611bb'
    ]
  },
  plugins: [
    `gatsby-plugin-top-layout`,
    `gatsby-plugin-react-helmet`,
    `gatsby-plugin-mui-emotion`,
    {
      resolve: `gatsby-transformer-json`,
      options: {
        typeName: `Json`,
      },
    },
    {
      resolve: `gatsby-plugin-mdx`,
      options: {
        extensions: [`.md`, `.mdx`],
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/static/images`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `chatbot`,
        path: `${__dirname}/static/chatbot`,
      },
    },
    {
      resolve: "gatsby-source-filesystem",
      options: {
        path: `${__dirname}/static/avatar/`,
        name: "avatar",
        ignore: ["**/\.*"],
      },
    },
    {
      resolve: "gatsby-source-filesystem",
      options: {
        path: `${__dirname}/content/story`,
        name: "story",
        ignore: ["**/\.*"],
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `Chatroom FairyBiome`,
        short_name: `FairyBiome`,
        start_url: `/`,
        background_color: `#663399`,
        theme_color: `#663399`,
        display: `standalone`,
        icon: `src/images/fairybiome-icon.png`, // This path is relative to the root of the site.
      },
    },
    // this (optional) plugin enables Progressive Web App + Offline functionality
    // To learn more, visit: https://gatsby.dev/offline
    // `gatsby-plugin-offline`,
    // `gatsby-plugin-remove-serviceworker`,
    {
      resolve: "gatsby-plugin-react-svg",
      options: {
        rule: {
          include: /\.inline\.svg$/
        }
      }
    },
  ],
}

