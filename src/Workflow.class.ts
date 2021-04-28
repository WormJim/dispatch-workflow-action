import * as core from '@actions/core';
import * as github from '@actions/github';
import { GitHub } from '@actions/github/lib/utils';
import { debug } from './utils';

export enum WorkflowRunStatus {
  QUEUED = 'queued',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

const ofStatus = (status: string | null): WorkflowRunStatus => {
  if (!status) return WorkflowRunStatus.QUEUED;

  const key = status.toUpperCase() as keyof typeof WorkflowRunStatus;
  return WorkflowRunStatus[key];
};

export enum WorkflowRunConclusion {
  SUCCESS = 'success',
  FAILURE = 'failure',
  CANCELLED = 'cancelled',
  SKIPPED = 'skipped',
  NEUTRAL = 'neutral',
  TIMED_OUT = 'timed_out',
  ACTION_REQUIRED = 'action_required',
}

const ofConclusion = (conclusion: string | null): WorkflowRunConclusion => {
  if (!conclusion) return WorkflowRunConclusion.NEUTRAL;

  const key = conclusion.toUpperCase() as keyof typeof WorkflowRunConclusion;
  return WorkflowRunConclusion[key];
};

export interface WorkflowRunResult {
  url: string;
  status: WorkflowRunStatus;
  conclusion: WorkflowRunConclusion;
}

export class WorkflowHandler {
  private octokit: InstanceType<typeof GitHub>;
  private workflowId?: number | string;
  private workflowRunId?: number;
  private triggerDate = 0;

  constructor(
    token: string,
    private workflowRef: string,
    private owner: string,
    private repo: string,
    private ref: string,
  ) {
    this.octokit = github.getOctokit(token);
  }

  async triggerWorkflow(inputs: { [prop: string]: string }) {
    try {
      const workflow_id = await this.getWorkflowId();
      this.triggerDate = Date.now();

      const response = await this.octokit.actions.createWorkflowDispatch({
        owner: this.owner,
        repo: this.repo,
        ref: this.ref,
        workflow_id,
        inputs,
      });

      debug('Workflow Dispatch', response);
      return response;
    } catch (error) {
      debug('Workflow Dispatch error', error.message);
      throw error;
    }
  }

  async getWorkflowRunStatus(): Promise<WorkflowRunResult> {
    try {
      const runId = await this.getWorkflowRunId();
      const response = await this.octokit.actions.getWorkflowRun({
        owner: this.owner,
        repo: this.repo,
        run_id: runId,
      });
      debug('Workflow Run status', response);

      return {
        url: response.data.html_url,
        status: ofStatus(response.data.status),
        conclusion: ofConclusion(response.data.conclusion),
      };
    } catch (error) {
      debug('Workflow Run status error', error);
      throw error;
    }
  }

  async getWorkflowRunArtifacts(): Promise<Omit<WorkflowRunResult, 'conclusion'>[]> {
    try {
      const runId = await this.getWorkflowRunId();
      const response = await this.octokit.actions.listWorkflowRunArtifacts({
        owner: this.owner,
        repo: this.repo,
        run_id: runId,
      });
      debug('Workflow Run artifacts', response);

      return response.data.artifacts.map((artifact) => {
        return {
          url: artifact.archive_download_url,
          status: ofStatus(artifact.expires_at),
          // conclusion: ofConclusion(artifact.),
        };
      });
    } catch (error) {
      debug('Workflow Run artifacts error', error);
      throw error;
    }
  }

  private async getWorkflowRunId(): Promise<number> {
    if (this.workflowRunId) return this.workflowRunId;

    try {
      core.debug('Get workflow run id');
      const workflowId = await this.getWorkflowId();
      const response = await this.octokit.actions.listWorkflowRuns({
        owner: this.owner,
        repo: this.repo,
        workflow_id: workflowId,
        event: 'workflow_dispatch',
      });
      debug('List Workflow Runs', response);

      const runs = response.data.workflow_runs.filter(
        (run: any) => new Date(run.created_at).valueOf() >= this.triggerDate,
      );

      debug(
        `Filtered Workflow Runs (after trigger date: ${new Date(this.triggerDate).toISOString()})`,
        runs.map((run: any) => ({
          id: run.id,
          name: run.name,
          created_at: run.creatd_at,
          triggerDate: new Date(this.triggerDate).toISOString(),
          created_at_ts: new Date(run.created_at).valueOf(),
          triggerDateTs: this.triggerDate,
        })),
      );

      if (runs.length == 0) throw new Error('Run not found');

      this.workflowRunId = runs[0].id as number;
      return this.workflowRunId;
    } catch (error) {
      debug('Get workflow run id error', error);
      throw error;
    }
  }

  private async getWorkflowId(): Promise<number | string> {
    if (this.workflowId) return this.workflowId;

    if (this.isFilename(this.workflowRef)) {
      this.workflowId = this.workflowRef;
      core.debug(`Workflow id is: ${this.workflowRef}`);
      return this.workflowId;
    }

    try {
      const workflows = await this.octokit.paginate(this.octokit.actions.listRepoWorkflows, {
        owner: this.owner,
        repo: this.repo,
      });

      debug(`List Workflows`, workflows);

      // Locate workflow either by name or id
      const workflow = workflows.find(
        (flow: any) => flow.name === this.workflowRef || flow.id.toString() === this.workflowRef,
      );

      if (!workflow) throw new Error(`Unable to find workflow '${this.workflowRef}' in ${this.owner}/${this.repo}`);

      core.debug(`Workflow id is: ${workflow.id}`);
      this.workflowId = workflow.id as number;
      return this.workflowId;
    } catch (error) {
      debug('List workflows error', error);
      throw error;
    }
  }

  private isFilename(workflowRef: string) {
    return /.+\.ya?ml$/.test(workflowRef);
  }
}
