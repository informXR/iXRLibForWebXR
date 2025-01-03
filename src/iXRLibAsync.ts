/// <summary>
/// The object for handling the threading/tasking.
/// Queue main tasks and chew through them one at a time both for sequencing and not oversaturating bandwidth.

import { iXRResult } from "./network/utils/DotNetishTypes";

/// </summary>
export class iXRLibAsync
{
// protected:
	// ---
	// using TimerCallback = std::function<void (bool bExiting)>;
	// // ---
	// public const			m_nCallbackPeriodicity: number = 500;	// Half second.
	// // ---
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
	// iXRLibAsync(const TimerCallback& pfnTimerCallback) :
	// 	m_pfnTimerCallback(pfnTimerCallback),
	// 	m_tWorkerThread(ThreadMayn, this)
	// {
	// }
	// ~iXRLibAsync()
	// {
	// 	Dispose();
	// }
	// Client thread.
	public async AddTask(pfnTask: (o: any) => Promise<iXRResult>, pObject: any, pfnCleanup: (o: any) => void): Promise<iXRResult>
	{
		// newscope
		// {
		// 	ScopeThreadBlock	cs(m_cs);

		// 	// MJP TODO:  deviceId etc is getting more complicated... make it a separate table.
		// 	m_qTasks.Enqueue(Task(pfnTask, pObject, pfnCleanup));
		// 	// Wake up the thread.
		// 	m_seWakeUp.SetEvent();
		// }
		return iXRResult.eOk;
	}
	// Worker thread.
	// static void ThreadMayn(iXRLibAsync* pThis)
	// {
	// 	pThis->ThreadMain();
	// }
	// // Worker thread.
	// void ThreadMain();
	// // Worker thread.
	// bool RunNextTask();
	// // Initially I thought the lifetime would be the absolute beginning and end of the app.
	// // Turns out Unity(tm) can background/foreground the app focus which needs iXRLibAsync
	// // to be able to cycle itself.  This is called in iXRLibInit::Start().
	// // Client thread.
	// void ReconstituteIfNecessary()
	// {
	// 	// Faffed about with trying to get parameter-packing etc to work in InPlaceRefresh<> so I would not
	// 	// have to to anything like this.  Endless grief on that.  If I ever figure it out it is prettier
	// 	// than this but this works for now.
	// 	struct PUBLIC_iXRLibAsync : public iXRLibAsync
	// 	{
	// 		PUBLIC_iXRLibAsync(const TimerCallback& pfnTimerCallback) :
	// 			iXRLibAsync(pfnTimerCallback)
	// 		{
	// 		}
	// 		~PUBLIC_iXRLibAsync()
	// 		{
	// 		}
	// 	};

	// 	if (m_bDestructed)
	// 	{
	// 		InPlaceRefresh<PUBLIC_iXRLibAsync>((PUBLIC_iXRLibAsync&)*this, m_pfnTimerCallback);
	// 	}
	// }
	// // Called from iXRLibInit::End().
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
