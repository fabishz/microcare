import { Worker } from 'bullmq';
import { analysisQueueName, connection } from './queues/analysisQueue.js';
import logger from './utils/logger.js';

const worker = new Worker(
  analysisQueueName,
  async (job) => {
    const { entryId, userId, title } = job.data;
    logger.info('Processing entry analysis job', { entryId, userId, title });

    // Placeholder for AI analysis integration.
    // This is intentionally asynchronous and should be replaced with a real model/service call.
    await new Promise((resolve) => setTimeout(resolve, 250));

    logger.info('Entry analysis completed', { entryId, userId });
  },
  { connection }
);

worker.on('failed', (job, err) => {
  logger.error('Entry analysis job failed', {
    jobId: job?.id,
    entryId: job?.data?.entryId,
    error: err.message,
  });
});

worker.on('completed', (job) => {
  logger.info('Entry analysis job completed', { jobId: job.id, entryId: job.data.entryId });
});
