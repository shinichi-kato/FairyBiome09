import React, { useState } from 'react';
import { navigate } from 'gatsby';
import { makeStyles } from '@material-ui/core/styles';
import Popover from '@material-ui/core/Popover';
import Slide from '@material-ui/core/Slide';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import ArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import ArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import WalkIcon from '@material-ui/icons/DirectionsWalk';
import EditIcon from '@material-ui/icons/Edit';
import ArrowBackIcon from '@material-ui/icons/ArrowBackIos';
import ForestIcon from './forest.inline.svg';
import HomeIcon from './home.inline.svg';
import ParkIcon from './park.inline.svg';

var undefined;

const useStyles = makeStyles(theme => ({
  root: {
    width: 480,
    left: 0,
    "@media (min-width: 481px)": {
      left: "calc((100% - 480px)  * 0.3)",
    },
    overflowY: "hidden",
    padding: theme.spacing(2),
    borderRadius: "0px 0px 20px 20px",
  },
  appMenu: {
    width: 480,
  },
  icon: {
    width: 120, // 24*x
    height: 140  // 28*x
  },
  main: {
    paddingTop: 200,
  },
  item: {
    textalign: 'center',
  },
}));



export default function AppMenu(props){
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = useState(false);

  function handleEdit(){
    navigate('/edit');
  }

  function handleReturnToTitle(){
    props.toTitlePage();
  }

  function handleClose(){
    setAnchorEl(null);
  }

  function handleOpen(event){
    setAnchorEl(event.currentTarget);
  }

  const open =Boolean(anchorEl);
  const id = open ? 'app-menu' : undefined;

  return (
    <>
      <IconButton
        aria-describedby={id}
        onClick={handleOpen}
      >
        <ArrowDownIcon />
      </IconButton>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorReference="none"
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        TransitionComponent={Slide}
        marginThreshold={0}
        PaperProps={{
          className:classes.root,
        }}
      >
        <AppMenuDialog
          handleEdit={handleEdit}
          handleReturnToTitle={handleReturnToTitle}
          handleClose={handleClose}/>
      </Popover>
    </>
  )
}

function AppMenuDialog(props){
  /* 
    ・家/森/公園への移動
    ・はじめにもどる
    ・データの保存
    ・編集画面へ移動
  */
  const classes = useStyles();
  return (
    <Grid container
      spacing={2}
      justify="space-around"
      alignItems="center"
      className={classes.root}
    >
      <Grid item xs={12}>
        <Typography><WalkIcon/>移動</Typography>
      </Grid>
      <Grid item xs={4}>
        <IconButton>
          <ForestIcon className={classes.icon}/>
        </IconButton>
      </Grid>
      <Grid item xs={4}>
        <IconButton>
          <HomeIcon className={classes.icon} />
        </IconButton>
      </Grid>
      <Grid item xs={4}>
        <IconButton disabled={true}>
          <ParkIcon  className={classes.icon}/>
        </IconButton>
      </Grid>
      <Grid item xs={12}
        className={classes.item}
      >
        <Button
          size="large"
          variant="contained"
          startIcon={<EditIcon />}
          onClick={props.handleEdit}
          fullWidth
        >
          編集
        </Button>
      </Grid>
      <Grid item xs={12}
        className={classes.item}
      >
        <Button
          size="large"
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={props.handleReturnToTitle}
          fullWidth
        >
          タイトル画面に戻る
        </Button>
      </Grid>
      
      <Grid item xs={12}
        className={classes.item}
      >
        
        <IconButton
          onClick={props.handleClose}
        >
          <ArrowUpIcon />
        </IconButton>
      </Grid>
      
    </Grid>
  )
}