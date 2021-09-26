import React from 'react';
import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

export default function MessageSnackbar(props) {

  const action = (
  <>
  <IconButton
    size="small"
    aria-label="close"
    color="inherit"
    onClick={props.handleClose}
    >
      <CloseIcon fontSize="small"/>
    </IconButton>
  </>);

  return (
    <Snackbar
    open={props.open}
    onClose={props.handleClose}
    message={props.message}
    action={action}
  />

  )
}