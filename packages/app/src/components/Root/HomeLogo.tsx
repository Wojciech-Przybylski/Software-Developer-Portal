import React from 'react';
import { makeStyles } from '@material-ui/core';
import OnsLogoFull from './logos/ONS_HomePageLogo.svg';

const useStyles = makeStyles({
  svg: {
    width: 'auto',
    height: 210
  }
});


const HomeLogo = () => {
  const classes = useStyles();
  
  return <img src={OnsLogoFull} className={classes.svg}/>;
}

export default HomeLogo;

