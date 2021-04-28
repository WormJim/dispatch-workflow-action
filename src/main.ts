import * as core from '@actions/core';
import { pullArgs } from './utils';
import { WorkflowHandler } from './Workflow.class';

async function run() {
  try {
    const { token, workflowRef, inputs, ref, owner, repo } = pullArgs();

    const workflowHandler = new WorkflowHandler(token, workflowRef, owner, repo, ref);

    // Trigger workflow run
    core.info(`Starting Workflow Dispatch 🚀`);
    const disaptchEvent = await workflowHandler.triggerWorkflow(inputs);
    if (disaptchEvent.status === 204) core.info('Workflow Dispatch Successful');
  } catch (error) {
    core.setFailed(error.message);
    core.debug(error.stack);
  }
}

exports = run;

if (require.main === module) {
  run();
}
