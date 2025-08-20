import { execSync } from 'child_process';
import path from 'path';

const SHA_LENGTH = 7

export function getDeployTagEnv() {
  const env = process.env.BUILD_ENV;
  if (!env) throw new Error('no process.env.BUILD_ENV');
  return env
}
export function getDeployTagAlias() {
  return execSync('git rev-parse --abbrev-ref HEAD')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
export function getDeployTagSha() {
  return execSync('git rev-parse HEAD').toString().trim().slice(0, SHA_LENGTH);
}

export function getDeployTag() {
  return `${getDeployTagEnv()}/${getDeployTagAlias()}/${getDeployTagSha()}`
}

export function extractDeployTag(tag) {
  const [env, alias, sha] = tag.split('/')
  return { env, alias, sha }
}

async function main() {
  console.log('deploy-tag.mjs: start')

  const deployTag = getDeployTag();
  console.log(`deploy tag: ${deployTag}`);

  const tagCommand = `git tag -s ${deployTag} -m 'deploy ${deployTag}'`;
  console.log(`> ${tagCommand}`);
  execSync(tagCommand);
  console.log(
    `Run "git push origin ${deployTag}" to push and trigger deployment`,
  );
}

if (process.argv[1] === import.meta.filename) {
  process.chdir(path.join(import.meta.dirname, '..'));
  main();
}
