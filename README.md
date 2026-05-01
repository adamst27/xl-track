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

Ensure you have [Bun/Node] installed for optimal execution speed.

```bash
git clone [https://github.com/adamst27/xl-track.git](https://github.com/adamst27/xl-track.git)
cd xl-track
bun install
bun link
```

## Usage Commands

1. **xl-track init** - Initializes an empty .xl-vcs repository in the current directory.

2. **xl-track status** - Checks if the target .xlsx file has been modified since the last commit.

3. **xl-track diff** - Outputs a color-coded terminal view of additions, deletions, and cell modifications.

4. **xl-track commit** -m "Message" - Snapshots the current state of the data.

5. **xl-track log** - Displays the timeline of data modifications.
