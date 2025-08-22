### Docs
- https://github.com/google-github-actions/auth?tab=readme-ov-file#direct-wif
- https://github.com/google-github-actions/auth/blob/main/docs/SECURITY_CONSIDERATIONS.md

### Steps

- https://github.com/pastleo/next-cf-worker/pull/1
- visit https://console.cloud.google.com
  - choose a project and grab project id as `PROJECT_ID`
- visit `https://api.github.com/repos/[ORG_NAME]/[REPO_NAME]`
  - for example https://api.github.com/repos/pastleo/next-cf-worker
  - grab `.id` as `REPOSITORY_ID` and `.owner.id` as `REPOSITORY_OWNER_ID`

```
gcloud auth login

export PROJECT_ID=pastleo # gcp project id
export ORG_NAME=pastleo
export REPO_NAME=next-cf-worker
export REPOSITORY_ID=1041137402
export REPOSITORY_OWNER_ID=3825526

gcloud iam workload-identity-pools create "github" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --display-name="GitHub Actions Pool"

gcloud iam workload-identity-pools describe "github" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --format="value(name)"
# and grab the output as WORKLOAD_IDENTITY_POOL_ID
export WORKLOAD_IDENTITY_POOL_ID=...

gcloud iam workload-identity-pools providers create-oidc "${REPO_NAME}-oidc-provider" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --workload-identity-pool="github" \
  --display-name="GitHub ${REPO_NAME} Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner_id=assertion.repository_owner_id,attribute.repository_id=assertion.repository_id" \
  --attribute-condition="assertion.repository_owner_id == '${REPOSITORY_OWNER_ID}' && assertion.repository_id == '${REPOSITORY_ID}'" \
  --issuer-uri="https://token.actions.githubusercontent.com"

gcloud iam workload-identity-pools providers describe "${REPO_NAME}-oidc-provider" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --workload-identity-pool="github" \
  --format="value(name)"
# and grab the output as workload_identity_provider for google-github-actions/auth
```

- get `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` according to https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/#2-set-up-cicd
- visit https://console.cloud.google.com/security/secret-manager
  - add `[ORG_NAME]-[REPO_NAME]-cf-account-id` storing `CLOUDFLARE_ACCOUNT_ID`
  - add `[ORG_NAME]-[REPO_NAME]-api-token` storing `CLOUDFLARE_API_TOKEN`
  - copy resource name of these secrets, will be used for granting below and `google-github-actions/get-secretmanager-secrets`
- grant these 2 secrets to `WORKLOAD_IDENTITY_POOL_ID`

```
gcloud secrets add-iam-policy-binding "[cf-account-id-secret-resource-name]" \
  --project="${PROJECT_ID}" \
  --role="roles/secretmanager.secretAccessor" \
  --member="principalSet://iam.googleapis.com/${WORKLOAD_IDENTITY_POOL_ID}/attribute.repository/${ORG_NAME}/${REPO_NAME}"

gcloud secrets add-iam-policy-binding "[api-token-secret-resource-name]" \
  --project="${PROJECT_ID}" \
  --role="roles/secretmanager.secretAccessor" \
  --member="principalSet://iam.googleapis.com/${WORKLOAD_IDENTITY_POOL_ID}/attribute.repository/${ORG_NAME}/${REPO_NAME}"
```

- auth and fetch secrets in gh-action: https://github.com/pastleo/next-cf-worker/pull/1/commits/c7111e09f6ef7552b57bd20075cd8e5098c5dd6b
