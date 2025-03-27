/// <summary>
/// The object for handling the threading/tasking.
/// Queue main tasks and chew through them one at a time both for sequencing and not oversaturating bandwidth.

import { AbxrResult } from "./network/utils/DotNetishTypes";
//import { Worker } from "worker_threads";		// For Node.js.
//import { parentPort } from 'worker_threads';	// For Node.js.
//import { spawn, Thread, Worker } from "threads"

// NOTES:  The commented out code is a) code samples for doing threading in both browser and Node.js and b) the C++ code unported to TypeScript.
// For the first cut, I am betting on promises and async/await being sufficient.  We can either clean out the comments if we become totally sure
// promises will always be sufficient or we can use the threading code as a reference for how to do threading in TypeScript.

//// main.ts
//if (typeof Worker !== 'undefined')
//{
//	// Web Worker for browser environments.
//	const objWorker:	Worker = new Worker(new URL('./worker.ts', import.meta.url));

//	objWorker.postMessage('Hello from the main thread!');
//	objWorker.onmessage = (event) =>
//	{
//		console.log('Received message from worker:', event.data);
//	};
//}
//else
//{
//	console.log('Web Workers are not supported in this environment.');
//}

//// worker.ts Worker thread for Web Worker.
//self.onmessage = (event) =>
//{
//	console.log('Received message from main thread:', event.data);
//	self.postMessage('Hello from the worker thread!');
//};

//// ---

//// main.ts
//const worker = new Worker(new URL('./worker.ts', import.meta.url));

//worker.on('message', (message) =>
//{
//console.log('Received message from worker:', message);
//});

//worker.postMessage('Hello from the main thread!');

//// worker.ts Worker thread for Node.js.
//parentPort.on('message', (message) =>
//{
//	console.log('Received message from main thread:', message);
//	parentPort.postMessage('Hello from the worker thread!');
//});

type TimerCallback = (bExiting: boolean) => void;

/// </summary>
export class AbxrLibAsync
{
// protected:
	// ---
	public static m_nCallbackPeriodicity:	number;
	// ---
	public static InitStatics(): void
	{
		AbxrLibAsync.m_nCallbackPeriodicity = 500;	// Half second.
	}
	// std::recursive_mutex	m_cs;
	// std::thread				m_tWorkerThread;
	// bool					m_bKeepRunning = true;
	// bool					m_bDestructed = false;
	// SyncEvent				m_seWakeUp;
	// Queue<Task>				m_qTasks;
	// TimerCallback			m_pfnTimerCallback = nullptr;
	// // ---
	// // Wake up on a singalling object and grab something to do out of queue.
	// // ---
	// // Alternately, do it with tasks and AwaitAny on the pending tasks.
	// AbxrLibAsync(const TimerCallback& pfnTimerCallback) :
	// 	m_pfnTimerCallback(pfnTimerCallback),
	// 	m_tWorkerThread(ThreadMayn, this)
	// {
	// }
	// ~AbxrLibAsync()
	// {
	// 	Dispose();
	// }
	// Client thread.
	public async AddTask(pfnTask: (o: any) => Promise<AbxrResult>, pObject: any, pfnCleanup: (o: any) => void): Promise<AbxrResult>
	{
		var objPromise:	Promise<AbxrResult> = new Promise(
			async (resolve, reject) =>
			{
				var eRet:	AbxrResult = await pfnTask(pObject);

				pfnCleanup(pObject);
				resolve(eRet);
			});
		// newscope
		// {
		// 	ScopeThreadBlock	cs(m_cs);

		// 	// MJP TODO:  deviceId etc is getting more complicated... make it a separate table.
		// 	m_qTasks.Enqueue(Task(pfnTask, pObject, pfnCleanup));
		// 	// Wake up the thread.
		// 	m_seWakeUp.SetEvent();
		// }
		return AbxrResult.eOk;
	}
	// Worker thread.
	// static void ThreadMayn(AbxrLibAsync* pThis)
	// {
	// 	pThis->ThreadMain();
	// }
	// // Worker thread.
	// void ThreadMain();
	// // Worker thread.
	// bool RunNextTask();
	// // Initially I thought the lifetime would be the absolute beginning and end of the app.
	// // Turns out Unity(tm) can background/foreground the app focus which needs AbxrLibAsync
	// // to be able to cycle itself.  This is called in AbxrLibInit::Start().
	// // Client thread.
	// void ReconstituteIfNecessary()
	// {
	// 	// Faffed about with trying to get parameter-packing etc to work in InPlaceRefresh<> so I would not
	// 	// have to to anything like this.  Endless grief on that.  If I ever figure it out it is prettier
	// 	// than this but this works for now.
	// 	struct PUBLIC_AbxrLibAsync : public AbxrLibAsync
	// 	{
	// 		PUBLIC_AbxrLibAsync(const TimerCallback& pfnTimerCallback) :
	// 			AbxrLibAsync(pfnTimerCallback)
	// 		{
	// 		}
	// 		~PUBLIC_AbxrLibAsync()
	// 		{
	// 		}
	// 	};

	// 	if (m_bDestructed)
	// 	{
	// 		InPlaceRefresh<PUBLIC_AbxrLibAsync>((PUBLIC_AbxrLibAsync&)*this, m_pfnTimerCallback);
	// 	}
	// }
	// // Called from AbxrLibInit::End().
	// // Client thread.
	// void Dispose()
	// {
	// 	if (m_bKeepRunning)	// Use this as a don't-call-more-than-once flag.
	// 	{
	// 		m_bKeepRunning = false;
	// 		m_seWakeUp.SetEvent();
	// 		m_tWorkerThread.join();
	// 		m_bDestructed = true;
	// 	}
	// }
};
