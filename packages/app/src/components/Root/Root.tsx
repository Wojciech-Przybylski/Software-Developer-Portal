import React, { PropsWithChildren } from 'react';
import { makeStyles } from '@material-ui/core';
import HomeIcon from '@material-ui/icons/Home';
import ExtensionIcon from '@material-ui/icons/Extension';
import MapIcon from '@material-ui/icons/MyLocation';
import LibraryBooks from '@material-ui/icons/LibraryBooks';
import CreateComponentIcon from '@material-ui/icons/AddCircleOutline';
import {
  Settings as SidebarSettings,
  UserSettingsSignInAvatar,
} from '@backstage/plugin-user-settings';
import { SidebarSearchModal } from '@backstage/plugin-search';
import {
  Sidebar,
  sidebarConfig,
  SidebarDivider,
  SidebarGroup,
  SidebarItem,
  SidebarPage,
  SidebarScrollWrapper,
  SidebarSpace,
  useSidebarOpenState,
  Link,
  WarningPanel,
} from '@backstage/core-components';
import MenuIcon from '@material-ui/icons/Menu';
import SearchIcon from '@material-ui/icons/Search';
import OnboardingIcon from '../../Onboarding.icon.svg';
import CatalogIcon from '../../catalog.icon.svg';
import MyCustomLogoFull from '../../logo.png';
import MyCustomLogoIcon from '../../logoIcon.png';
import { usePermission } from '@backstage/plugin-permission-react';
import { fullAccess, techRadarAccess } from '../../customPermissions';
import LiveHelp from '@material-ui/icons/LiveHelp';



const LogoFull = () => {
  return <img src={MyCustomLogoFull} />;
};

const LogoIcon = () => {
  return <img src={MyCustomLogoIcon} />;
};




const useSidebarLogoStyles = makeStyles({
  root: {
    width: sidebarConfig.drawerWidthClosed,
    height: 3 * sidebarConfig.logoHeight,
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'center',
    marginBottom: -14,
  },
  link: {
    width: sidebarConfig.drawerWidthClosed,
    marginLeft: 24,
  },
});

const SidebarLogo = () => {
  const classes = useSidebarLogoStyles();
  const { isOpen } = useSidebarOpenState();

  return (
    <div className={classes.root}>
      <Link to="/" underline="none" className={classes.link} aria-label="Home">
        {isOpen ? <LogoFull /> : <LogoIcon />}
      </Link>
    </div>
  );
};

export const Root = ({ children }: PropsWithChildren<{}>) => {
  const { allowed: fullAccessAllowed } = usePermission({
    permission: fullAccess,
    resourceRef: 'packages/backend/src/plugins/permission.ts',
  });

  const { allowed: fullAccessBlocked } = usePermission({
    permission: techRadarAccess, 
    resourceRef: 'packages/backend/src/plugins/permission.ts',
  });

  const globalRoutes = [
    <SidebarItem key="Home" icon={HomeIcon} to="/" text="Home" />,
    <SidebarItem key="catalog" icon={CatalogIcon} to="catalog" text="Catalog" />,
    <SidebarItem key="api-docs" icon={ExtensionIcon} to="api-docs" text="APIs" />,
    <SidebarItem key="docs" icon={LibraryBooks} to="docs" text="Docs" />,
    <SidebarItem key="create" icon={CreateComponentIcon} to="create" text="Create..." />,
    <SidebarItem key="onboarding" icon={OnboardingIcon} to="onboarding" text="Onboarding" />,

  ];

  const techRoutes = [
    <SidebarItem key="tech-radar" icon={MapIcon} to="tech-radar" text="Tech Radar" />,
    // Add more tech-related routes here
  ];

  let sidebarContent;

  if (fullAccessAllowed) {
    sidebarContent = (
      <SidebarPage>
        <Sidebar>
          <SidebarLogo />
          <SidebarGroup label="Search" icon={<SearchIcon />} to="/search">
            <SidebarSearchModal />
          </SidebarGroup>
          <SidebarDivider />
          <SidebarGroup label="Menu" icon={<MenuIcon />}>
            {globalRoutes}
          <SidebarDivider />
            <SidebarScrollWrapper>
              {techRoutes}
              <SidebarItem icon={LiveHelp} to="chatgpt" text="Ask AI..."/>
            </SidebarScrollWrapper>
          </SidebarGroup>
          <SidebarSpace />
          <SidebarDivider />
          <SidebarGroup
            label="Settings"
            icon={<UserSettingsSignInAvatar />}
            to="/settings"
          >
            <SidebarSettings />
          </SidebarGroup>
        </Sidebar>
        {children}
      </SidebarPage>
    ) 
  } else if (fullAccessBlocked) {
    sidebarContent = (
      <SidebarPage>
        <Sidebar>
          <SidebarLogo />
          <SidebarDivider />
          <SidebarGroup label="Menu" icon={<MenuIcon />}>
            <SidebarDivider />
            <SidebarItem key="Home" icon={HomeIcon} to="/" text="Home" />
            <SidebarScrollWrapper>{techRoutes}</SidebarScrollWrapper>
          </SidebarGroup>
          <SidebarSpace />
          <SidebarDivider />
          <SidebarGroup
            label="Settings"
            icon={<UserSettingsSignInAvatar />}
            to="/settings"
          >
            <SidebarSettings />
          </SidebarGroup>
        </Sidebar>
        {children}
      </SidebarPage>
    ) 
  } else {
    sidebarContent = (
      <WarningPanel severity='warning' title="Unauthorised Access" message='You are not authorised to have access to the this platform. For further questions and queries about the software developer portal access contact: ............' />
    );
  }

  return sidebarContent;
}
