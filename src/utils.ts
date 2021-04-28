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

// const pullArgs = () => {
//   const workflowName = core.getInput('workflow_name') || 'Build & Deploy';

//   const inputs = core.getInput('outputs') || { release: '0.3.31' };

//   const ref = core.getInput('ref') || github.context.ref || 'main';

//   const [owner, repo] = core.getInput('repo') || ['Bundlefi', 'Bundlefi_Build'] || [
//       github.context.repo.owner,
//       github.context.repo.repo,
//     ];

//   const token = core.getInput('token') || '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';

//   return { token, workflowName, inputs, ref, owner, repo };
// };

export function pullArgs() {
  // Required inputs
  const token = core.getInput('token') || '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';
  const workflowRef = core.getInput('workflow') || 'Build & Deploy';

  // Optional inputs, with defaults
  const ref = core.getInput('ref') || 'main' || github.context.ref;
  const [owner, repo] = ['Bundlefi', 'Bundlefi_Build'] ||
    core.getInput('repo')?.split('/') || [github.context.repo.owner, github.context.repo.repo];
  const inputs = JSON.parse(core.getInput('inputs') || '{ "release": "0.3.31" }' || '{}');

  // const displayWorkflowUrlStr = core.getInput('display-workflow-run-url');
  // const displayWorkflowUrl = displayWorkflowUrlStr && displayWorkflowUrlStr === 'true';
  // const displayWorkflowUrlTimeout = toMilli(core.getInput('display-workflow-run-url-timeout'));
  // const displayWorkflowUrlInterval = toMilli(core.getInput('display-workflow-run-url-interval'));

  // const waitForCompletionStr = core.getInput('wait-for-completion');
  // const waitForCompletion = waitForCompletionStr && waitForCompletionStr === 'true';
  // const waitForCompletionTimeout = toMilli(core.getInput('wait-for-completion-timeout'));
  // const checkStatusInterval = toMilli(core.getInput('wait-for-completion-interval'));

  return {
    token,
    workflowRef,
    ref,
    owner,
    repo,
    inputs,
    // displayWorkflowUrl,
    // displayWorkflowUrlTimeout,
    // displayWorkflowUrlInterval,
    // checkStatusInterval,
    // waitForCompletion,
    // waitForCompletionTimeout,
  };
}

export function debug(title: string, content: any) {
  // if (core.isDebug()) {
  core.info(`::group::${title}`);
  core.debug(JSON.stringify(content, null, 3));
  core.info('::endgroup::');
  // }
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
