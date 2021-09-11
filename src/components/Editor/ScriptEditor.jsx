import React, { useState, useContext, useEffect } from "react";
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Paper from '@material-ui/core/Paper';
import Fab from '@material-ui/core/Fab';
import SaveIcon from '@material-ui/icons/SaveAlt';
import { DataGrid } from '@material-ui/data-grid';
import { BiomebotContext } from '../biomebot/BiomebotProvider';

export default function ScriptEditor() {
  const bot = useContext(BiomebotContext);

  return (
    <Box>

    </Box>
  )
}