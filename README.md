# ignore-zipper

A CLI tool for creating and extracting ZIP files with support for ignore patterns from `.gitignore`, `.zipignore`, and custom ignore files.

## Features

- 🚫 **Ignore File Support**: Automatically respects `.gitignore`, `.zipignore`, and custom ignore files
- 🔄 **Cross-Platform**: Works on Windows, macOS, and Linux
- 📦 **Multiple Operations**: Create, extract, and list ZIP contents
- 🎯 **Custom Patterns**: Add custom ignore patterns via CLI
- 📊 **Verbose Mode**: Detailed output for debugging and monitoring
- 🔍 **Rule Inspection**: View active ignore rules for any directory

## Installation

```bash
npm install -g ignore-zipper
```

Or run directly with npx:

```bash
npx ignore-zipper --help
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

# Create ZIP
ignore-zipper create ./my-app ./releases/my-app-v1.0.0.zip -v
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
# See what rules are active
ignore-zipper rules ./my-project

# Test with additional patterns
ignore-zipper rules ./my-project -p "*.tmp" "cache/"
```

## API Usage

You can also use ignore-zipper programmatically:

```typescript
import { Zipper, IgnoreParser } from 'ignore-zipper';

const zipper = new Zipper('./my-project');

// Create ZIP with options
await zipper.createZip('./my-project', './output.zip', {
  compressionLevel: 9,
  customPatterns: ['*.tmp', 'cache/'],
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
```

## Security

- **Path Traversal Protection**: Prevents extraction of files outside the target directory
- **Permission Handling**: Gracefully handles files and directories with restricted access
- **Safe Defaults**: Conservative defaults for file operations

## License

MIT