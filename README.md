# XL-Track

A high-performance, lightweight version control system specifically designed for tabular data and Excel spreadsheets.

Excel files are notoriously difficult to track in Git because they are zipped XML archives. Changing a single cell modifies multiple underlying files, making standard Git diffs useless and unreadable. XL-Track solves this by stripping away the XML bloat, extracting the raw state of the data, and performing high-speed delta comparisons.

## Architecture

XL-Track does not version the `.xlsx` binary. Instead, it normalizes the data:

1. **Extract:** Reads the Excel file and extracts raw values.
2. **Normalize:** Converts the tabular data into a deterministic JSON format.
3. **Hash:** Computes a SHA-256 hash of the pure data state.
4. **Diff:** Compares JSON structures to output clean, row-by-row terminal diffs.

## Installation

Ensure you have [Bun](https://bun.sh) installed for optimal execution speed.

```bash
git clone https://github.com/adamst27/xl-track.git
cd xl-track
bun install
```

Add `xl-track/bin/` to your system PATH, then `xlgit` works from anywhere.

## Usage Commands

1. **xlgit init** - Initialize a new xlgit repository in the current directory.

2. **xlgit add <file>** - Add an Excel file to tracking.

3. **xlgit status [file]** - Check status of all tracked files (or a specific file).

4. **xlgit commit -m "Message"** - Commit the current state of all tracked files.

5. **xlgit diff [file]** - Show color-coded additions, deletions, and cell modifications.

6. **xlgit log** - Display the timeline of data modifications.

## Examples

```bash
xlgit init
xlgit add data.xlsx
xlgit status
xlgit commit -m "Initial commit"
xlgit diff
xlgit log
```