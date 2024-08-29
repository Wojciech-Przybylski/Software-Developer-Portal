import { makeStyles, Theme, createStyles } from '@material-ui/core';

export const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    bullet: {
      display: 'inline-block',
      margin: '0 2px',
      transform: 'scale(0.8)',
    },
    title: {
      fontSize: 14,
    },
    pos: {
      marginBottom: 12,
    },
    root: {
      flexGrow: 1,
    },
    paper: {
      height: 140,
      width: 100,
    },
    control: {
      padding: theme.spacing(2),
    },
    heading: {
      fontSize: theme.typography.pxToRem(15),
    },
    summaryContainer: {
      display: 'flex',
      justifyContent: 'space-between',
    },
    summaryContent: {
      display: 'flex',
      alignItems: 'center',
    },
    accessibility: {
      marginLeft: 'auto',
    },
    greenColor: {
      color: 'green',
    },
    errorColor: {
      color: theme.palette.error.main,
    },
  })
);