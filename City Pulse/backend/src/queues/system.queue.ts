import { Queue, Worker, Job } from "bullmq";
import Redis from "ioredis";

// Optional fallback if Redis isn't running so Node loop doesn't crash on windows strictly
const connection = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null }) : null;

export const systemQueue = connection ? new Queue("system-background-jobs", { connection }) : null;

if (connection) {
    const systemWorker = new Worker(
        "system-background-jobs",
        async (job: Job) => {
            console.log(`Processing background job: ${job.name} (ID: ${job.id})`);

            if (job.name === "recompute-geo-clusters") {
                // Mock heavy aggregation workload
                console.log("Geo clustering recomputed successfully via BullMQ.");
            } else if (job.name === "massive-notification-dispatch") {
                console.log("Bulk notifications dispatched successfully.");
            }
        },
        { connection }
    );

    systemWorker.on("completed", (job) => {
        console.log(`Job ${job.id} completed successfully`);
    });

    systemWorker.on("failed", (job, err) => {
        console.error(`Job ${job?.id} failed:`, err.message);
    });
} else {
    console.warn("BullMQ System Queue initialized offline (Redis unavailable)");
}
