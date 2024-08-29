import { createTemplateAction } from "@backstage/plugin-scaffolder-node";
import { Octokit } from "@octokit/rest";
import { components } from '@octokit/openapi-types'
import { ScmIntegrations, DefaultGithubCredentialsProvider } from '@backstage/integration';
import { resolveSafeChildPath } from "@backstage/backend-common";
import { GitHubManager } from "../catalog";
import { get } from "https";

const yaml = require('js-yaml');
const fs = require('fs');
const errors = require('@backstage/errors');
const integration = require('@backstage/integration');
const AdmZip = require("adm-zip");

type GetRepoContentResponseDataFile = components["schemas"]["content-file"]

export const createUpdateMkdocsAction = (options: { integrations: ScmIntegrations; githubCredentialsProvider: DefaultGithubCredentialsProvider;}) => {
    const { integrations, githubCredentialsProvider } = options;
    return createTemplateAction({
        id: 'ons:github:mkdocs:update',
        description: 'Amends a Mkdocs.yaml file to add a new document',
        schema: {
            input: {
              required: ["repoUrl", "documentName"],
              type: "object",
              properties: {
                repoUrl: {
                    title: "Repo URL",
                    description: "The URL of the repo to fetch from.",
                    type: "string",
                },
                documentTitle: {
                    title: "Document Title",
                    description: "The title given to the document",
                    type: "string",
                },
                documentName: {
                    title: "Document Name",
                    description: "The filename of the document to incorporate.",
                    type: "string",
                }
              }
            },
            output: {
              type: "object",
              properties: {
                docsDir: {
                  title: "The docs_dir as described by the MkDocs YAML config file.",
                  type: "string"
                },
              }
            }
        },
        async handler(ctx) {
            const {
                repoUrl,
                documentTitle,
                documentName,
                token: providedToken
              } = ctx.input;
            
            const client = new Octokit(
                await getOctokitOptions({
                  integrations,
                  credentialsProvider: githubCredentialsProvider,
                  token: providedToken,
                  repoUrl,
                })
            );

            const { owner, repo } = parseRepoUrl(repoUrl, integrations);
            if (!owner || !repo) { throw new errors.InputError("Invalid repository owner or something") ;}
            
            ctx.logger.info("Looking for MkDocs file in repo...");
            var response;
            var foundYamlName;
            for (const yamlName of ["mkdocs.yml", "Mkdocs.yml", "mkdocs.yaml", "Mkdocs.yaml"]) {
              try {
                response = await client.repos.getContent({
                  owner: owner,
                  repo: repo,
                  path: yamlName,
                });

                ctx.logger.info("Found "+yamlName+"!");
                foundYamlName = yamlName;
                break;
              } catch (e) {
                continue;
              }
            }

            if (!response || !foundYamlName) { 
              throw new errors.NotFoundError("Couldn't find a MkDocs file. Is it in the root of the repository?"); 
            }
                        
            ctx.logger.info("Amending file...");

            const ADR_SECTION_NAME: string = "Architecture Decision Records"; 
            const content: string = atob((response.data as unknown as GetRepoContentResponseDataFile).content);
            const doc = yaml.load(content);

            if (!doc.nav.some((e: any) => e[ADR_SECTION_NAME])) {
              ctx.logger.info("Couldn't find an ADR section under nav; creating a fresh one...");
              doc.nav.push({[ADR_SECTION_NAME]: []});
            }

            const adrIndex = doc.nav.findIndex((e: any) => e[ADR_SECTION_NAME]);
            if (!documentTitle) { throw new errors.InputError("No document title?!"); }
            if (!adrIndex) { throw new errors.InputError("Couldn't find ADR section - this should be impossible."); }
            doc.nav[adrIndex][ADR_SECTION_NAME].push({ [documentTitle.toString()]: documentName })

            const amendedYaml: string = yaml.dump(doc);
            ctx.logger.info("Amended YAML:\n-----------------\n" + amendedYaml + "-----------------\n");
            
            ctx.logger.info("Writing amended file to workspace...");
            var _a;
            const targetPath = (_a = ctx.input.targetPath) != null ? _a : "./";
            const workspacePath = resolveSafeChildPath(ctx.workspacePath, targetPath.toString());
            fs.writeFileSync(workspacePath+"/"+foundYamlName, amendedYaml);

            const docsPath = doc.docs_dir ? doc.docs_dir : "docs"; // the default docs path is "docs" if no docs_dir is specified
            ctx.logger.info(doc.docs_dir ? `Tracking docs_dir as ${docsPath}` : `No docs_dir key found; using default docs path "docs"`);
            ctx.output("docsDir", docsPath);
        }
    })
}

