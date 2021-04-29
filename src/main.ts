import * as core from '@actions/core';
import { pullInputs } from './utils';
import { WorkflowHandler } from './Workflow.class';
import { inspect } from 'util';

async function run() {
  try {
    const { token, workflowRef, inputs, ref, owner, repo } = pullInputs();

    const workflowHandler = new WorkflowHandler(token, workflowRef, owner, repo, ref);

    console.log(`Starting Workflow Dispatch 🚀`);

    const disaptchEvent = await workflowHandler.triggerWorkflow(inputs);

    if (disaptchEvent.status === 204) console.log('Workflow Dispatch Successful');
  } catch (error) {
    core.debug(inspect(error));
    if (error.status >= 400) {
      core.setFailed('Repository not found or insufficent access rights');
    } else {
      core.setFailed(error.message);
    }
  }
}

exports = run;

run();
