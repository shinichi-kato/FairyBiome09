import React, { useContext } from "react";
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';

import { FirebaseContext } from '../Firebase/FirebaseProvider';

const useStyles = makeStyles(theme => ({
  container: {
    width: 192,
    height: 256,
  },
  backdrop: {
    width: 192,
    height: 192,
    borderRadius: "100% 0% 0% 100% / 100% 100% 0% 0%",
    backgroundColor: theme.palette.primary.main
  },
  avatar: {
    width: 192,
    height: 192
  },
  portrait: {
    width: 192,
    height: 256,
    // transform: ''
  }
}));


export default function UserPanel(props) {
  const fb = useContext(FirebaseContext);
  const classes = useStyles();
  console.log("photourl", fb.photoURL)

  return (
    <Box
    className={classes.container}
    position="relative">
      <Box
        className={classes.backdrop}
        position="absolute"
        bottom={0}
        right={0}
      />
      <Box className={classes.portrait}
        position="absolute"
        bottom={0}
        right={0}
      >
        <img
          className={classes.portrait}
          src={`/avatar/${fb.photoURL}`}
          alt={fb.photoURL} />
      </Box>

    </Box>

  )
}