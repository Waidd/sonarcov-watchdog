const fetch = require('node-fetch');
const lcovParser = require('lcov-parse');
const propertiesParser = require('properties-parser');

function parseSonarProperties (path) {
  return new Promise((resolve, reject) => {
    propertiesParser.read(path, (err, data) => {
      if (err) { return reject(new Error(`Could not read sonar properties file (${err.message}).`)); }
      resolve(data);
    });
  });
}

function getCoverageFromSonar (sonarUrl, sonarApiToken, sonarComponentKey) {
  return fetch(`${sonarUrl}/api/measures/component?metricKeys=coverage&componentKey=${sonarComponentKey}`, {
    headers: {
      'Authorization': `Basic ${new Buffer(`${sonarApiToken}:`).toString('base64')}`
    }
  })
  .then((res) => {
    if (res.status !== 200) {
      return res.text().then((text) => {
        throw new Error(`Error while contacting sonar (${text}).`);
      });
    }
    return res.json();
  })
  .then((res) => res.component.measures[0].value);
}

function parseCoverageReport (coveragePath) {
  return new Promise((resolve, reject) => {
    lcovParser(coveragePath, function (e, data) {
      if (e) { return reject(new Error(`Could not read lcov report (${e.toString()}).`)); }
      resolve(data);
    });
  });
}

function computeConverage (data, coverageExclusions) {
  let linesFound = 0;
  let linesHit = 0;
  let branchesFound = 0;
  let branchesHit = 0;

  data.forEach((file) => {
    if (coverageExclusions.find((each) => file.file.endsWith(each))) { return; }
    linesFound += file.lines.found;
    linesHit += file.lines.hit;
    branchesFound += file.branches.found;
    branchesHit += file.branches.hit;
  });

  let coverage = ((branchesHit + linesHit) / (branchesFound + linesFound)) * 100;
  coverage = Math.round(coverage * 10) / 10;
  return coverage;
}

function compareCoverage ([sonarCoverage, currentCoverage]) {
  const coverageBump = Math.round((currentCoverage - sonarCoverage) * 10) / 10;
  console.log(`Current coverage is ${coverageBump < 0 ? '' : '+'}${coverageBump}% from master`);

  if (coverageBump < 0) {
    console.log('Value has decreased, try again !');
    process.exit(1);
  } else if (coverageBump === 0) {
    console.log('Value is stable, fair enough.');
  } else {
    console.log('Value has increased, good job !');
  }
}

function execute (options) {
  parseSonarProperties(options.sonarPropertiesPath)
  .then((properties) => {
    if (!properties['sonar.projectKey']) { throw new Error('sonar.projectKey missing in sonar properties file.'); }

    const sonarCoveragePromise = getCoverageFromSonar(options.sonarUrl, options.sonarApiToken, properties['sonar.projectKey']);
    const parseCoveragePromise = parseCoverageReport(options.coveragePath)
    .then((data) => {
      const coverageExclusions = properties['sonar.exclusions'] && properties['sonar.exclusions'].split(',') || [];
      return computeConverage(data, coverageExclusions);
    });

    return Promise.all([sonarCoveragePromise, parseCoveragePromise]);
  })
  .then(compareCoverage)
  .catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}

module.exports = execute;
