import React from "react";
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItem';

function isBotIdentical(a,b){
  return (a.location === b.location && a.id === b.id);
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
          {props.fsChatbots.map((chatbot,index) => (
            <ImageListItem key={index}
              onClick={() => props.handleSelectBot(
                chatbot.location,
                chatbot.id,
                chatbot.directory
              )}
              sx={{
                border: "4px solid",
                borderColor: isBotIdentical(chatbot,props.botIdentifier) ? 'primary.main' : '#FFFFFF',
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
                title={chatbot.name}
                subtitle={chatbot.description}
                sx={{
                  flexGrow: 1,
                }}
              />
            </ImageListItem>
          ))}

        </ImageList>
      </Box>
      <Box>
        <Button
          onClick={props.handleNext}
          disabled={props.botIdentifier.botId===null}
        >この妖精にする</Button>
      </Box>
    </div>

  )
}