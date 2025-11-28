# GitHub Actions for Zamrock

This document explains the GitHub Actions workflow setup for the Zamrock project.

## Overview

The Zamrock repository uses GitHub Actions for continuous integration and deployment. The workflow is defined in [.github/workflows/ci.yml](.github/workflows/ci.yml) and includes linting, testing, and release automation.

## Workflow Triggers

The workflow runs on:
- Push to the `main` branch
- Pull requests targeting the `main` branch
- When a new release is created

## Jobs

### 1. Lint

**Purpose**: Ensures code quality and consistency across the codebase.

**Tools Used**:
- **Black**: Python code formatting
- **Flake8**: Python code linting
- **isort**: Python import sorting
- **Markdown Lint**: Markdown file formatting
- **ESLint**: JavaScript/TypeScript linting

**Configuration Files**:
- [.python-black](cci:7://file:///home/deathsmack/hub/zamrock/.python-black:0:0-0:0): Black formatter settings
- [.flake8](cci:7://file:///home/deathsmack/hub/zamrock/.flake8:0:0-0:0): Flake8 linting rules
- [.isort.cfg](cci:7://file:///home/deathsmack/hub/zamrock/.isort.cfg:0:0-0:0): Import sorting configuration
- [.markdown-lint.yml](cci:7://file:///home/deathsmack/hub/zamrock/.markdown-lint.yml:0:0-0:0): Markdown formatting rules
- [.eslintrc.json](cci:7://file:///home/deathsmack/hub/zamrock/.eslintrc.json:0:0-0:0): JavaScript/TypeScript linting rules

### 2. Test

**Purpose**: Runs the test suite to verify code functionality.

**Current Setup**:
- Runs after successful linting
- Sets up FFmpeg (required for audio processing)
- Placeholder for test commands (needs to be configured)

**To Configure Tests**:
1. Uncomment the test commands in the workflow file
2. Add your test scripts to the repository
3. Update the paths to match your test files

### 3. Release

**Purpose**: Automates the creation of new releases.

**When it runs**:
- Only on tag pushes starting with 'v' (e.g., v1.0.0)
- After successful linting and testing

**What it does**:
1. Creates a new GitHub Release
2. Uploads the latest `zamrock_v-1_5_1.sh` as a release asset
3. Tags the commit with the version number

## Configuration Files

### .github/workflows/ci.yml
The main workflow configuration file that defines the CI/CD pipeline.

### .github/linters/
Directory containing linter configuration files.

### .gitignore
Specifies which files should be ignored by Git.

## How to Use

### Running Locally
To run the same checks locally before pushing:

1. **Python Linting**:
   ```bash
   black .
   flake8
   isort .