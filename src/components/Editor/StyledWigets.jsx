import React from "react";
import { styled } from '@mui/material/styles';
import Slider from '@mui/material/Slider';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';

export const ItemPaper = styled(Paper)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  padding: theme.spacing(2),
}));

export const ParamSlider = styled(Slider)(({ theme }) => ({
  marginTop: 50,
  width: 350,
  marginLeft: 40,
}));

export const FabContainerBox = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: theme.spacing(4),
  right: theme.spacing(4),
}));