export const createRunGithubProvidersAction = () => {
  return createTemplateAction({
    id: "ons:github:runProviders",
    description: "Immediately triggers the GitHub entity providers in order to refresh the catalog.",
    schema: {},
    async handler(ctx) {
        ctx.logger.info("Refreshing providers.");
        GitHubManager.githubEntityProviders.forEach(provider => provider.refresh(ctx.logger));
        ctx.logger.info("Reading organisation data.")
        GitHubManager.githubOrgEntityProvider.read();
    },
  });
}

export const createCreateMkdocsAction = (options: { integrations: ScmIntegrations; githubCredentialsProvider: DefaultGithubCredentialsProvider;}) => {
  return createTemplateAction({
    id: "ons:github:createMkdocs",
    description: "Creates a new mkdocs.yaml file based on the contents of the provided docs folder.",
    schema: {
      input: {
        required: ["repoUrl", "docsPath"],
        type: "object",
        properties: {
          repoUrl: {
            title: "Repo URL",
            description: "The URL of the repo to fetch from.",
            type: "string",
          },
          docsPath: {
            title: "Documentation folder name",
            description: "The name of the folder that contains the documentation", // TODO: allow for arbitrary paths (restricted to root atm)
            type: "string",
          },
        }
      },
      output: {
        type: "object",
        properties: {
          structure: {
            title: "The docs directory structure in YAML format.",
            type: "string"
          },
        }
      }
    },
    async handler(ctx) {
      const { 
        integrations, 
        githubCredentialsProvider 
      } = options;
      const {
        repoUrl,
        docsPath,
        token: providedToken
      } = ctx.input;
      const client = new Octokit(
          await getOctokitOptions({
            integrations,
            credentialsProvider: githubCredentialsProvider,
            token: providedToken,
            repoUrl,
          })
      );

      const { owner, repo } = parseRepoUrl(repoUrl, integrations);
      if (!owner || !repo) { throw new errors.InputError(`Failed to parse the repo URL properly! Got owner: "${owner}" and repo: "${repo}"`) ;}
      if (!docsPath) { throw new errors.InputError("No docs path specified - should be impossible"); }
      if (typeof docsPath != "string") { throw new errors.InputError("Somehow the docsPath isn't a string...?"); }

      ctx.logger.info(`Finding default branch...`);
      const repoInfo = await client.request('GET /repos/{owner}/{repo}', {
        owner: owner,
        repo: repo,
      });
      const defaultBranch = repoInfo.data.default_branch;
      if (!defaultBranch) { throw new Error("Couldn't get the default branch?"); }

      ctx.logger.info(`Getting tree SHA1 from most recent commit @ ${defaultBranch}...`);
      const commit = await client.request('GET /repos/{owner}/{repo}/commits/{ref}', {
        owner: owner,
        repo: repo,
        ref: "heads/"+defaultBranch
      });
      const treeSha = commit.data.commit.tree.sha;

      ctx.logger.info(`Retrieving tree ${treeSha}...`);
      const treeResponse = await client.rest.git.getTree({
        owner: owner,
        repo: repo,
        tree_sha: treeSha,
        recursive: "yes please", // any value here is fine :)
      });
      const tree = treeResponse.data.tree;
      
      ctx.logger.info(`Isolating docs directory structure...`);
      const docsObjects = tree.filter(x => 
          x.type == "blob" && // omit directories as targets
          x.path?.startsWith(docsPath+"/") && // only consider docs folder
          x.path.split(".").at(-1) == "md" // only consider markdown files
        )
        .map(x => x.path);
      if (docsObjects.length == 0) { throw new Error(`Couldn't find a folder in the repo root named ${docsPath} - is the name right?`); }
      const allDefined = (list: (string | undefined)[]): list is string[] => {
        return !list.some(x => x == undefined);
      }
      if (!allDefined(docsObjects)) { throw new Error("Some paths are undefined?");}

      ctx.logger.info(`Found [${docsObjects}]...`);
      ctx.logger.info(`Constructing directory tree...`);
      const directoryTree = constructTree(docsObjects);
      const output = yaml.dump(directoryTree);
      ctx.logger.info(`Resulting YAML: \n${output}`);

      ctx.output("structure", output);
    },
  });
}

