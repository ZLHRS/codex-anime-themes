using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Windows.Forms;

[assembly: AssemblyTitle("ZLHRS Theme Studio")]
[assembly: AssemblyDescription("Theme gallery and launcher for ChatGPT")]
[assembly: AssemblyCompany("ZLHRS")]
[assembly: AssemblyProduct("ZLHRS Theme Studio")]
[assembly: AssemblyVersion("1.6.0.0")]
[assembly: AssemblyFileVersion("1.6.0.0")]

internal static class Program
{
    [STAThread]
    private static int Main(string[] args)
    {
        bool test = Array.IndexOf(args, "--self-test") >= 0;
        try
        {
            string root = AppDomain.CurrentDomain.BaseDirectory;
            string installed = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "ZLHRS", "ThemeStudio");
            bool isInstalled = String.Equals(root.TrimEnd(Path.DirectorySeparatorChar), installed, StringComparison.OrdinalIgnoreCase);
            bool launch = Array.IndexOf(args, "--launch") >= 0;
            string script = Path.Combine(root, test || launch || isInstalled ? "Theme-Selector.ps1" : "Open-Studio.ps1");
            if (!File.Exists(script) || !File.Exists(Path.Combine(root, "catalog.json")))
                throw new FileNotFoundException("Keep the EXE inside the complete Theme Studio folder. Extract the whole ZIP and try again.");
            string powershell = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System), @"WindowsPowerShell\v1.0\powershell.exe");
            var start = new ProcessStartInfo(powershell);
            start.Arguments = "-NoProfile -STA -WindowStyle Hidden -ExecutionPolicy Bypass -File \"" + script + "\"" + (test ? " -SelfTest" : launch ? " -Launch" : "");
            start.WorkingDirectory = root;
            start.UseShellExecute = false;
            start.CreateNoWindow = true;
            start.WindowStyle = ProcessWindowStyle.Hidden;
            using (Process process = Process.Start(start))
            {
                if (test) { process.WaitForExit(); return process.ExitCode; }
            }
            return 0;
        }
        catch (Exception error)
        {
            if (!test) MessageBox.Show(error.Message, "ZLHRS Theme Studio", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return 1;
        }
    }
}
