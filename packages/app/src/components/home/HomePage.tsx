/*
 * Copyright 2021 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
    HomePageToolkit,
    HomePageCompanyLogo,
    HomePageStarredEntities,
    TemplateBackstageLogo,
    TemplateBackstageLogoIcon,
  } from '@backstage/plugin-home';
import { Content, Page, InfoCard, GitHubIcon, HelpIcon, DashboardIcon } from '@backstage/core-components';
import {
MockStarredEntitiesApi,
} from '@backstage/plugin-catalog-react';
import { configApiRef } from '@backstage/core-plugin-api';
import { ConfigReader } from '@backstage/config';
import { HomePageSearchBar, searchPlugin } from '@backstage/plugin-search';
import {
searchApiRef,
SearchContextProvider,
} from '@backstage/plugin-search-react';
import { Grid, makeStyles } from '@material-ui/core';
import React, { ComponentType, PropsWithChildren } from 'react';
import HomeLogo from '../Root/HomeLogo';

const starredEntitiesApi = new MockStarredEntitiesApi();
starredEntitiesApi.toggleStarred('component:default/example-starred-entity');
starredEntitiesApi.toggleStarred('component:default/example-starred-entity-2');
starredEntitiesApi.toggleStarred('component:default/example-starred-entity-3');
starredEntitiesApi.toggleStarred('component:default/example-starred-entity-4');

const useStyles = makeStyles(theme => ({
searchBarInput: {
    maxWidth: '60vw',
    margin: 'auto',
    backgroundColor: theme.palette.background.paper,
    borderRadius: '50px',
    boxShadow: theme.shadows[1],
},
searchBarOutline: {
    borderStyle: 'none'
}
}));

const useLogoStyles = makeStyles(theme => ({
container: {
    margin: theme.spacing(5, 0),
},
svg: {
    width: 'auto',
    height: 100,
},
path: {
    fill: '#7df3e1',
},
}));

export const HomePage = (): React.JSX.Element => {

    const classes = useStyles();
    const { svg, path, container } = useLogoStyles();

    return <SearchContextProvider>
        <Page themeId="home">
            <Content>
            <Grid container justifyContent="center" spacing={6}>
                <HomePageCompanyLogo
                className={container}
                logo={<HomeLogo classes={{ svg, path }} />}
                />
                <Grid container item xs={12} justifyContent='center'>
                <HomePageSearchBar
                    InputProps={{ classes: { root: classes.searchBarInput, notchedOutline: classes.searchBarOutline }}}
                    placeholder="Search"
                />
                </Grid>
                <Grid container item xs={12}>
                <Grid item xs={12} md={6}>
                    <HomePageStarredEntities />
                </Grid>
                <Grid item xs={12} md={6}>
                    <HomePageToolkit
                    tools={[
                        {
                            url: 'https://github.com/ONSDigital',
                            label: 'GitHub',
                            icon: <GitHubIcon />,
                        },
                        {
                            url: 'https://jira.ons.gov.uk',
                            label: 'Jira',
                            icon: <DashboardIcon />
                        },
                        {
                            url: 'https://intranet.ons.statistics.gov.uk',
                            label: 'Reggie',
                            icon: <HelpIcon />,
                        }
                    ]}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <InfoCard title="Info card">
                        <h1>You could put an MOTD here!</h1>
                    </InfoCard>
                </Grid>
                </Grid>
            </Grid>
            </Content>
        </Page>
    </SearchContextProvider>
    };