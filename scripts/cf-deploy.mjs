import path from 'path';

async function main() {
  console.log('cf-deploy.mjs: WIP')
  console.log(process.env)
}

if (process.argv[1] === import.meta.filename) {
  process.chdir(path.join(import.meta.dirname, '..'));
  main();
}
