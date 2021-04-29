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
  // Required inputs
  const token = core.getInput('token');
  const workflowRef = core.getInput('workflowRef');

  // Optional inputs, with defaults
  const ref = core.getInput('ref') || github.context.ref;
  const [owner, repo] = core.getInput('repo')?.split('/') || [github.context.repo.owner, github.context.repo.repo];
  const inputs = JSON.parse(core.getInput('inputs') || '{}');

  const outputs = {
    token,
    workflowRef,
    ref,
    owner,
    repo,
    inputs,
  };

  console.log('outputs', outputs);

  return outputs;
}

export function debug(title: string, content: any) {
  if (core.isDebug()) {
    core.info(`::group::${title}`);
    core.debug(JSON.stringify(content, null, 3));
    core.info('::endgroup::');
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
