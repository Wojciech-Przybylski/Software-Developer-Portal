# Backstage Proof-of-Concept

This is a modified version of [Backstage](https://backstage.io) developed for demonstration purposes as a proof-of-concept at ONS. It includes the following, already set up:
- Service integrations, including:
    - GitHub
    - Jira
    - Linguist
    - AWS (specifically S3)
    - Kubernetes (with EKS)
- Custom templates (`packages/backend/templates`) and the custom template actions they consist of (`packages/backend/plugins/src/scaffolder`), e.g.
    - A template to set up a Community Method in Python with best practices built in
    - A template to create a static website and automatically host it on S3
    - A template to create a new Architecture Decision Record alongisde existing documentation
    - A template to generate the required metadata to use Markdown documentation with TechDocs
- An example Tech Radar API which references real project data (`packages/app/src/tech_radar`)
- Some tweaks to the UI

... as well as the rest of Backstage.

## Purpose

Hopefully this makes a good reference point if anyone attempts to set up a more production-ready instance! However, as a proof-of-concept, this **isn't intended to be stable** and might take a bit of effort to get running.

There's a setup guide below to help you get started, but I'd **strongly advise** you to create your own fresh instance [using these instructions from the official docs](https://backstage.io/docs/getting-started/) and put it together from the ground up instead (since you'll know how everything fits better).

# Setup

### Prerequisites
- A build environment, e.g. `build-essential` or XCode
- `curl` or `wget`
- Node.js 
- `yarn` 
    - install using `nvm install -g yarn` for least hassle
- `docker`
- `git`

## Getting started

Building it is as easy as running:
```sh
cd sdp-backstage
yarn install
```
> Note: the installation process can be quite memory-hungry, so don't be surprised if it fails on a less capable machine. 4GB seemed to be the minimum I could get it to work with and I had to configure the swapfile in that case.

Although not strictly required, in order to have persistent storage Backstage needs to connect to a database. It currently supports PostgreSQL and SQLite; instructions for setting up a PostgreSQL database are [here](https://backstage.io/docs/getting-started/configuration/#install-and-configure-postgresql). Make sure you note down the password you set so that you can provide it as an environment variable later.

Backstage should have successfully built at this point, but it's unlikely to run if you attempt to start it with `yarn dev`. This is because lots of the integrations error at startup if they don't find what they're looking for - see below to get these working.

## GitHub App

A lot of Backstage's most valuable features come through Git integration so (assuming you're using GitHub) installing a GitHub App into the organisation is recommended to get the most out of Backstage.

Conveniently, Backstage provides a command-line interface for automatically creating a GitHub App and producing the requried YAML file to integrate it with Backstage:
```sh
yarn backstage-cli create-github-app <github org>
```

If that doesn't work (or you're using GitHub Enterprise), [follow these instructions instead](https://backstage.io/docs/integrations/github/github-apps/#github-enterprise).

## Secrets and credentials

Next you should edit `set_env_variables.sh`, fill in anywhere it says CHANGEME with the appropriate values and run it with `source`. If you have a more robust way of managing secrets and environment variables, use that - just make sure the names match.

> You can use `git update-index --assume-unchanged set_env_variables.sh` to avoid checking in secrets if you want to continue using the script.

The various AWS integrations will expect credentials to be available at `~/.aws/credentials`. The credentials provided should match with the AWS information you put into the environment variables. You can find more details on the format [here](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html) - the backend will error and die if it can't find this information so I'd recommend at least putting some dummy credentials in.

## Running

At this point, Backstage should be good to go:
```sh
yarn dev
```
This will start the frontend at `localhost:3000` and the backend at `localhost:7007`. If you want to run it remotely, edit the `baseUrl` values and `backend.cors.origin` value in `app-config.yaml`. Make sure the correct ports are open in that case.

> If you're missing any environment variables (like the Kubernetes ones) then giving them dummy values should at least let Backstage start up - you can fill them in later. If you're running `set_env_variables.sh` it should (hopefully!) work out fine with CHANGEME in most of the values. Note that the GitHub ones are the important ones.

# Additional integrations

## Kubernetes

Under the `kubernetes` label in `app-config.yaml`, you can point Backstage to clusters which you might have running. Feel free to comment out the section if you don't want to use it, but there's a skeleton already provided for describing a cluster.

Once a cluster/component is connected, in order to mark it as part of an entity you'll have to label both the entity and the Kubernetes resource. Details can be [found here](https://backstage.io/docs/features/kubernetes/configuration#surfacing-your-kubernetes-components-as-part-of-an-entity) or you can take one of the approaches below:

### Label selector

This is probably the easier approach. Add an annotation to the `catalog-info.yaml` of the entity you want to connect:
```yaml
annotations:
    # ...
    backstage.io/kubernetes-label-selector: <label-selector-query>
```

A simple query you can use is `app=<kubernetes-app-name>`, but more complex setups will likely need more complex queries (labels aren't meant to be unique!). Backstage will use this to automatically look up the Kubernetes objects.

### Label both entity and resource

Alternatively, you can manually link the entity and the Kubernetes resource by giving them the same label. Add an annotation to the entity's `catalog-info.yaml`:
```yaml
annotations:
    # ...
    'backstage.io/kubernetes-id': <unique-name>
    'backstage.io/kubernetes-namespace': <namespace> # optional alternative
```

Then, label the Kubernetes resource with the same name you provided above. For example, if you're labelling a pod:
```
kubectl label pods <pod-name> backstage.io/kubernetes-id=<unique-name>
```
or use
```
kubectl edit <resource>
```
and manually change the `metadata.labels` to add `backstage.io/kubernetes-id=<name>`.

## ChatGPT

The code which powers the "ask AI" feature is bespoke, since the underlying ChatGPT plugin from Enfuse is essentially a just window which allows users to send messages to the ChatGPT completions API. This means that it does require a little bit of extra setup.


The changes can be found in `plugins/chatgpt-backend`, especially `src/service/embedding.ts`. An overview of how this works can be found in Confluence but in essence to get it working you just need to add an extra column to a certain table in the database:
```
sudo -u postgres psql
\connect backstage_plugin_catalog
alter table final_entities add column embedding text;
```
The code will then start to populate that column (by generating embeddings for the entities in the catalog from their YAML) the next time the "Submit" button is clicked to send a message. Note that OpenAI's rate limits can mean that this takes a significant time!
(Worth checking that the embedding mode variable is set to `OneAtATime` as well.)
