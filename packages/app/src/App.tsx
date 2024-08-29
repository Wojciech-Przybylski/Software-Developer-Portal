import React from 'react';
import { Route } from 'react-router-dom';
import { apiDocsPlugin, ApiExplorerPage } from '@backstage/plugin-api-docs';
import {
  CatalogEntityPage,
  CatalogIndexPage,
  catalogPlugin,
} from '@backstage/plugin-catalog';
import {
  CatalogImportPage,
  catalogImportPlugin,
} from '@backstage/plugin-catalog-import';
import { ScaffolderPage, scaffolderPlugin } from '@backstage/plugin-scaffolder';
import { orgPlugin } from '@backstage/plugin-org';
import { SearchPage } from '@backstage/plugin-search';
import { TechRadarPage } from '@backstage-community/plugin-tech-radar';
import {
  TechDocsIndexPage,
  techdocsPlugin,
  TechDocsReaderPage,
} from '@backstage/plugin-techdocs';
import { TechDocsAddons } from '@backstage/plugin-techdocs-react';
import { ReportIssue } from '@backstage/plugin-techdocs-module-addons-contrib';
import { UserSettingsPage } from '@backstage/plugin-user-settings';
import { apis } from './apis';
import { entityPage } from './components/catalog/EntityPage';
import { searchPage } from './components/search/SearchPage';
import { Root } from './components/Root';

import { AlertDisplay, OAuthRequestDialog, WarningPanel } from '@backstage/core-components';
import { createApp } from '@backstage/app-defaults';
import { AppRouter, FlatRoutes } from '@backstage/core-app-api';
import { CatalogGraphPage } from '@backstage/plugin-catalog-graph';

import { githubAuthApiRef } from '@backstage/core-plugin-api';
import { SignInPage } from '@backstage/core-components';

import { ThemeProvider } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import LightIcon from '@material-ui/icons/WbSunny';
import {
  createTheme,
  genPageTheme,
  lightTheme,
  shapes,
} from '@backstage/theme';
import { RequirePermission, usePermission } from '@backstage/plugin-permission-react';
import { HomepageCompositionRoot } from '@backstage/plugin-home';
import { GlobalOnboarding } from './components/onboarding/globalOnboarding';
import { fullAccess } from './customPermissions';
import { ChatGPTFrontendPage } from '@internal/plugin-chatgpt';
import { HomePage } from './components/home/HomePage';
import { catalogEntityCreatePermission } from '@backstage/plugin-catalog-common/alpha';


const myTheme = createTheme({
  palette: {
    ...lightTheme.palette,
    primary: {
      main: '#343b58',
    },
    secondary: {
      main: '#565a6e',
    },
    error: {
      main: '#8c4351',
    },
    warning: {
      main: '#8f5e15',
    },
    info: {
      main: '#34548a',
    },
    success: {
      main: '#485e30',
    },
    background: {
      default: '#d5d6db',
      paper: '#d0d1db',
    },
    banner: {
      info: '#34548a',
      error: '#8c4351',
      text: '#343b58',
      link: '#565a6e',
    },
    errorBackground: '#8c4351',
    warningBackground: '#8f5e15',
    infoBackground: '#343b58',
    navigation: {
      background: '#003d5a',
      indicator: '#a6be2c',
      color: '#d5d6db',
      selectedColor: '#ffffff',
    },
  },
  defaultPageTheme: 'home',
  fontFamily: 'Arial',
  /* below drives the header colors */
  pageTheme: {
    home: genPageTheme({ colors: ['#a6be2c', '#343b58'], shape: shapes.wave }),
    documentation: genPageTheme({
      colors: ['#a6be2c', '#343b58'],
      shape: shapes.wave2,
    }),
    tool: genPageTheme({colors: ['#a6be2c', '#343b58'], shape: shapes.round }),
    service: genPageTheme({
      colors: ['#a6be2c', '#343b58'],
      shape: shapes.wave,
    }),
    website: genPageTheme({
      colors: ['#a6be2c', '#343b58'],
      shape: shapes.wave,
    }),
    library: genPageTheme({
      colors: ['#a6be2c', '#343b58'],
      shape: shapes.wave,
    }),
    other: genPageTheme({ colors: ['#a6be2c', '#343b58'], shape: shapes.wave }),
    app: genPageTheme({ colors: ['#a6be2c', '#343b58'], shape: shapes.wave }),
    apis: genPageTheme({ colors: ['#a6be2c', '#343b58'], shape: shapes.wave }),
  },
});

