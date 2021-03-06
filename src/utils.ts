import * as core from '@actions/core';
import * as github from '@actions/github';

enum TimeUnit {
  S = 1000,
  M = 60 * 1000,
  H = 60 * 60 * 1000,
}

const toMilli = (timeWithUnit: string): number => {
  const unitStr = timeWithUnit.substr(timeWithUnit.length - 1);
  const unit = TimeUnit[unitStr.toUpperCase() as keyof typeof TimeUnit];
  if (!unit) {
    throw new Error('Unknown time unit ' + unitStr);
  }
  const time = parseFloat(timeWithUnit);
  return time * unit;
};

export function pullInputs() {
  const inputs = {
    token: core.getInput('token'),
    workflowRef: core.getInput('workflowRef'),
    ref: core.getInput('ref') || github.context.ref,
    payload: JSON.parse(core.getInput('payload') || '{}'),
  };

  const [owner, repo] = core.getInput('repository').split('/') || [github.context.repo.owner, github.context.repo.repo];

  return {
    ...inputs,
    owner,
    repo,
  };
}

export function debug(title: string, content: any) {
  if (core.isDebug()) {
    core.info(`::group::${title}`);
    core.debug(JSON.stringify(content, null, 3));
    core.info('::endgroup::');
  }

  // Local ENV
  if (process.env['LOCAL_DEBUG'] === '1') {
    console.log(`::group::${title}`);
    console.log(JSON.stringify(content, null, 3));
    console.log('::endgroup::');
  }
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isTimedOut(start: number, waitForCompletionTimeout: number) {
  return Date.now() > start + waitForCompletionTimeout;
}

export function formatDuration(duration: number) {
  const durationSeconds = duration / 1000;
  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds - hours * 3600) / 60);
  const seconds = durationSeconds - hours * 3600 - minutes * 60;

  let hoursStr = hours + '';
  let minutesStr = minutes + '';
  let secondsStr = seconds + '';

  if (hours < 10) hoursStr = '0' + hoursStr;
  if (minutes < 10) minutesStr = '0' + minutesStr;
  if (seconds < 10) secondsStr = '0' + secondsStr;

  return `${hoursStr}h ${minutesStr}m ${secondsStr}s`;
}
