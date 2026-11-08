using System;
using System.Diagnostics;
using System.Threading;

// Holds the legacy engine lock without keeping a PowerShell runtime resident.
internal static class LegacyLock {
    static int Main(string[] args) {
        try {
            using (var owner = Process.GetProcessById(int.Parse(args[0])))
            using (var mutex = new Mutex(false, args[1])) {
                bool acquired = false;
                try {
                    try { acquired = mutex.WaitOne(5000); }
                    catch (AbandonedMutexException) { acquired = true; }
                    if (!acquired) throw new Exception("Another theme controller owns the legacy lock.");
                    Console.WriteLine("ready");
                    Console.Out.Flush();
                    owner.WaitForExit();
                } finally { if (acquired) mutex.ReleaseMutex(); }
            }
            return 0;
        } catch (Exception error) { Console.Error.WriteLine(error.Message); return 1; }
    }
}
