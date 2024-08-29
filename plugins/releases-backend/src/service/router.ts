import express, { Request, Response } from 'express';
import { Config } from '@backstage/config';
import { createAppAuth } from '@octokit/auth-app';
import { request } from '@octokit/request';

const router = express.Router();

// Define an interface for the router options
interface RouterOptions {
  logger: { error: (msg: string) => void; info: (msg: string) => void }; // Simplified logger interface
  config: Config;
}

interface Release {
  name: string;
  created_at: string;
  assets: { [name: string]: string[] };
  body: string;
  prerelease: boolean;
  author: { login: string };
  html_url: string;
  message: string;
}

// Function to create the router
export async function createRouter(options: RouterOptions): Promise<express.Router> {
  router.get('/health', async (req: Request, res: Response) => {
    const repository = req.query.repository as string;
    const owner = req.query.owner as string;
    options.logger.info(`Received request for repository: ${owner}/${repository}`);

    if (!repository || !owner) {
      options.logger.error('Owner and repository parameters are required');
      return res.status(400).json({ error: 'Owner and repository parameters are required' });
    }

    try {
      const releases = await fetchReleases(owner, repository, options);
      res.json(releases);
    } catch (error) {
      options.logger.error(`An error occurred while fetching releases: ${error.message}`);
      res.status(500).json({ error: 'An error occurred while fetching releases' });
    }
  });

  return router;
}

// Function to create the GitHub App authentication
const auth = createAppAuth({
  appId: process.env.GITHUB_APP_ID ?? '',
  privateKey: process.env.GITHUB_APP_PRIVATE_KEY ?? '',
  clientId: process.env.BSTAGE_GITHUB_CLIENT_ID,
  clientSecret: process.env.BSTAGE_GITHUB_CLIENT_SECRET,
});

// Function to get the installation access token
async function getInstallationAccessToken(options: RouterOptions): Promise<string> {
  try {
    const installationId = await getInstallationId(options); // Fetch or set your installation ID

    const { token } = await auth({
      type: 'installation',
      installationId,
    });

    return token;
  } catch (error) {
    options.logger.error(`Error getting installation access token: ${error.message}`);
    throw error;
  }
}

// Function to get the installation ID
async function getInstallationId(options: RouterOptions): Promise<number> {
  const installationId = Number(process.env.GITHUB_APP_INSTALLATION_ID);
  if (!installationId) {
    throw new Error('GitHub App installation ID is missing in the configuration');
  }
  return installationId;
}

// Function to fetch releases from a GitHub repository
async function fetchReleases(owner: string, repository: string, options: RouterOptions): Promise<Release[]> {
  const token = await getInstallationAccessToken(options);

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
  };

  try {
    const response = await request('GET /repos/{owner}/{repo}/releases', {
      headers,
      owner,
      repo: repository,
    });

    const releasesData: Release[] = response.data;

    for (const release of releasesData) {
      options.logger.info(`Fetching commit message for release: ${release.name}`);
      const tagsResponse = await request('GET /repos/{owner}/{repo}/tags', {
        headers,
        owner,
        repo: repository,
      });

      const tagsData: any[] = tagsResponse.data;
      const latestTag = tagsData.find(tag => tag.name === release.name);
      if (!latestTag) {
        options.logger.warn(`Latest tag not found for release: ${release.name}`);
        continue;
      }

      const tagCommitResponse = await request('GET {url}', {
        headers,
        url: latestTag.commit.url,
      });
      const tagCommitData = tagCommitResponse.data;
      release.message = tagCommitData?.commit?.message ?? 'No commit message available';
    }

    return releasesData;
  } catch (error) {
    options.logger.error(`Error fetching releases: ${error.message}`);
    throw new Error(`Error fetching releases: ${error.message}`);
  }
}
