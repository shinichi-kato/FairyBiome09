import React, {useContext} from 'react';

import {AuthContext} from "../Auth/AuthProvider";

import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import EditIcon from '@mui/icons-material/Edit';

export default function UserAccount(){
  const auth = useContext(AuthContext);

  return (
    <Chip
      avatar={
        <Avatar
          aria-label="user"
          src={`../../avatar/${auth.photoURL}`} alt={auth.photoURL}/>
      }
      label={auth.displayName}
      onClick={auth.openUpdateDialog}
      deleteIcon={<EditIcon />}
    />
  )
}