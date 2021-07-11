import React, { useState } from 'react';
import Popover from '@material-ui/core/Popover';
import Slide from '@material-ui/core/Slide';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import ArrowBackIcon from '@material-ui/icons/ArrowBackIos';

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