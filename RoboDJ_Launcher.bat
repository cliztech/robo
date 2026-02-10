@echo off
:: Launches RoboDJ Automation as Administrator to fix permission issues
powershell Start-Process -FilePath '"E:\onedrive\ai music agents\robodj\RoboDJ Automation.exe"' -WorkingDirectory '"E:\onedrive\ai music agents\robodj"' -Verb RunAs
