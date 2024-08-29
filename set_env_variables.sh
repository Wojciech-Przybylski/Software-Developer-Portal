#!/bin/bash

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]
then
    echo "You need to source this script in the current shell (e.g.: source set_env_variables.sh)! The environment variables won't set properly otherwise."
    exit -1
fi

export BSTAGE_AWS_URL="CHANGEME"
export BSTAGE_GITHUB_ORGANISATION="CHANGEME"

# ------------ Required for custom plugins to work ---------|
export GITHUB_APP_ID='CHANGEME'
export BSTAGE_GITHUB_CLIENT_ID="CHANGEME"
export BSTAGE_GITHUB_CLIENT_SECRET="CHANGEME"
export BSTAGE_GITHUB_WEBHOOK_SECRET='CHANGEME'
export GITHUB_APP_PRIVATE_KEY='CHANGEME'
export GITHUB_APP_INSTALLATION_ID='CHANGEME'
# ----------------------------------------------------------|


export sso_start_url="CHANGEME"
export sso_region="CHANGEME"

export AWS_ACCESS_KEY_ID="CHANGEME"
export AWS_SECRET_ACCESS_KEY="CHANGEME"

export BSTAGE_AWS_ACCOUNT_ID="CHANGEME"
export BSTAGE_AWS_ROLE_ARN="CHANGEME"
export BSTAGE_AWS_REGION="CHANGEME"
export AWS_REGION="CHANGEME"

export BSTAGE_DATABASE_PASSWORD="CHANGEME"
export BSTAGE_DATABASE_ENDPOINT="CHANGEME"

export BSTAGE_OPENAI_KEY="CHANGEME"

# optional
export BSTAGE_JIRA_TOKEN="CHANGEME"
export BSTAGE_JIRA_URL="CHANGEME"
export BSTAGE_K8S_CLUSTER_URL="CHANGEME"
export BSTAGE_K8S_CLUSTER_NAME="CHANGEME"
export BSTAGE_K8S_CA_FILE_PATH="CHANGEME"

echo "Environment variables set successfully."