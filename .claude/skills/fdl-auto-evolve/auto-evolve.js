#!/usr/bin/env node

/**
 * FDL Auto-Evolve
 *
 * Automated blueprint validation → documentation generation → commit workflow.
 * Transforms FDL into an evolving system where improvements automatically propagate.
 *
 * Usage:
 *   node auto-evolve.js [--dry-run] [--verbose]
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PROJECT_ROOT = path.resolve(path.join(__dirname, '../../..'));
const BLUEPRINTS_DIR = path.join(PROJECT_ROOT, 'blueprints');
const SCRIPTS_DIR = path.join(PROJECT_ROOT, 'scripts');
const README_PATH = path.join(PROJECT_ROOT, 'README.md');
const LLMS_TXT_PATH = path.join(PROJECT_ROOT, 'llms.txt');

// Parse arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(title) {
  const width = 80;
  const padding = Math.floor((width - title.length - 2) / 2);
  log('─'.repeat(width), 'cyan');
  log(' '.repeat(padding) + title, 'cyan');
  log('─'.repeat(width), 'cyan');
}

async function step(name, fn) {
  log(`\n⏳ ${name}...`, 'blue');
  try {
    const result = await fn();
    if (VERBOSE) log(`   ${result}`, 'green');
    return result;
  } catch (error) {
    log(`✗ FAILED: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Step 1: Validate all blueprints
 */
async function validate() {
  const cmd = `node "${path.join(SCRIPTS_DIR, 'validate.js')}"`;
  try {
    const output = execSync(cmd, { encoding: 'utf-8', cwd: PROJECT_ROOT });
    const match = output.match(/(\d+) passed/);
    const passed = match ? match[1] : '0';
    return `${passed} blueprints passed validation`;
  } catch (error) {
    throw new Error(`Validation failed:\n${error.stdout || error.message}`);
  }
}

/**
 * Step 2: Generate documentation and API
 */
async function generateDocs() {
  try {
    execSync('npm run generate', {
      encoding: 'utf-8',
      cwd: PROJECT_ROOT,
      stdio: VERBOSE ? 'inherit' : 'pipe'
    });
    return 'Documentation and API generated';
  } catch (error) {
    throw new Error(`Documentation generation failed: ${error.message}`);
  }
}

/**
 * Step 3: Detect which blueprints changed
 */
async function detectChanges() {
  try {
    // Get list of changed files
    const output = execSync('git diff --name-only --cached', {
      encoding: 'utf-8',
      cwd: PROJECT_ROOT
    });

    const changedFiles = output.trim().split('\n').filter(f => f);
    const blueprintChanges = changedFiles
      .filter(f => f.startsWith('blueprints/') && f.endsWith('.yaml'))
      .map(f => {
        const parts = f.split('/');
        return {
          file: f,
          category: parts[1],
          name: parts[2]?.replace('.blueprint.yaml', ''),
          path: path.join(PROJECT_ROOT, f)
        };
      });

    const docsChanged = changedFiles.some(f => f.startsWith('docs/'));
    const apiChanged = changedFiles.some(f => f.startsWith('docs/api/'));

    return {
      blueprintChanges,
      docsChanged,
      apiChanged,
      totalChanged: changedFiles.length
    };
  } catch (error) {
    // No changes is not an error
    return {
      blueprintChanges: [],
      docsChanged: false,
      apiChanged: false,
      totalChanged: 0
    };
  }
}

/**
 * Step 4: Update README and llms.txt if blueprint count changed
 */
