import React from "react";
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';
import CloudDoneIcon from '@mui/icons-material/CloudDone';

function isBotIdentical(a, b) {
  return (a.location === b.location && a.id === b.id);
}

function toPastStr(date) {
  /* 
    UTCのdateについて
    0〜59分前の場合「x分前」、1〜23時間前の場合「x時間前」、1日以上の場合「x日前」
    の文字列を返す
  */
  const now = new Date();
  let delta = (now.getTime() - date.getTime()) / (1000 * 60);
  if (delta < 60) {
    return `${parseInt(delta)}分前`
  }
  delta /= 60;
  if (delta < 24) {
    return `${parseInt(delta)}時間前`
  }
  delta /= 24;
  return `${parseInt(delta)}日前`

}

export default function SelectStep(props) {
  return (
    <div>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-around',
          overflow: 'hidden',
          backgroundColor: theme => theme.palette.background.paper,
          width: '100%',
        }}
      >
        <ImageList
          sx={{
            width: 500,
            height: 500,
            // Promote the list into his own layer on Chrome. This cost memory but helps keeping high FPS.
            transform: 'translateZ(0)',
          }}
          cols={3}
        >
          {props.fsChatbots.map((chatbot, index) => (
            <ImageListItem key={index}
              onClick={() => props.handleSelectBot(
                chatbot.location,
                chatbot.id,
                chatbot.directory
              )}
              sx={{
                border: "4px solid",
                borderColor: isBotIdentical(chatbot, props.botIdentifier) ? 'primary.main' : '#FFFFFF',
              }}
            >
              <img src={`../../chatbot/${chatbot.directory}/peace.svg`}
                style={{
                  backgroundColor: chatbot.backgroundColor,
                  width: 200,
                }}
                alt={chatbot.directory}
              />
              <ImageListItemBar
                title={
                  <Box
                    sx={{ display:'flex', flexDirection:'row'}}
                  >
                    <Box sx={{ paddingRight: '4px'}}>
                      {chatbot.location === 'cloud' && <CloudDoneIcon />}
                    </Box>
                    <Box>
                      {chatbot.name}
                    </Box>

                  </Box>
                }
                subtitle={`${toPastStr(chatbot.timestamp)} - ${chatbot.description}`}
              />
            </ImageListItem>
          ))}

        </ImageList>
      </Box>
      <Box>
        <Button
          onClick={props.handleNext}
          disabled={props.botIdentifier.botId === null}
        >この妖精にする</Button>
      </Box>
    </div>

  )
}