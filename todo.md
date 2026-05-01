Phase 1: The Core Infrastructure

[x] Initialize the project: Set up a fast CLI environment (e.g., using Bun or Node).

[ ] Implement init: Write the logic to create a hidden .xl-vcs directory in the target folder to store snapshots and metadata.

[ ] The Extractor: Integrate a lightweight library (like xlsx or exceljs) to parse a target Excel file.

[ ] Normalization: Write a function that strips out all formatting, colors, and macros, converting only the raw sheet data into a deterministic JSON array or CSV format.

Phase 2: State and Hashing

[ ] The Hasher: Write a function that takes the normalized JSON/CSV string and generates a SHA-256 hash. This represents the current "state" of the spreadsheet.

[ ] Implement status: Write a command that compares the hash of the current working directory's Excel file against the hash of the latest saved snapshot.

[ ] Implement commit: Write the logic to save the current normalized data into the .xl-vcs/objects folder, naming the file with its hash. Update a HEAD file to point to this new commit.

Phase 3: The Diffing Engine

[ ] The Comparator: Write a function that takes two normalized JSON/CSV files (the previous commit and the current state) and compares them row by row.

[ ] Change Detection: Flag rows as ADDED (+), DELETED (-), or MODIFIED (~).

[ ] Implement diff: Format the output of the comparator into a clean, readable terminal view. Use basic ANSI color codes (Green for additions, Red for deletions, Yellow for modifications).

Phase 4: Polish and Tangible Output

[ ] Implement log: Create a command to read the commit history and print out the hashes, timestamps, and commit messages.

[ ] Error Handling: Add basic safeguards (e.g., preventing commits if the file is currently open and locked by Excel).

[ ] Test Run: Create a dummy Excel file, make a commit, change a few cells, add a row, and run your diff command to watch the system work.