async function updateMetadata() {
  try {
    // Count blueprints
    const countBlueprints = (dir) => {
      let count = 0;
      const walk = (d) => {
        fs.readdirSync(d).forEach(file => {
          const fullPath = path.join(d, file);
          if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
          } else if (file.endsWith('.blueprint.yaml')) {
            count++;
          }
        });
      };
      walk(dir);
      return count;
    };

    const blueprintCount = countBlueprints(BLUEPRINTS_DIR);

    // Update README.md badge (if pattern exists)
    if (fs.existsSync(README_PATH)) {
      let readme = fs.readFileSync(README_PATH, 'utf-8');
      const oldBadge = /!\[Blueprints\]\([^)]+\)/;
      const newBadge = `![Blueprints](https://img.shields.io/badge/blueprints-${blueprintCount}-blue)`;
      if (readme.match(oldBadge)) {
        readme = readme.replace(oldBadge, newBadge);
        fs.writeFileSync(README_PATH, readme, 'utf-8');
        log(`   Updated README.md with ${blueprintCount} blueprints`, 'green');
      }
    }

    // Update llms.txt (if exists and has blueprint count)
    if (fs.existsSync(LLMS_TXT_PATH)) {
      let llmsTxt = fs.readFileSync(LLMS_TXT_PATH, 'utf-8');
      const oldCount = /(\d+) blueprint/;
      const newContent = llmsTxt.replace(oldCount, `${blueprintCount} blueprint`);
      if (newContent !== llmsTxt) {
        fs.writeFileSync(LLMS_TXT_PATH, newContent, 'utf-8');
        log(`   Updated llms.txt with ${blueprintCount} blueprints`, 'green');
      }
    }

    return `Metadata updated: ${blueprintCount} blueprints`;
  } catch (error) {
    if (VERBOSE) log(`   Warning: Could not update metadata: ${error.message}`, 'yellow');
    return 'Metadata update skipped';
  }
}

/**
 * Step 5: Generate commit message
 */
function generateCommitMessage(changes) {
  if (changes.blueprintChanges.length === 0) {
    return null; // No blueprints changed
  }

  const blueprintList = changes.blueprintChanges
    .map(b => `  - Updated ${b.name} (${b.category})`)
    .join('\n');

  const message = `Extract/Update FDL blueprints: improved features

${blueprintList}

All blueprints validated, documentation generated, API updated.
Auto-evolved via fdl-auto-evolve.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>`;

  return message;
}

/**
 * Step 6: Create commit
 */
async function createCommit(message) {
  if (!message) {
    log('   No blueprint changes to commit', 'yellow');
    return null;
  }

  try {
    // Stage all changed files
    execSync('git add -A', { cwd: PROJECT_ROOT });

    // Create commit
    execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8'
    });

    // Get commit hash
    const hash = execSync('git rev-parse --short HEAD', {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8'
    }).trim();

    return hash;
  } catch (error) {
    // No changes to commit
    if (error.message.includes('nothing to commit')) {
      return null;
    }
    throw error;
  }
}

/**
 * Main flow
 */
async function main() {
  try {
    header('FDL AUTO-EVOLVE — Blueprint Evolution System');

    if (DRY_RUN) {
      log('Running in DRY-RUN mode (no commits will be created)', 'yellow');
    }

    // Step 1: Validate
    const validateResult = await step('Step 1: Validate blueprints', validate);
    log(`✓ ${validateResult}`, 'green');

    // Step 2: Generate
    const docsResult = await step('Step 2: Generate documentation', generateDocs);
    log(`✓ ${docsResult}`, 'green');

    // Step 3: Detect changes
    const changes = await step('Step 3: Detect changes', detectChanges);
    log(`✓ Found ${changes.totalChanged} changed files`, 'green');
    if (VERBOSE) {
      log(`  - ${changes.blueprintChanges.length} blueprints`, 'cyan');
      log(`  - Docs: ${changes.docsChanged ? 'yes' : 'no'}`, 'cyan');
    }

    // Step 4: Update metadata
    const metaResult = await step('Step 4: Update metadata', updateMetadata);
    log(`✓ ${metaResult}`, 'green');

    // Step 5 & 6: Commit
    const commitMessage = generateCommitMessage(changes);
    if (commitMessage) {
      if (DRY_RUN) {
        log('\n✓ Would create commit with message:', 'yellow');
        log(commitMessage, 'cyan');
      } else {
        const commitHash = await step('Step 5: Create commit', () => createCommit(commitMessage));
        if (commitHash) {
          log(`✓ Commit created: ${commitHash}`, 'green');
          log(`\n📦 Next step: git push origin <branch>`, 'cyan');
        }
      }
    } else {
      log('\n✓ No blueprint changes to commit', 'yellow');
    }

    header('✓ Auto-Evolution Complete');
    process.exit(0);

  } catch (error) {
    log(`\n✗ EVOLUTION FAILED`, 'red');
    log(error.message, 'red');
    log('\nPlease fix the errors and try again.', 'yellow');
    process.exit(1);
  }
}

main();
