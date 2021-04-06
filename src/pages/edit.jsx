import React from "react";
import { graphql,Link } from "gatsby"
import FirebaseProvider from "../components/Firebase/FirebaseProvider";

export const query = graphql`
  {
    allJson {
      nodes {
        main {
          NAME
          CREATOR_NAME
        }
        parent {
          ... on File {
            relativeDirectory
          }
        }
        config {
          backgroundColor
          description
        }
      }
    }
  }
`

export default function EditPage({ location, data }) {
  /*
    チャットボット編集ページ   
{
  "data": {
    "allJson": {
      "nodes": [
        {
          "main": {
            "NAME": "ティピカ",
            "CREATOR_NAME": "system"
          },
          "parent": {
            "relativeDirectory": "tipica"
          },
          "config": {
            "backgoundColor": "#EE0000",
            "description": "説明"
          }
        }
      ]
    }
  }
  
  */

  return (
    <FirebaseProvider>
      chatbot 編集ページ
      <Link to="/">チャットルームに戻る</Link>
    </FirebaseProvider>
  )
}