function constructTree(paths: string[]) {

  let result: any = []; // TODO: make typed
  let level = {result};
  
  paths.forEach(path => {
    path.split('/').reduce((r: any, name, _i, _a) => {
      if(!r[name]) {
        r[name] = {result: []};
        r.result.push({[name]: r[name].result})
      }
      
      return r[name];
    }, level)
  });

  // map of: filename -> path
  // this also chops the first folder off the front, which we assume is the top-level docs dir
  // might not generalise to every case - need to check
  const fullPathMap = paths.reduce(function(map: {[key: string]: string;}, fullPath) {
    map[fullPath.split("/").at(-1) as string] = fullPath.substring(fullPath.indexOf("/") + 1);
    return map;
  }, {});
  fixStubs(result, fullPathMap);

  return result;
}

function fixStubs(tree: any, fullPathMap: {[filename: string]: string;}) { // TODO: make tree typed
  // this could probably be done non-recursively using reduce (similar to the above) but
  // it works for now
  for (const key in tree) {
    if (tree[key].length == 0) {
      delete tree[key];
      tree[key.split(".")[0]] = fullPathMap[key];
    } else {
      fixStubs(tree[key], fullPathMap);
    }
  }
}

export const createGetBuildArtifactAction = (options: { integrations: ScmIntegrations; githubCredentialsProvider: DefaultGithubCredentialsProvider;}) => {
  return createTemplateAction({
    id: "ons:github:getBuildArtifact",
    description: "Fetches a build artifact from GitHub, unzips it and places it in build/. It is assumed that the artifact is the result of the most recent GitHub Actions workflow, so it waits for it to complete. The behaviour here is pretty specific to the 'website-template' template - I'd recommend writing your own version of this if you needed it.",
    schema: {
      input: {
        required: ["repoUrl"],
        type: "object",
        properties: {
          repoUrl: {
            title: "Repo URL",
            description: "The URL of the repo to fetch from.",
            type: "string",
          },
        }
      },
    },
    async handler(ctx) {
      const { integrations, githubCredentialsProvider } = options;
      const { repoUrl, token: providedToken } = ctx.input;
      const client = new Octokit(
        await getOctokitOptions({
          integrations,
          credentialsProvider: githubCredentialsProvider,
          token: providedToken,
          repoUrl,
        })
      );

      const { owner, repo } = parseRepoUrl(repoUrl, integrations);
      if (!owner || !repo) { throw new errors.InputError(`Failed to parse the repo URL properly! Got owner: "${owner}" and repo: "${repo}"`) ;}

      ctx.logger.info(`Listing workflow runs for repo ${repoUrl}`);
      let waiting = true;
      let runId;
      while (waiting) {
        const workflowRuns = await client.actions.listWorkflowRunsForRepo({
          owner: owner,
          repo: repo, 
          per_page: 1
        });
        const workflow = workflowRuns.data.workflow_runs.at(0);
        if (workflow) { 
          ctx.logger.info(`Found workflow "${workflow.name}", id: ${workflow.id}`);
          runId = workflow.id;
          waiting = false;
        } else {
          ctx.logger.info(`Didn't find any workflows for repo ${repoUrl}, trying again in a moment...`);
          await new Promise(_r => setTimeout(_r, 2000));
        }
      }
      if (!runId) { throw new Error("runId was undefined - this should be impossible"); }

      ctx.logger.info(`Expecting workflow response - this might take a while!`);
      waiting = true;
      while (waiting) {
        const workflowResponse = await client.actions.getWorkflowRun({
          owner: owner,
          repo: repo,
          run_id: runId,
        })
        const target = workflowResponse.data

        ctx.logger.info(`Waiting for workflow "${target.name}" ${target.created_at}: ${target.status}`)

        if (target.status == "success" || target.status == "completed") {
          ctx.logger.info(`OK!`);
          waiting = false;
        } else if (target.status == "failure" || target.status == "cancelled" || target.status == "skipped") {
          throw new Error(`Latest workflow run failed, which means there's unlikely to be an artifact - please check the error logs!`);
        } else {
          await new Promise(_r => setTimeout(_r, 5000)); // sleep for 2000ms
        }
      }

      ctx.logger.info(`Listing artifacts for workflow run ${runId}`);
      const artifactsResponse = await client.request('GET /repos/{owner}/{repo}/actions/runs/{run_id}/artifacts', {
        owner: owner,
        repo: repo,
        run_id: runId,
      });
      const buildArtifact = artifactsResponse.data.artifacts.at(0);
      if (!buildArtifact) { throw new Error(`Couldn't find any build artifacts... something's gone very wrong`); }
      ctx.logger.info(`Found artifact "${buildArtifact.name}": id ${buildArtifact.id} created at ${buildArtifact.created_at}"`);

      ctx.logger.info(`Retrieving download URL`)
      const downloadUrlResponse = await client.request('GET /repos/{owner}/{repo}/actions/artifacts/{artifact_id}/{archive_format}', {
        owner: owner,
        repo: repo,
        artifact_id: buildArtifact.id,
        archive_format: 'zip',
      })

      ctx.logger.info(`Downloading build artifact from ${downloadUrlResponse.url}`);
      var _a;
      const targetPath = (_a = ctx.input.targetPath) != null ? _a : "./";
      const workspacePath = resolveSafeChildPath(ctx.workspacePath, targetPath.toString());
      const outStream = fs.createWriteStream(workspacePath+"/archive.zip");
      const download = () => new Promise((resolve, reject) => {

        get(downloadUrlResponse.url, res => {
        
          if (res.statusCode !== 200) {
            reject(new Error(`Unexpected status code: ${res.statusCode}`));
            return;
          }

          res.pipe(outStream);
          res.on("end", () => {
            outStream.close(resolve);
            ctx.logger.info(`Archive download complete, written to "${workspacePath+"/archive.zip"}"`);
          });
          res.on("error", (error) => {
            reject(error);
          });
        });
      });

      await download();
      ctx.logger.info("Extracting archive to workspace");
      const zip = new AdmZip(workspacePath+"/archive.zip");
      zip.extractAllTo(workspacePath+"/build", true);
    }
  });
}

