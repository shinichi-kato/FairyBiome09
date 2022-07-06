import React, { useContext } from 'react';

import { AuthContext } from "../Auth/AuthProvider";

import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import EditIcon from '@mui/icons-material/Edit';

function readBackgroundColor() {
  if (window) {
    return window.localStorage.getItem('backgroundColor');
  }
  return null;
}

export default function UserAccount() {
  const auth = useContext(AuthContext);

  return (
    <Chip
      avatar={
        <Avatar
          aria-label="user"
          src={`../../user/${auth.photoURL}/avatar.svg`} 
          alt={auth.photoURL}
          sx={{ backgroundColor: readBackgroundColor() }} />
      }
label = { auth.displayName }
onClick = { auth.openUpdateDialog }
deleteIcon = {< EditIcon />}
/>
  )
}