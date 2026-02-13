# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository appears to be a distribution or installation directory for **RoboDJ Automation**, a software suite for radio automation. It contains compiled executables, configuration files, and documentation, rather than raw source code.

- **Primary Executable**: `RoboDJ Automation.exe`
- **Launcher**: `RoboDJ_Launcher.bat` (runs the executable with administrative privileges)
- **Configuration**: Located in the `config/` directory
- **Platform**: Windows

## Commands

Since this is a compiled distribution, there are no build or test commands.

- **Run Application**: `.\RoboDJ_Launcher.bat` (Recommended, ensures Admin privileges and uses relative path resolution so it remains portable across install locations)
- **Run Directly**: `.\RoboDJ Automation.exe`

## Architecture & Structure

The repository follows a flat deployment structure:

- **Root**: Contains binaries (`.exe`), the launcher (`.bat`), and PDF documentation.
- **config/**: Stores runtime state and user configuration.
  - `schedules.json`: Scheduling configuration.
  - `prompt_variables.json`: Variables for prompt generation.
  - `settings.db` & `user_content.db`: SQLite databases for application storage.
  - `prompts/` & `scripts/`: Directories for user-defined content (currently empty).
- **Documentation**:
  - `README.pdf`: Main manual.
  - `QUICK_START_FEATURE_GUIDE.pdf`: Feature overview.
  - `TIME_VARIABLES_EXAMPLES.pdf`: Guide for using time-based variables.

## Configuration Formats

- **JSON**: Used for lightweight config (`schedules.json`, `prompt_variables.json`). Standard JSON formatting applies.
- **Databases**: SQLite format (`.db`). Do not edit textually; require a SQLite client to inspect.

## Development Notes

- **Source Code**: Not present. This repo is for managing the runtime environment, deployment, or configuration backups.
- **Modifications**: Changes should generally be limited to configuration files in `config/` or batch scripts. The executables cannot be modified.
