import React from 'react'
import { Accordion, AccordionSummary, Typography, AccordionDetails, CardContent, Grid, Button, CardActions } from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { useStyles } from './tab.module';

interface CardProps {
  name: string;
  created_at: string;
  region: string;
  accessability: "Public Access is Blocked" | "Public Access is Enabled";
  totalObjects: number;
  size: string;
  versioning: string[] | "Disabled";
  encryptionSatus: string;
  encryption: string | string[];
  tags: string;
  objectList: string;
  Link: string;
}

const Tab = ({ name, created_at, region, accessability, totalObjects, size, versioning, encryptionSatus, encryption, tags, objectList, Link,  ...rest }: CardProps): React.ReactElement => {
    const classes = useStyles();
  
    return (
      <Accordion classes={classes} aria-describedby={`title-${name}`} {...rest}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="panel1a-content"
        id="panel1a-header"
        className={classes.summaryContainer}
      >
        <div className={classes.summaryContent}>
          <Typography variant="h5" component="h2">{name}</Typography>
        </div>
        <Typography className={`${classes.accessibility} ${accessability !== 'Public Access is Blocked' ? classes.errorColor : classes.greenColor}`}>
          {accessability}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <CardContent>
          <Grid
            container
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Grid item>
              <Typography className={classes.pos} color="textSecondary">
                Region: {region}
              </Typography>
            </Grid>
            <Grid item>
              <Typography className={classes.pos} color="textSecondary">
                Creation Date: {created_at}
              </Typography>
            </Grid>
            <Grid item>
              <Typography className={classes.pos} color="textSecondary">
                ARN: arn:aws:s3:::{name}
              </Typography>
            </Grid>
          </Grid>
          <Grid
            container
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Grid item>
              <Typography className={classes.pos} color="textSecondary">
                Number of Objects: {totalObjects}
              </Typography>
            </Grid>
            <Grid item>
              <Typography className={classes.pos} color="textSecondary">
                Size: {size}
              </Typography>
            </Grid>
            <Grid item>
              <Typography className={classes.pos} color="textSecondary">
                Versioning: {versioning}
              </Typography>
            </Grid>
          </Grid>
          <Grid
            container
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Grid item>
              <Typography className={classes.pos} color="textSecondary">
                Encryption: {encryptionSatus} : {encryption}
              </Typography>
            </Grid>
            <Grid item>
              <Typography className={classes.pos} color="textSecondary">
                Tags: {tags}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </AccordionDetails>
      <AccordionDetails>
        <Accordion style={{ width: '100%' }}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="panel1a-header"
            className={classes.summaryContainer}
          >
            <div className={classes.summaryContent}>
              <Typography variant="h5" component="h2">Contents</Typography>
            </div>
          </AccordionSummary>
          <AccordionDetails>
            <CardActions>
        <Typography className={classes.pos} color="textSecondary" align="left">
          <pre>{objectList}</pre>
        </Typography>
            </CardActions>
          </AccordionDetails>
        </Accordion>
      </AccordionDetails>
            <CardActions>
              <Button size="small" href={Link} target="_blank">
                Link to S3 bucket
              </Button>
            </CardActions>
    </Accordion>
    );
  };
  
  export default Tab;