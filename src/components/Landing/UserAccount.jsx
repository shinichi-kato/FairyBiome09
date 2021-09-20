import React, {useContext} from 'react';

import {FirebaseContext} from "../Firebase/FirebaseProvider";

import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import EditIcon from '@mui/icons-material/Edit';

export default function UserAccount(){
  const fb = useContext(FirebaseContext);

  return (
    <Chip
      avatar={
        <Avatar
          aria-label="user"
          src={`../../avatar/${fb.photoURL}`} alt={fb.photoURL}/>
      }
      label={fb.displayName}
      onClick={fb.openUpdateDialog}
      deleteIcon={<EditIcon />}
    />
  )
}