export const createCreateRulesetAction = (options: { integrations: ScmIntegrations; githubCredentialsProvider: DefaultGithubCredentialsProvider;}) => {
  return createTemplateAction({
    id: "ons:github:createRuleset",
    description: "Creates a ruleset for the main branch of a repo which enables branch protection and disallows force pushes",
    schema: {
      input: {
        required: ["repoUrl"],
        type: "object",
        properties: {
          repoUrl: {
            title: "Repo URL",
            description: "The URL of the repo create the ruleset in.",
            type: "string",
          },
        }
      },
    },
    async handler(ctx) {
      const { integrations, githubCredentialsProvider } = options;
      const { repoUrl, token: providedToken } = ctx.input;
      const client = new Octokit(
        await getOctokitOptions({
          integrations,
          credentialsProvider: githubCredentialsProvider,
          token: providedToken,
          repoUrl,
        })
      );

      const { owner, repo } = parseRepoUrl(repoUrl, integrations);
      if (!owner || !repo) { throw new errors.InputError(`Failed to parse the repo URL properly! Got owner: "${owner}" and repo: "${repo}"`) ;}

      ctx.logger.info(`Creating ruleset for repo ${repo}`);
      try {
        await client.request(`POST /repos/{owner}/{repo}/rulesets`, {
          owner: owner,
          repo: repo,
          name: "Branch protection on main",
          target: "branch",
          enforcement: "active",
          conditions: {
            ref_name: {
              include: [
                'refs/heads/main',
                'refs/heads/master'
              ],
              exclude: [], // this has to be present, otherwise the API call fails - raise a PR to octokit? the Go API had a similar thing
            }
          },
          rules: [
            {
              type: "pull_request",
              parameters: {
                required_approving_review_count: 1,
                dismiss_stale_reviews_on_push: false,
                require_code_owner_review: true,
                require_last_push_approval: false,
                required_review_thread_resolution: false,
              }
            }, 
            {
              type: "non_fast_forward",
            }
          ],
          headers: {
            'X-Github-Api-Version': '2022-11-28'
          }
        });
      } catch (e) { // don't break the template if we can't set this up - it requires GitHub Pro
        ctx.logger.error("!!!!!!!!!!!!!!!!!!!!!");
        ctx.logger.error(e);
        ctx.logger.error("!!!!!!!!!!!!!!!!!!!!!");
        ctx.logger.info("Proceeding with template in 5s...");
        await new Promise(_r => setTimeout(_r, 5000));
      }
    }
})}

