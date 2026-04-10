import { openDB } from 'idb';

const DB_NAME = 'city-pulse-offline-db';
const STORE_NAME = 'issue-queue';

export const initDB = async () => {
    return await openDB(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        },
    });
};

export const queueIssueOffline = async (issueData: any) => {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    await tx.objectStore(STORE_NAME).add({
        ...issueData,
        timestamp: new Date().toISOString()
    });
    await tx.done;

    if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).sync.register('sync-issues');
    }
};

export const getQueuedIssues = async () => {
    const db = await initDB();
    return await db.getAll(STORE_NAME);
};

export const clearQueuedIssue = async (id: number) => {
    const db = await initDB();
    await db.delete(STORE_NAME, id);
};