const app = createApp({
  apis,
  components: {
    SignInPage: props => (
      <SignInPage
        {...props}
        auto
        provider={{
          id: 'github-auth-provider',
          title: 'GitHub',
          message: 'Sign in using GitHub',
          apiRef: githubAuthApiRef,
        }}
      />
    ),
  },
  bindRoutes({ bind }) {
    bind(catalogPlugin.externalRoutes, {
      createComponent: scaffolderPlugin.routes.root,
      viewTechDoc: techdocsPlugin.routes.docRoot,
      createFromTemplate: scaffolderPlugin.routes.selectedTemplate,
    });
    bind(apiDocsPlugin.externalRoutes, {
      registerApi: catalogImportPlugin.routes.importPage,
    });
    bind(scaffolderPlugin.externalRoutes, {
      registerComponent: catalogImportPlugin.routes.importPage,
      viewTechDoc: techdocsPlugin.routes.docRoot,
    });
    bind(orgPlugin.externalRoutes, {
      catalogIndex: catalogPlugin.routes.catalogIndex,
    });
  },
  themes: [{
    id: 'my-theme',
    title: 'My Custom Theme',
    variant: 'light',
    icon: <LightIcon />,
    Provider: ({ children }) => (
      <ThemeProvider theme={myTheme}>
        <CssBaseline>{children}</CssBaseline>
      </ThemeProvider>
    ),
  }]
})


const routes = (
  <FlatRoutes>
    <Route path="/" element={<HomepageCompositionRoot />}>
    <HomePage/>
    </Route>;
    <Route path="/catalog" element={<CatalogIndexPage />} />
    <Route
      path="/catalog/:namespace/:kind/:name"
      element={<CatalogEntityPage />}
    >
      {entityPage}
    </Route>
    <Route path="/docs" element={<TechDocsIndexPage />} />
    <Route
      path="/docs/:namespace/:kind/:name/*"
      element={<TechDocsReaderPage />}
    >
      <TechDocsAddons>
        <ReportIssue />
      </TechDocsAddons>
    </Route>
    <Route path="/create" element={<ScaffolderPage />} />
    <Route path="/api-docs" element={<ApiExplorerPage />} />
    <Route
      path="/tech-radar"
      element={<TechRadarPage width={1500} height={800} />}
    />
    <Route
      path="/catalog-import"
      element={
        <RequirePermission permission={catalogEntityCreatePermission}>
          <CatalogImportPage />
        </RequirePermission>
      }
    />
    <Route path="/search" element={<SearchPage />}>
      {searchPage}
    </Route>
    <Route path="/settings" element={<UserSettingsPage />} />
    <Route path="/catalog-graph" element={<CatalogGraphPage />} />
    <Route path="/onboarding" element={<GlobalOnboarding/>} />
    <Route path="/chatgpt" element={<ChatGPTFrontendPage />} />


  </FlatRoutes>
);
const tech_radar = (
  <FlatRoutes>
    <Route path="/" element={<HomepageCompositionRoot />}>
      <HomePage/>
    </Route>;
    <Route
      path="/catalog/:namespace/:kind/:name"
      element={<CatalogEntityPage />}
    >
      {entityPage}
    </Route>
    <Route
      path="/tech-radar"
      element={<TechRadarPage width={1650} height={800} />}
    />
    <Route path="/settings" element={<UserSettingsPage />} />
  </FlatRoutes>
);



function CheckPermission(_props:any) {
    
  const { loading: loadingPermission, allowed: readAllowed } = usePermission({permission: fullAccess, resourceRef: 'packages/backend/src/plugins/permission.ts',});
  
  let displayContent = <><AppRouter><Root>{routes}</Root></AppRouter></>;
  
  
  if (!loadingPermission && !readAllowed) {
       displayContent = <>
       <AppRouter><Root><WarningPanel severity= 'info' title= "Limited Access" message= 'You are not authorised to have full access to the platform. For further questions and queries about the software developer portal access contact: ............'/>{tech_radar}</Root></AppRouter></>;

  }
  return displayContent;
}


export default app.createRoot(
  <>
    <AlertDisplay />
    <OAuthRequestDialog />
    <CheckPermission>
      <AppRouter>
        <Root>{routes}{tech_radar}</Root>
      </AppRouter>
    </CheckPermission>
  </>,
);