export const createEnableSecretScanningAction = (options: { integrations: ScmIntegrations; githubCredentialsProvider: DefaultGithubCredentialsProvider;}) => {
  return createTemplateAction({
    id: "ons:github:enableSecretScanning",
    description: "Enables secret scanning and secret scanning push protection for a repository",
    schema: {
      input: {
        required: ["repoUrl"],
        type: "object",
        properties: {
          repoUrl: {
            title: "Repo URL",
            description: "The URL of the repo create the ruleset in.",
            type: "string",
          },
        }
      },
    },
    async handler(ctx) {
      const { integrations, githubCredentialsProvider } = options;
      const { repoUrl, token: providedToken } = ctx.input;
      const client = new Octokit(
        await getOctokitOptions({
          integrations,
          credentialsProvider: githubCredentialsProvider,
          token: providedToken,
          repoUrl,
        })
      );

      const { owner, repo } = parseRepoUrl(repoUrl, integrations);
      if (!owner || !repo) { throw new errors.InputError(`Failed to parse the repo URL properly! Got owner: "${owner}" and repo: "${repo}"`) ;}

      ctx.logger.info(`Updating repo ${repo}`);
      try {
        await client.request("PATCH /repos/{owner}/{repo}", {
          owner: owner,
          repo: repo,
          security_and_analysis: {
            secret_scanning: { status: "enabled" },
            secret_scanning_push_protection: { status: "enabled" },
          }
        });
      } catch (e) { // don't break the template if we can't set this up - it's only available in org repos
        ctx.logger.error("!!!!!!!!!!!!!!!!!!!!!");
        ctx.logger.error(e);
        ctx.logger.error("!!!!!!!!!!!!!!!!!!!!!");
        ctx.logger.info("Proceeding with template in 5s...");
        await new Promise(_r => setTimeout(_r, 5000));
      }
    }
})}

