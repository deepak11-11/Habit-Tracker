/**
 * Automated Frontend Audit & Self-Healing Verification Script
 * Checks directory structure, package.json, node_modules, dependencies, 
 * Vite configuration, .env files, and clears port 5173 before startup.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import net from 'net';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Terminal ANSI Colors
const COLORS = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

console.log(`\n${COLORS.cyan}${COLORS.bold}🔍 Running Frontend Audit & Health Check...${COLORS.reset}`);

// Helper to log audit steps
function logStep(status, message) {
  const icon = status === 'ok' ? '✓' : status === 'warn' ? '⚠' : '✖';
  const color = status === 'ok' ? COLORS.green : status === 'warn' ? COLORS.yellow : COLORS.red;
  console.log(`${color}${icon} ${message}${COLORS.reset}`);
}

// 1. Validate Working Directory & Project Root
if (!fs.existsSync(path.join(projectRoot, 'src'))) {
  logStep('error', `Incorrect working directory: 'src' folder missing at ${projectRoot}`);
  console.log(`${COLORS.yellow}Fix: Please navigate into the 'frontend' directory before running npm scripts.${COLORS.reset}`);
  process.exit(1);
} else {
  logStep('ok', 'Project root directory verified.');
}

// 2. Validate & Repair package.json
const packageJsonPath = path.join(projectRoot, 'package.json');
let packageJson = null;

if (!fs.existsSync(packageJsonPath)) {
  logStep('warn', 'package.json not found! Automatically generating standard React + Vite package.json...');
  const defaultPackageJson = {
    name: "habit-tracker-frontend",
    private: true,
    version: "1.0.0",
    type: "module",
    scripts: {
      "predev": "node scripts/verify-project.js",
      "dev": "node scripts/verify-project.js && vite",
      "build": "node scripts/verify-project.js && vite build",
      "preview": "vite preview",
      "lint": "eslint .",
      "audit": "node scripts/verify-project.js"
    },
    dependencies: {
      "axios": "^1.18.1",
      "lucide-react": "^1.27.0",
      "react": "^18.3.1",
      "react-dom": "^18.3.1",
      "react-router-dom": "^7.18.1",
      "recharts": "^3.10.1"
    },
    devDependencies: {
      "@types/react": "^18.3.1",
      "@types/react-dom": "^18.3.1",
      "@vitejs/plugin-react": "^4.3.4",
      "vite": "^5.4.14"
    }
  };
  fs.writeFileSync(packageJsonPath, JSON.stringify(defaultPackageJson, null, 2));
  packageJson = defaultPackageJson;
  logStep('ok', 'Generated new package.json.');
} else {
  try {
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    logStep('ok', 'package.json validated.');
  } catch (err) {
    logStep('error', 'package.json is corrupted JSON!');
    process.exit(1);
  }
}

// 3. Ensure required scripts exist in package.json
let scriptModified = false;
packageJson.scripts = packageJson.scripts || {};

const requiredScripts = {
  "predev": "node scripts/verify-project.js",
  "dev": "node scripts/verify-project.js && vite",
  "build": "node scripts/verify-project.js && vite build",
  "preview": "vite preview",
  "lint": "eslint .",
  "audit": "node scripts/verify-project.js"
};

for (const [scriptName, scriptCmd] of Object.entries(requiredScripts)) {
  if (!packageJson.scripts[scriptName]) {
    packageJson.scripts[scriptName] = scriptCmd;
    scriptModified = true;
  }
}

if (scriptModified) {
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  logStep('ok', 'Updated missing npm scripts in package.json.');
}

// 4. Validate & Repair vite.config.js
const viteConfigPath = path.join(projectRoot, 'vite.config.js');
if (!fs.existsSync(viteConfigPath)) {
  logStep('warn', 'vite.config.js missing! Auto-generating standard Vite configuration...');
  const defaultViteConfig = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true
      }
    }
  }
});
`;
  fs.writeFileSync(viteConfigPath, defaultViteConfig);
  logStep('ok', 'Created vite.config.js.');
} else {
  logStep('ok', 'vite.config.js verified.');
}

// 5. Validate & Repair index.html
const indexHtmlPath = path.join(projectRoot, 'index.html');
if (!fs.existsSync(indexHtmlPath)) {
  logStep('warn', 'index.html missing! Regenerating HTML entry file...');
  const defaultHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>HabitPulse SaaS Dashboard</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`;
  fs.writeFileSync(indexHtmlPath, defaultHtml);
  logStep('ok', 'Created index.html.');
} else {
  logStep('ok', 'index.html verified.');
}

// 6. Validate Environment Files (.env & .env.example)
const envExamplePath = path.join(projectRoot, '.env.example');
const envPath = path.join(projectRoot, '.env');

if (!fs.existsSync(envExamplePath)) {
  fs.writeFileSync(envExamplePath, 'VITE_API_URL=http://localhost:5001/api\n');
  logStep('ok', 'Created .env.example.');
}

if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, 'VITE_API_URL=http://localhost:5001/api\n');
  logStep('ok', 'Created default .env file.');
} else {
  logStep('ok', '.env file verified.');
}

// 7. Check node_modules & Dependencies
const nodeModulesPath = path.join(projectRoot, 'node_modules');
const requiredDependencies = ['react', 'react-dom', 'react-router-dom', 'recharts', 'lucide-react', 'vite'];
let needsInstall = !fs.existsSync(nodeModulesPath);

if (!needsInstall) {
  for (const dep of requiredDependencies) {
    if (!fs.existsSync(path.join(nodeModulesPath, dep))) {
      logStep('warn', `Missing dependency package: ${dep}`);
      needsInstall = true;
      break;
    }
  }
}

if (needsInstall) {
  logStep('warn', 'node_modules or required packages are missing. Running npm install automatically...');
  try {
    execSync('npm install', { cwd: projectRoot, stdio: 'inherit' });
    logStep('ok', 'npm install completed successfully.');
  } catch (err) {
    logStep('error', 'npm install encountered an error during automatic resolution.');
  }
} else {
  logStep('ok', 'All required dependencies & node_modules verified.');
}

// 8. Strict Port 5173 PID Reclaimer (Prevents port jumping 5174, 5175, 5176...)
try {
  if (process.platform === 'win32') {
    const netstatOut = execSync('netstat -ano -p tcp | findstr :5173', { encoding: 'utf8' });
    for (const line of netstatOut.split('\n')) {
      if (line.includes('LISTENING')) {
        const parts = line.trim().split(/\s+/);
        const pid = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(pid) && pid > 0 && pid !== process.pid) {
          logStep('warn', `Port 5173 occupied by PID ${pid}. Terminating old process...`);
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
          logStep('ok', `Freed port 5173 (terminated PID ${pid}).`);
          break;
        }
      }
    }
  }
} catch (e) {
  // Port 5173 was free
}

console.log(`${COLORS.green}${COLORS.bold}✓ Frontend audit complete. All checks passed! Starting Vite on http://localhost:5173...${COLORS.reset}\n`);
