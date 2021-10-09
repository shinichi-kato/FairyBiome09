import React, { useState } from 'react';
import Popover from '@mui/material/Popover';
import Slide from '@mui/material/Slide';
import IconButton from '@mui/material/IconButton';
import DirectionsIcon from '@mui/icons-material/Directions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import ForestIcon from '@mui/icons-material/Park';
import HomeIcon from '@mui/icons-material/Gite';
import ParkIcon from '@mui/icons-material/Deck';
import PersonPinIcon from '@mui/icons-material/PersonPinCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBackIos';

const buttonSx = {
  marginLeft: "2px",
  my: "8px",
  backgroundColor: "#ddddee",
  width: "64px",
  height: "64px",
};

function ButtonContent(props) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "50px",
        height: "50px",
        position: "relative"
      }}
    >
      <Box>
        {props.icon}
      </Box>
      <Box>
        {props.title}
      </Box>
      {props.currentSite === props.site &&
        <Box
          sx={{
            position: "absolute"
          }}
        >
          <PersonPinIcon sx={{
            position: "relative",
            color: "#dd4444",
            top: "-7px",
            left: "25px",
            width: "20px",
            height: "20px",
          }} />
        </Box>
      }
    </Box >
  )
}
function AppMenuDialog(props) {
  /*
    アプリケーションメニュー
    * 家/森/公園への移動
  */
  const site = props.site;
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Button
       startIcon={<ArrowBackIcon/>}
       onClick={props.handleExit}
      >
        メインメニュー
      </Button>
      <Button key="forest"
        sx={{
          ...buttonSx,
          marginLeft: "8px",
        }}
        disabled={site==='forest'}
        onClick={()=>props.handleChangeSite('forest')}
      >
        <ButtonContent
          icon={<ForestIcon />}
          title="森へ"
          site="forest"
          currentSite={site} />
      </Button>
      <Button key="park"
        sx={{
          ...buttonSx,
          marginLeft: "50px",
        }}
        disabled={site==='park'}
        onClick={()=>props.handleChangeSite('park')}
      >
        <ButtonContent
          icon={<ParkIcon />}
          title="公園へ"
          site="park"
          currentSite={site} />
      </Button>
      <Button key="room"
        sx={{
          ...buttonSx,
          marginLeft: "60px",
        }}
        disabled={site==='room'}
        onClick={()=>props.handleChangeSite('room')}
      >
        <ButtonContent
          icon={<HomeIcon />}
          title="家へ"
          site="room"
          currentSite={site} />
      </Button>
    </Box>

  )

}

export default function AppMenu(props) {
  /*
    アプリケーションメニューボタン
  */

  const [anchorEl, setAnchorEl] = useState(null);

  function handleClose() {
    setAnchorEl(null);
  }

  function handleOpen(event) {
    setAnchorEl(event.currentTarget);
  }

  const open = Boolean(anchorEl);
  const id = open ? 'app-menu-popover' : undefined;

  function handleChangeSite(site){
    handleClose();
    props.handleChangeSite(site);
  }

  return (
    <>
      <IconButton
        aria-describedby={id}
        onClick={handleOpen}
        sx={{ p: "10px" }}
      >
        <DirectionsIcon sx={{ transform: 'scaleX(-1)' }} />
      </IconButton>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        TransitionComponent={Slide}
        TransitionProps={{ direction: "right" }}
        marginThreshold={0}
        PaperProps={{
          sx: { padding: 2 }
        }}
      >
        <AppMenuDialog
          site={props.site}
          handleChangeSite={handleChangeSite}
          handleExit={props.handleExitRoom}
          handleClose={handleClose} />
      </Popover>
    </>
  )
}