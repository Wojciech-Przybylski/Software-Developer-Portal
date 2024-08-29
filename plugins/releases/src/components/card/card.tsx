import React from 'react'
import { Accordion, AccordionSummary, Typography, AccordionDetails, CardContent, Grid, CardActions, Button } from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { useStyles } from './card.module';
import Markdown from 'markdown-to-jsx';

// Define the properties expected in the Card component
interface CardProps {
    name: string;
    created_at: string;
    assets: { [name: string]: string[] };
    body: string;
    prerelease: boolean;
    isNewest: boolean;
    author: string;
    url: string;
    message: string;
}

const Card = ({ name, created_at, assets, body, prerelease, isNewest, author, url, message }: CardProps): React.ReactElement => {
    // Use custom styles from the card module
    const classes = useStyles(); 
    
    return (
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
          id="panel1a-header"
          className={classes.summaryContainer}
        >
          <Typography variant="h5" component="h2">{name}</Typography>
          {/* Display 'Latest' if the release is the newest */}
          <Typography variant="h5" component="h2" className={`${classes.accessibility} ${isNewest ? classes.greenColor : classes.errorColor }`}>
            {isNewest && 'Latest'}
            {/* Display 'Prerelease' if the release is a prerelease */}
            <Typography variant="h5" component="h2" className={`${classes.accessibility} ${prerelease ? classes.PrereleaseColor : classes.errorColor}`}>
              {prerelease && 'Prerelease'}
            </Typography>
          </Typography>
          <Typography className={classes.accessibility}>
            <Typography>
              {author}
            </Typography>
            {/* Format and display the creation date */}
            {new Date(created_at).toLocaleString()}
          </Typography>
        </AccordionSummary>
        
        <AccordionDetails>
          <CardContent>
            <Grid container direction="row" justifyContent="space-between" alignItems="flex-start">
              <div>
                <Typography variant="h5" component="h2">Commit Message</Typography>
                <Typography className={classes.pos} color="textPrimary">
                  {/* Render the commit message using Markdown */}
                  <Markdown>{message || 'Not present'}</Markdown>
                </Typography>
              </div>
              <div>
                <Typography variant="h5" component="h2">Description</Typography>
                <Typography className={classes.pos} color="textPrimary">
                  {/* Render the release description using Markdown */}
                  <Markdown>{body || 'Not present'}</Markdown>
                </Typography>
              </div>
              <div>
                <Typography variant="h5" component="h2">Assets</Typography>
                {/* Iterate over the assets and display each one */}
                {Object.entries(assets).map(([assetName, assetData]) => (
                  <div key={assetName}>
                    <Grid container direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Grid item> 
                        {/* Link to the asset download URL */}
                        <a href={assetData.browser_download_url}>
                          <Typography className={classes.pos} color="primary">
                            {assetData.name}
                          </Typography>
                        </a>
                      </Grid>
                      <Grid item> 
                        {/* Display the size of the asset in KB */}
                        <Typography className={classes.pos} color="textSecondary">
                          {Math.round(assetData.size / 1024 * 10) / 10}KB
                        </Typography>
                      </Grid>
                    </Grid>
                  </div>
                ))}
              </div>
            </Grid>
            <CardActions>
              {/* Button to navigate to the release URL */}
              <Button size="small" href={url} target="_blank">
                Link to release
              </Button>
            </CardActions>
          </CardContent>
        </AccordionDetails>
      </Accordion>
    );
};

export default Card;
