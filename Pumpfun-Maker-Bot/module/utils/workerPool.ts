
import { Worker } from 'worker_threads';

interface Task {
  worker: string; // Path to the worker file
  data: any;
}

export class WorkerPool {
  private poolSize: number;
  private tasks: Task[] = [];
  private workers: Worker[] = [];
  private activeWorkers: number = 0;

  constructor(poolSize: number) {
    this.poolSize = poolSize;
  }

  // Add tasks to the queue
  addTask(task: Task): void {
    this.tasks.push(task);
    this.runTask();
  }

  // Run the tasks using available slots in the pool
  private runTask(): void {
    if (this.tasks.length > 0 && this.activeWorkers < this.poolSize) {
      const task = this.tasks.shift();
      if (task) {
        this.activeWorkers++;
        const worker = new Worker(task.worker, { workerData: task.data });
        this.workers.push(worker);

        // Handle worker events
        worker.on('message', (message) => {
          console.log('Worker completed:', message);
        });

        worker.on('error', (error) => {
          console.error('Worker error:', error);
        });

        worker.on('exit', (exitCode) => {
          console.log('Worker exited with code:', exitCode);
          this.activeWorkers--;
          this.runTask();
        });
      }
    }
  }


  // // Add tasks to the queue and return a promise for task completion
  // addAsyncTask(task: Task): Promise<any> {
  //   return new Promise((resolve, reject) => {
  //     this.tasks.push(task);
  //     this.runAsyncTask(resolve, reject);
  //   });
  // }

  // // Run the tasks using the available slots in the pool
  // private runAsyncTask(resolve: (value: any) => void, reject: (reason: any) => void): void {
  //   if (this.tasks.length > 0 && this.activeWorkers < this.poolSize) {
  //     const task = this.tasks.shift();
  //     if (task) {
  //       this.activeWorkers++;
  //       const worker = new Worker(task.worker, { workerData: task.data });
  //       this.workers.push(worker);

  //       // Handle worker events
  //       worker.on('message', (message) => {
  //         console.log('Async worker completed:', message);
  //         resolve(message); // Resolve the promise when the worker sends a message
  //       });

  //       worker.on('error', (error) => {
  //         console.error('Async worker error:', error);
  //         reject(error); // Reject the promise if the worker errors out
  //       });

  //       worker.on('exit', (exitCode) => {
  //         console.log('Async worker exited with code:', exitCode);
  //         this.activeWorkers--;
  //         if (exitCode !== 0) {
  //           reject(new Error(`Async worker exited with code: ${exitCode}`)); // Reject if worker exits with non-zero code
  //         } else {
  //           this.runAsyncTask(resolve, reject); // Continue processing
  //         }
  //       });
  //     }
  //   }
  // }

  // Terminate all workers
  terminateAll(): void {
    this.workers.forEach((worker) => worker.terminate());
    this.workers = [];
    this.activeWorkers = 0;
  }
}