////////////////////////////////////////////////////////////////////////////////
// code lifted from @backstage/plugin-scaffolder-backend/dist/cjs/ScaffolderEntitiesProcessor-b514f9e5.cjs.js 
// it doesn't expose these methods unfortunately so I've had to replicate them there (the alternative would be rewriting them!)

const DEFAULT_TIMEOUT_MS = 6e4;
async function getOctokitOptions(options: { integrations: any; credentialsProvider: any; repoUrl: any; token: any; }) {
  var _a;
  const { integrations, credentialsProvider, repoUrl, token } = options;
  const { owner, repo, host } = parseRepoUrl(repoUrl, integrations);
  const requestOptions = {
    // set timeout to 60 seconds
    timeout: DEFAULT_TIMEOUT_MS
  };
  if (!owner) {
    throw new errors.InputError(`No owner provided for repo ${repoUrl}`);
  }
  const integrationConfig = (_a = integrations.github.byHost(host)) == null ? void 0 : _a.config;
  if (!integrationConfig) {
    throw new errors.InputError(`No integration for host ${host}`);
  }
  if (token) {
    return {
      auth: token,
      baseUrl: integrationConfig.apiBaseUrl,
      previews: ["nebula-preview"],
      request: requestOptions
    };
  }
  const githubCredentialsProvider = credentialsProvider != null ? credentialsProvider : integration.DefaultGithubCredentialsProvider.fromIntegrations(integrations);
  if (!repo) { throw new errors.InputError(`Repo ${repo} was null!?`); }
  const { token: credentialProviderToken } = await githubCredentialsProvider.getCredentials({
    url: `https://${host}/${encodeURIComponent(owner)}/${encodeURIComponent(
      repo
    )}`
  });
  if (!credentialProviderToken) {
    throw new errors.InputError(
      `No token available for host: ${host}, with owner ${owner}, and repo ${repo}`
    );
  }
  return {
    auth: credentialProviderToken,
    baseUrl: integrationConfig.apiBaseUrl,
    previews: ["nebula-preview"]
  };
}
const parseRepoUrl = (repoUrl: any, integrations: { byHost: (arg0: string) => any; }) => {
    var _a, _b, _c, _d, _e;
    let parsed;
    try {
      parsed = new URL(`https://${repoUrl}`);
    } catch (error) {
      throw new errors.InputError(
        `Invalid repo URL passed to publisher, got ${repoUrl}, ${error}`
      );
    }
    const host = parsed.host;
    const owner = (_a = parsed.searchParams.get("owner")) != null ? _a : void 0;
    const organization = (_b = parsed.searchParams.get("organization")) != null ? _b : void 0;
    const workspace = (_c = parsed.searchParams.get("workspace")) != null ? _c : void 0;
    const project = (_d = parsed.searchParams.get("project")) != null ? _d : void 0;
    const type = (_e = integrations.byHost(host)) == null ? void 0 : _e.type;
    if (!type) {
      throw new errors.InputError(
        `No matching integration configuration for host ${host}, please check your integrations config`
      );
    }
    const repo = parsed.searchParams.get("repo");
    switch (type) {
      case "bitbucket": {
        if (host === "www.bitbucket.org") {
          checkRequiredParams(parsed, "workspace");
        }
        checkRequiredParams(parsed, "project", "repo");
        break;
      }
      case "gitlab": {
        if (!project) {
          checkRequiredParams(parsed, "owner", "repo");
        }
        break;
      }
      case "gerrit": {
        checkRequiredParams(parsed, "repo");
        break;
      }
      default: {
        checkRequiredParams(parsed, "repo", "owner");
        break;
      }
    }
    return { host, owner, repo, organization, workspace, project };
  };
  function checkRequiredParams(repoUrl: URL, ...params: string[]) {
    for (let i = 0; i < params.length; i++) {
      if (!repoUrl.searchParams.get(params[i])) {
        throw new errors.InputError(
          `Invalid repo URL passed to publisher: ${repoUrl.toString()}, missing ${params[i]}`
        );
      }
    }
  }
