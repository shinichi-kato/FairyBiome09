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
    borderRadius: "0% 100% 100% 0% / 100% 100% 0% 0%",
    backgroundColor: theme.palette.primary.main
  },
  portrait: {
    width: 192,
    height: 256,
    
  }
}));


export default function FairyPanel(props) {
  const classes = useStyles();

  return (

    <Box
      className={classes.container}
      position="relative">
      <Box
        className={classes.backdrop}
        position="absolute"
        bottom={0}
        left={0}
      />
      <Box className={classes.portrait}
        position="absolute"
        bottom={0}
        right={0}
      >
        <img
        className={classes.portrait}
          src={props.photoURL}
          alt="" />
      </Box>

    </Box>

  )
}