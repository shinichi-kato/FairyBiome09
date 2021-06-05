import React from "react";
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';


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
  const classes = useStyles();
  const user = props.user;
  console.log("photourl", user.photoURL)

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
          src={`/avatar/${user.photoURL}`}
          alt={user.photoURL} />
      </Box>

    </Box>

  )
}