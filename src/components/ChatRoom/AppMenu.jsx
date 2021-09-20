import React, { useState } from 'react';
import Popover from '@mui/material/Popover';
import Slide from '@mui/material/Slide';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBackIos';

function AppMenuDialog(props){
  /*
    アプリケーションメニュー
    * 家/森/公園への移動
    * はじめにもどる
    * 
  */
}

export default function AppMenu(props) {
  /*
    アプリケーションメニューボタン
  */

  const [anchorEl, setAnchorEl] = useState(false);

  function handleClose() {
    setAnchorEl(null);
  }

  function handleOpen(event) {
    setAnchorEl(event.currentTarget);
  }

  return (
    <>
      <IconButton
        aria-describedby={id}
        onClick={handleOpen}
      >
        <ArrowBackIcon />
      </IconButton>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorReference="none"
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        TransitionComponent={Slide}
        marginThreshold={0}
        PaperProps={{
          className: classes.root,
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <AppMenuDialog
          handleEdit={handleEdit}
          handleReturnToTitle={handleReturnToTitle}
          handleClose={handleClose} />
      </Popover>
    </>
  )
}