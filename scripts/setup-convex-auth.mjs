/**
 * Génère JWT_PRIVATE_KEY + JWKS et les enregistre sur le déploiement Convex.
 * Usage: npm run auth:setup
 */
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { exportJWK, exportPKCS8, generateKeyPair } from 'jose';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function setConvexEnv(name, value) {
  const escaped = value.replace(/"/g, '\\"');
  execSync(`npx convex env set -- ${name} "${escaped}"`, {
    stdio: 'inherit',
    cwd: root,
  });
}

async function main() {
  console.log('Génération des clés JWT...');
  const keys = await generateKeyPair('RS256', { extractable: true });
  const privateKey = await exportPKCS8(keys.privateKey);
  const publicKey = await exportJWK(keys.publicKey);
  const jwks = JSON.stringify({ keys: [{ use: 'sig', ...publicKey }] });
  const jwtPrivateKey = privateKey.trimEnd().replace(/\n/g, ' ');

  console.log('Enregistrement sur Convex...');
  setConvexEnv('JWT_PRIVATE_KEY', jwtPrivateKey);
  setConvexEnv('JWKS', jwks);

  console.log('✓ JWT_PRIVATE_KEY et JWKS configurés.');
  console.log('  Relancez `npx convex dev` si la connexion échoue encore.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
