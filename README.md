
<a href=https://asciinema.org/a/txcB6grATYEKret4f5OJz7ASH title="asciinema recording of sourcecrop"><img alt="sourcecrop in action" width="877" alt="Screenshot 2025-02-19 at 7 01 56 PM" src="https://github.com/user-attachments/assets/dfa03477-61ba-4c88-a77e-286bc5cc6517" /></a>

# Sourcecrop (aka Spirit Catcher)

sourcecrop is a command-line utility that displays code snippets (like functions, classes, or methods) from source files. It supports quick lookups, partial code extraction, and basic call analysis, making it easy to see what calls what in your JavaScript code. Other languages are on our roadmap.

## Installation

Via **NPM**:
```bash
$ npm i -g sourcecrop@latest
```

Or using git:
```bash
# Clone the repository
$ git clone https://github.com/your-user/sourcecrop.git

# Navigate into the project directory
$ cd sourcecrop

# Run install script (might need sudo depending on your environment)
$ ./install.sh
```

This should set up a symbolic link for `sc` so you can use it anywhere.

## Usage

```bash
$ sc <file> [name|calls-<name>|by-<name>|-listCallees|-listCallers]
```

- **sc <file>**: Lists all declared functions and methods in `<file>`, suitable for autocompletion.
- **sc <file> someFunction**: Shows the code for `someFunction`.
- **sc <file> calls-someFunction**: Lists all functions that call `someFunction`.
- **sc <file> by-someFunction**: Lists all functions called _by_ `someFunction`.
- **sc <file> -listCallees**: Lists all functions called in `<file>`.
- **sc <file> -listCallers**: Lists all functions that call something else in `<file>`.

Examples:

1. **List all declared functions**:
   ```bash
   $ sc app.js
   myFunc
   anotherFunc
   untitled-161
   ```

2. **Show code of a named function**:
   ```bash
   $ sc app.js myFunc
   // Displays the source code for the function named myFunc
   ```

3. **Find callers of a function**:
   ```bash
   $ sc app.js calls-myFunc
   // Lists all functions that call myFunc
   ```

4. **Find callees used by a specific function**:
   ```bash
   $ sc app.js by-myFunc
   // Lists all functions that myFunc calls
   ```

5. **List all function calls**:
   ```bash
   $ sc app.js -listCallees
   // Displays all distinct function calls found in the file
   ```

## Shell Autocomplete

For easier usage, `sc` supports basic autocomplete when used in a bash-compatible shell. After installing, type:
```bash
$ sc app.js <TAB>
```
This should autocomplete declared function names or any recognized command like `calls-` and `by-`.

## Roadmap

We currently focus on JavaScript (ES modules). Support for additional languages is planned.

## License

sourcecrop is licensed under the [GNU Affero General Public License version 3](https://www.gnu.org/licenses/agpl-3.0.html), consistent with the copyright statement in the source.

```text
  © 2024 Cris (@o0101) and Dosyago Corp.

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.
```

