import React, {useContext} from 'react';

import {FirebaseContext} from "../Firebase/FirebaseProvider";

import Avatar from '@material-ui/core/Avatar';
import Chip from '@material-ui/core/Chip';
import EditIcon from '@material-ui/icons/Edit';

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