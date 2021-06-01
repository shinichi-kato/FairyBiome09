import React,{useContext} from "react";
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Avatar from '@material-ui/core/Avatar';
import {FirebaseContext} from '../Firebase/FirebaseProvider';

const useStyles = makeStyles(theme => ({
  container: {
    width: 180,
    height: 180,
    borderRadius: "100% 0% 0% 100% / 100% 100% 0% 0%",
    backgroundColor: theme.palette.primary.main
  },
  avatar:{
    width: 160,
    height: 160
  }
}));


export default function UserPanel(props){
  const fb = useContext(FirebaseContext);
  const classes = useStyles();
  console.log("photourl",fb.photoURL)

  return (

    <div className={classes.container}>
      <Avatar alt={fb.photoURL} src={fb.photoURL} className={classes.avatar}/>
      <Typography>{fb.displayName}</Typography> 
    </div>
    
  )
}