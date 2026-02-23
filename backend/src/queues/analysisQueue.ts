import dotenv from 'dotenv';
import { Queue } from 'bullmq';
dotenv.config();

export const analysisQueueName = 'entry-analysis';
export const connection = { url: process.env.REDIS_URL || 'redis://localhost:6379' };

export interface EntryAnalysisJob {
  entryId: string;
  userId: string;
  title: string;
  content: string;
}

let analysisQueue: Queue<EntryAnalysisJob> | null = null;

function getAnalysisQueue(): Queue<EntryAnalysisJob> {
  if (!analysisQueue) {
    analysisQueue = new Queue<EntryAnalysisJob>(analysisQueueName, { connection });
  }
  return analysisQueue;
}

export async function enqueueEntryAnalysis(job: EntryAnalysisJob): Promise<void> {
  const queue = getAnalysisQueue();
  await queue.add('analyze-entry', job, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 1000,
  });
}
