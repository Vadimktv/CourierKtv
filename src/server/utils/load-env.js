const fs = require('fs');
const path = require('path');

function loadEnvironment() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, 'utf8');
  content.split(/\r?\n/).forEach((line) => {
    if (!line || line.trim().length === 0 || line.trim().startsWith('#')) {
      return;
    }
    const equalsIndex = line.indexOf('=');
    if (equalsIndex === -1) {
      return;
    }
    const key = line.slice(0, equalsIndex).trim();
    const value = line.slice(equalsIndex + 1).trim();
    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  });
}

module.exports = {
  loadEnvironment,
};
