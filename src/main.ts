import core from '@actions/core';
import { pullInputs, getOpenPRBranches, triggerWorkflow } from './utils';
import { inspect } from 'util';

async function run() {
  try {
    const { token, workflow_filename, owner, repo } = pullInputs();

    console.log(`Starting Workflow Dispatch 🚀`);

    const branches = await getOpenPRBranches({ repo, owner, token });

    const results = await Promise.all(
      branches.map((branch_name) => triggerWorkflow({ owner, repo, token, workflow_filename, ref: branch_name })),
    );

    results.map(([success, branch]) => {
      if (success) console.log(`branch ${branch} 's workflow ${workflow_filename} is successfully triggered`);
      if (!success) console.log(`branch ${branch} 's workflow ${workflow_filename} failed to be triggered`);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    core.debug(inspect(error));
    if (error.status >= 400) {
      core.setFailed('Repository not found or insufficient access rights');
    } else {
      core.setFailed(error.message);
    }
  }
}

run();
