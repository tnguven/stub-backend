const fs = require('fs');
const args = require('minimist')(process.argv.slice(2));
const exitHook = require('../utils/exit-hook');

const hasNoTempTrace = !!args['no_temp_trace'];
const hasDynamicTemp = !!args['dynamic_temp'];
const pid = process.pid;

const root = 'temp/';
const relativePath = `${root}temp${hasDynamicTemp ? `-${pid}` : ''}.json`;

let unSubscribeExit;

module.exports = function retryOps(req, scenario, path) {
  if (!scenario._retry || scenario._retry === 0) {
    return scenario._res;
  }

  let requestTracker = checkPath(path + relativePath) ? readFile(path) : createTempFile(path);

  const uniqueId = createID(req, scenario);
  const numberMatches = requestTracker.ids.filter((id) => id === uniqueId).length;

  if (numberMatches === scenario._retry) {
    requestTracker = { ids: requestTracker.ids.filter((id) => id !== uniqueId) };
  } else {
    requestTracker.ids.push(uniqueId);
  }
  fs.writeFileSync(path + relativePath, JSON.stringify(requestTracker, null, 2));

  if (hasNoTempTrace && unSubscribeExit === undefined) {
    unSubscribeExit = exitHook({ onExit: removeTempFile(path + relativePath), id: pid });
  }

  return numberMatches > 0 ? scenario._resRetry[numberMatches - 1] : scenario._res;
};

/**
 * @return {number} identifier
 * @param {object} scenario
 */
function createNumber(scenario) {
  const text = JSON.stringify(scenario);
  let i = 0;
  let count = 0;
  for (i = 0; i < text.length; i++) {
    count = count + text.charCodeAt(i);
  }
  return count;
}

/**
 * @param {object} req
 * @param {object} scenario
 * @return {string} uniqueId
 */
function createID(req, scenario) {
  const method = req.method;
  const pathFormatted = req.path.replace(/\/|\?|\=|\&/g, '');
  const uniqueId = createNumber(scenario);
  return `${method}-${pathFormatted}-${uniqueId}`;
}

/**
 * @param {string} path
 * @return {boolean} result path exist
 */
const checkPath = (path) => {
  try {
    return fs.existsSync(path);
  } catch (err) {
    return false;
  }
};

/**
 * @param {string} path
 * @return {object} temporary object
 */
const createTempFile = (path) => {
  const dir = path + root;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  const requestSHistory = { ids: [] };
  fs.writeFileSync(path + relativePath, JSON.stringify(requestSHistory, null, 2));
  return requestSHistory;
};

/**
 * @param {string} path
 * @return {object} temporary object
 */
const readFile = (path) => {
  return JSON.parse(fs.readFileSync(path + relativePath).toString());
};

/**
 * @param {string} path
 * @return {(function(function): void)} - return a function to wrap exit
 */
function removeTempFile(path) {
  return function removeFile() {
    return new Promise((resolve, reject) => {
      fs.unlink(path, (err) => {
        if (err) {
          reject(err);
        }
        console.log('\x1b[31m', `\ntemp-${pid}.json has been cleaned`);
        resolve();
      });
    });
  };
}
