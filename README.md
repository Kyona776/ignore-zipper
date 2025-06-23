# ignore-zipper

[![npm version](https://badge.fury.io/js/ignore-zipper.svg)](https://badge.fury.io/js/ignore-zipper)
[![GitHub](https://img.shields.io/github/license/Kyona776/ignore-zipper)](https://github.com/Kyona776/ignore-zipper/blob/main/LICENSE)

A CLI tool for creating and extracting ZIP files with support for ignore patterns from `.gitignore`, `.zipignore`, and custom ignore files.

## Features

- 🚫 **Ignore File Support**: Automatically respects `.gitignore`, `.zipignore`, and all `.*ignore` files
- 🎯 **Custom Ignore Patterns**: Support for custom ignore file patterns (e.g., `.myignore`, `.buildignore`)
- 🔄 **Cross-Platform**: Works on Windows, macOS, and Linux
- 📦 **Multiple Operations**: Create, extract, and list ZIP contents
- 🎛️ **Flexible Options**: Control which ignore files are loaded automatically
- 📊 **Verbose Mode**: Detailed output for debugging and monitoring
- 🔍 **Rule Inspection**: View active ignore rules and loaded files for any directory

## Installation

### Global Installation

```bash
npm install -g ignore-zipper
```

### Run without installing

```bash
npx ignore-zipper --help
```

### Local Project Installation

```bash
npm install ignore-zipper
```

## Usage

### Create a ZIP file

```bash
# Basic usage - respects .gitignore and .zipignore
ignore-zipper create ./my-project ./output/project.zip

# With custom ignore file
ignore-zipper create ./my-project ./output/project.zip -i .customignore

# With custom patterns
ignore-zipper create ./my-project ./output/project.zip -p "*.tmp" "build/"

# Verbose output
ignore-zipper create ./my-project ./output/project.zip -v

# Custom compression level (0-9)
ignore-zipper create ./my-project ./output/project.zip -c 9
```

### Extract a ZIP file

```bash
# Basic extraction
ignore-zipper extract ./archive.zip ./output-directory

# Overwrite existing files
ignore-zipper extract ./archive.zip ./output-directory -f

# Verbose output
ignore-zipper extract ./archive.zip ./output-directory -v
```

### List ZIP contents

```bash
ignore-zipper list ./archive.zip
```

### View ignore rules

```bash
# Show active ignore rules for a directory
ignore-zipper rules ./my-project

# Include custom ignore files and patterns
ignore-zipper rules ./my-project -i .customignore -p "*.tmp"
```

## Ignore File Support

The tool automatically looks for and applies rules from these files:

- `.gitignore`
- `.zipignore`
- `.ignore`
- Any file matching `.*ignore` pattern (e.g., `.dockerignore`, `.eslintignore`, `.npmignore`, `.buildignore`)

### Custom Ignore File Patterns

You can specify custom patterns for ignore files:

```bash
# Load files matching a specific pattern
ignore-zipper create ./project ./output.zip --ignore-pattern ".myignore"

# Load files with multiple patterns 
ignore-zipper create ./project ./output.zip --ignore-pattern ".*ignore"

# Disable automatic loading of .*ignore files
ignore-zipper create ./project ./output.zip --no-auto-ignore
```

### Supported Ignore Patterns

- `file.txt` - Ignore specific file
- `*.log` - Ignore files by extension
- `temp/` - Ignore directories
- `**/node_modules` - Ignore nested directories
- `!important.log` - Negate pattern (include file)
- `/root-only.txt` - Ignore only in root directory

## CLI Commands

### `create <source> <output>`

Create a ZIP file from a source directory.

**Options:**
- `-c, --compression <level>` - Compression level (0-9, default: 6)
- `-i, --ignore-file <files...>` - Additional ignore files
- `-p, --pattern <patterns...>` - Additional ignore patterns
- `--ignore-pattern <pattern>` - Custom pattern for ignore files (e.g., ".*ignore")
- `--no-auto-ignore` - Skip automatic loading of .*ignore files
- `-v, --verbose` - Verbose output

### `extract <input> <output>`

Extract a ZIP file to a directory.

**Options:**
- `-f, --force` - Overwrite existing files
- `-v, --verbose` - Verbose output

### `list <input>`

List contents of a ZIP file.

### `rules <directory>`

Show active ignore rules for a directory.

**Options:**
- `-i, --ignore-file <files...>` - Additional ignore files
- `-p, --pattern <patterns...>` - Additional ignore patterns
- `--ignore-pattern <pattern>` - Custom pattern for ignore files (e.g., ".*ignore")
- `--no-auto-ignore` - Skip automatic loading of .*ignore files

## Examples

### Create a ZIP excluding common development files

```bash
# Create .zipignore file
echo "node_modules/
.git/
*.log
.env
dist/
coverage/" > .zipignore

# Create ZIP (automatically loads .gitignore, .zipignore, and all .*ignore files)
ignore-zipper create ./my-app ./releases/my-app-v1.0.0.zip -v
```

### Use custom ignore file patterns

```bash
# Create custom ignore files
echo "*.tmp\ncache/" > .buildignore
echo "docs/\nexamples/" > .deployignore

# Load only specific ignore file pattern
ignore-zipper create ./project ./output.zip --ignore-pattern ".buildignore" -v

# Load all files ending with 'ignore' except standard ones
ignore-zipper create ./project ./output.zip --ignore-pattern "*ignore" -v

# Skip automatic .*ignore loading and use only .gitignore
ignore-zipper create ./project ./output.zip --no-auto-ignore -v
```

### Extract with safety checks

```bash
# Extract without overwriting existing files
ignore-zipper extract ./archive.zip ./extracted/

# Force overwrite if needed
ignore-zipper extract ./archive.zip ./extracted/ -f
```

### Debug ignore rules

```bash
# See what rules are active (shows loaded ignore files)
ignore-zipper rules ./my-project

# Test with custom ignore file patterns
ignore-zipper rules ./my-project --ignore-pattern ".buildignore"

# Test with additional patterns
ignore-zipper rules ./my-project -p "*.tmp" "cache/"

# See what rules would be active without auto-loading .*ignore files
ignore-zipper rules ./my-project --no-auto-ignore
```

## API Usage

You can also use ignore-zipper programmatically:

```typescript
import { Zipper, IgnoreParser } from 'ignore-zipper';

const zipper = new Zipper('./my-project');

// Create ZIP with custom ignore options
await zipper.createZip('./my-project', './output.zip', {
  compressionLevel: 9,
  customPatterns: ['*.tmp', 'cache/'],
  ignorePattern: '.buildignore',  // Load custom ignore file pattern
  autoIgnore: false,              // Skip automatic .*ignore files
  verbose: true
});

// Extract ZIP
await zipper.extractZip('./archive.zip', './output/', {
  overwrite: true,
  verbose: true
});

// List contents
const files = await zipper.listZipContents('./archive.zip');
console.log(files);

// Inspect ignore rules
const ignoreParser = zipper.getIgnoreParser();
const loadedFiles = ignoreParser.getLoadedFiles();
const rules = ignoreParser.getRules();
console.log('Loaded ignore files:', loadedFiles);
console.log('Active rules:', rules);
```

## Security

- **Path Traversal Protection**: Prevents extraction of files outside the target directory
- **Permission Handling**: Gracefully handles files and directories with restricted access
- **Safe Defaults**: Conservative defaults for file operations

## License

MIT