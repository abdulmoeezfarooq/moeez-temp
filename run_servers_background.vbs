Set WshShell = CreateObject("WScript.Shell")
' Run backend python server silently (0 hides the CMD window)
WshShell.Run "cmd.exe /c cd /d ""c:\Users\THE TECHBOOK\Desktop\moeez-temp-1\backend"" && py main.py", 0, False
' Run frontend Next.js server silently (0 hides the CMD window)
WshShell.Run "cmd.exe /c cd /d ""c:\Users\THE TECHBOOK\Desktop\moeez-temp-1\frontend"" && npm run dev", 0, False
