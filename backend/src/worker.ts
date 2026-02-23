import { Worker } from 'bullmq';
import { analysisQueueName, connection } from './queues/analysisQueue.js';
import logger from './utils/logger.js';
import { generateInsightFromEntry } from './utils/insights.js';
import InsightRepository from './repositories/InsightRepository.js';

const worker = new Worker(
  analysisQueueName,
  async (job) => {
    const { entryId, userId, title } = job.data;
    logger.info('Processing entry analysis job', { entryId, userId, title });

    const insight = generateInsightFromEntry(job.data.content);
    await InsightRepository.upsertInsight(entryId, userId, insight.summary, insight.themes);

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
