# ignore-zipper API Documentation

This document provides comprehensive API documentation for the ignore-zipper library, including all public classes, interfaces, methods, and usage examples.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Classes](#core-classes)
  - [Zipper](#zipper)
  - [IgnoreParser](#ignoreparser)
  - [FileTraversal](#filetraversal)
- [Interfaces](#interfaces)
  - [ZipOptions](#zipoptions)
  - [ExtractOptions](#extractoptions)
  - [IgnoreRule](#ignorerule)
  - [FileEntry](#fileentry)
- [CLI Commands](#cli-commands)
- [Error Handling](#error-handling)
- [Examples](#examples)

## Installation

```bash
npm install ignore-zipper
```

For global CLI usage:
```bash
npm install -g ignore-zipper
```

## Quick Start

### Programmatic Usage

```typescript
import { Zipper, IgnoreParser, FileTraversal } from 'ignore-zipper';

// Create a zipper instance
const zipper = new Zipper('./my-project');

// Create ZIP with ignore files
await zipper.createZip('./source', './output.zip', {
  compressionLevel: 9,
  verbose: true
});

// Extract ZIP
await zipper.extractZip('./archive.zip', './output', {
  overwrite: true
});
```

### CLI Usage

```bash
# Create ZIP respecting .gitignore and .zipignore
ignore-zipper create ./project ./output.zip --verbose

# Extract ZIP with overwrite
ignore-zipper extract ./archive.zip ./output --force

# List ZIP contents
ignore-zipper list ./archive.zip

# View active ignore rules
ignore-zipper rules ./project
```

## Core Classes

### Zipper

The main class for creating, extracting, and listing ZIP files with ignore pattern support.

#### Constructor

```typescript
constructor(basePath: string)
```

**Parameters:**
- `basePath` (string): The base directory path for ignore file resolution

**Example:**
```typescript
const zipper = new Zipper('./my-project');
```

#### Methods

##### createZip()

Creates a ZIP file from a source directory, applying ignore rules.

```typescript
async createZip(
  sourcePath: string, 
  outputPath: string, 
  options?: ZipOptions
): Promise<void>
```

**Parameters:**
- `sourcePath` (string): Path to the source directory to zip
- `outputPath` (string): Path where the ZIP file will be created
- `options` (ZipOptions, optional): Configuration options

**Example:**
```typescript
await zipper.createZip('./src', './build/project.zip', {
  compressionLevel: 9,
  ignoreFiles: ['.customignore'],
  customPatterns: ['*.tmp', 'cache/'],
  verbose: true
});
```

**Throws:**
- Error if source path doesn't exist or isn't a directory
- Error if unable to create output directory or write ZIP file

##### extractZip()

Extracts a ZIP file to a target directory.

```typescript
async extractZip(
  zipPath: string, 
  outputPath: string, 
  options?: ExtractOptions
): Promise<void>
```

**Parameters:**
- `zipPath` (string): Path to the ZIP file to extract
- `outputPath` (string): Directory where files will be extracted
- `options` (ExtractOptions, optional): Extraction options

**Example:**
```typescript
await zipper.extractZip('./archive.zip', './extracted', {
  overwrite: true,
  verbose: true
});
```

**Security Features:**
- Path traversal protection (prevents extraction outside target directory)
- Safe file overwrite handling

**Throws:**
- Error if ZIP file doesn't exist
- Error if unable to create output directory
- Error if file extraction fails

##### listZipContents()

Lists all entries in a ZIP file.

```typescript
async listZipContents(zipPath: string): Promise<string[]>
```

**Parameters:**
- `zipPath` (string): Path to the ZIP file

**Returns:**
- Promise<string[]>: Array of file and directory paths in the ZIP

**Example:**
```typescript
const entries = await zipper.listZipContents('./archive.zip');
console.log('Files in archive:', entries);
```

##### getIgnoreParser()

Returns the internal IgnoreParser instance for advanced usage.

```typescript
getIgnoreParser(): IgnoreParser
```

**Returns:**
- IgnoreParser: The parser instance used by this Zipper

**Example:**
```typescript
const parser = zipper.getIgnoreParser();
const rules = parser.getRules();
const loadedFiles = parser.getLoadedFiles();
```

### IgnoreParser

Handles parsing and matching of ignore patterns from various ignore files.

#### Constructor

```typescript
constructor(basePath: string)
```

**Parameters:**
- `basePath` (string): Base directory for resolving relative paths and locating ignore files

#### Methods

##### loadIgnoreFile()

Loads ignore patterns from a specific file.

```typescript
loadIgnoreFile(ignoreFilePath: string): void
```

**Parameters:**
- `ignoreFilePath` (string): Path to the ignore file to load

**Example:**
```typescript
const parser = new IgnoreParser('./project');
parser.loadIgnoreFile('./.gitignore');
parser.loadIgnoreFile('./custom.ignore');
```

##### loadDefaultIgnoreFiles()

Automatically loads standard ignore files (.gitignore, .zipignore, .ignore) and all .*ignore files.

```typescript
loadDefaultIgnoreFiles(): void
```

**Example:**
```typescript
parser.loadDefaultIgnoreFiles();
// Loads: .gitignore, .zipignore, .ignore, .dockerignore, .npmignore, etc.
```

##### loadIgnoreFilesByPattern()

Loads ignore files matching a specific pattern.

```typescript
loadIgnoreFilesByPattern(pattern: string): void
```

**Parameters:**
- `pattern` (string): Glob pattern to match ignore files

**Example:**
```typescript
// Load only build-related ignore files
parser.loadIgnoreFilesByPattern('.buildignore');

// Load all custom ignore files
parser.loadIgnoreFilesByPattern('*.ignore');
```

##### addPattern()

Adds a custom ignore pattern programmatically.

```typescript
addPattern(pattern: string): void
```

**Parameters:**
- `pattern` (string): Ignore pattern to add

**Example:**
```typescript
parser.addPattern('*.tmp');
parser.addPattern('node_modules/');
parser.addPattern('!important.txt'); // Negate pattern
```

##### shouldIgnore()

Tests whether a file or directory should be ignored.

```typescript
shouldIgnore(filePath: string, isDirectory?: boolean): boolean
```

**Parameters:**
- `filePath` (string): Full path to test
- `isDirectory` (boolean, optional): Whether the path is a directory

**Returns:**
- boolean: true if the file should be ignored

**Example:**
```typescript
const shouldIgnore = parser.shouldIgnore('/project/node_modules');
if (shouldIgnore) {
  console.log('File will be ignored');
}
```

##### getRules()

Returns all loaded ignore rules.

```typescript
getRules(): IgnoreRule[]
```

**Returns:**
- IgnoreRule[]: Array of all ignore rules

##### getLoadedFiles()

Returns the names of all loaded ignore files.

```typescript
getLoadedFiles(): string[]
```

**Returns:**
- string[]: Array of loaded ignore file names

##### clear()

Clears all loaded rules and file history.

```typescript
clear(): void
```

### FileTraversal

Handles directory traversal with ignore pattern filtering.

#### Constructor

```typescript
constructor(basePath: string, ignoreParser?: IgnoreParser)
```

**Parameters:**
- `basePath` (string): Base directory for traversal
- `ignoreParser` (IgnoreParser, optional): Parser for ignore rules

#### Methods

##### walkDirectory()

Asynchronously walks a directory tree, yielding FileEntry objects.

```typescript
async* walkDirectory(directoryPath: string): AsyncGenerator<FileEntry>
```

**Parameters:**
- `directoryPath` (string): Directory to walk

**Returns:**
- AsyncGenerator<FileEntry>: Generator yielding file entries

**Example:**
```typescript
const traversal = new FileTraversal('./project');

for await (const entry of traversal.walkDirectory('./src')) {
  console.log(`${entry.isDirectory ? 'DIR' : 'FILE'}: ${entry.relativePath}`);
}
```

##### getFileList()

Gets all files and directories as an array.

```typescript
async getFileList(directoryPath: string): Promise<FileEntry[]>
```

**Returns:**
- Promise<FileEntry[]>: Array of all entries (files and directories)

##### getFilesOnly()

Gets only files (excludes directories) as an array.

```typescript
async getFilesOnly(directoryPath: string): Promise<FileEntry[]>
```

**Returns:**
- Promise<FileEntry[]>: Array of file entries only

**Example:**
```typescript
const files = await traversal.getFilesOnly('./src');
console.log(`Found ${files.length} files`);
```

##### setIgnoreParser()

Sets a new ignore parser instance.

```typescript
setIgnoreParser(ignoreParser: IgnoreParser): void
```

##### getIgnoreParser()

Gets the current ignore parser instance.

```typescript
getIgnoreParser(): IgnoreParser
```

## Interfaces

### ZipOptions

Configuration options for ZIP file creation.

```typescript
interface ZipOptions {
  compressionLevel?: number;      // 0-9, default: 6
  ignoreFiles?: string[];         // Additional ignore files to load
  customPatterns?: string[];      // Custom ignore patterns
  ignorePattern?: string;         // Pattern for loading ignore files
  autoIgnore?: boolean;          // Load .*ignore files automatically (default: true)
  verbose?: boolean;             // Enable verbose output (default: false)
}
```

**Example:**
```typescript
const options: ZipOptions = {
  compressionLevel: 9,
  ignoreFiles: ['.buildignore', '.deployignore'],
  customPatterns: ['*.tmp', 'cache/', '!important.cache'],
  ignorePattern: '*.ignore',
  autoIgnore: false,
  verbose: true
};
```

### ExtractOptions

Configuration options for ZIP file extraction.

```typescript
interface ExtractOptions {
  overwrite?: boolean;  // Overwrite existing files (default: false)
  verbose?: boolean;    // Enable verbose output (default: false)
}
```

### IgnoreRule

Represents a single ignore rule parsed from ignore files.

```typescript
interface IgnoreRule {
  pattern: string;     // The ignore pattern
  negate: boolean;     // Whether this is a negation rule (starts with !)
  directory: boolean;  // Whether this rule applies only to directories
}
```

**Example:**
```typescript
const rules: IgnoreRule[] = [
  { pattern: 'node_modules', negate: false, directory: true },
  { pattern: '*.log', negate: false, directory: false },
  { pattern: 'important.log', negate: true, directory: false }
];
```

### FileEntry

Represents a file or directory entry during traversal.

```typescript
interface FileEntry {
  fullPath: string;      // Absolute path to the file/directory
  relativePath: string;  // Path relative to the base directory
  isDirectory: boolean;  // Whether this entry is a directory
  stats: fs.Stats;       // Node.js file statistics
}
```

## CLI Commands

### create

Creates a ZIP file with ignore pattern support.

```bash
ignore-zipper create <source> <output> [options]
```

**Arguments:**
- `source`: Source directory to zip
- `output`: Output ZIP file path

**Options:**
- `-c, --compression <level>`: Compression level 0-9 (default: 6)
- `-i, --ignore-file <files...>`: Additional ignore files
- `-p, --pattern <patterns...>`: Additional ignore patterns
- `--ignore-pattern <pattern>`: Custom pattern for ignore files
- `--no-auto-ignore`: Skip automatic .*ignore file loading
- `-v, --verbose`: Verbose output

**Examples:**
```bash
# Basic usage
ignore-zipper create ./project ./output.zip

# High compression with custom ignore files
ignore-zipper create ./src ./dist.zip -c 9 -i .buildignore -v

# Custom ignore pattern
ignore-zipper create ./app ./app.zip --ignore-pattern ".deploy*"

# Skip auto-loading with custom patterns
ignore-zipper create ./src ./src.zip --no-auto-ignore -p "*.tmp" "cache/"
```

### extract

Extracts a ZIP file to a directory.

```bash
ignore-zipper extract <input> <output> [options]
```

**Arguments:**
- `input`: Input ZIP file path
- `output`: Output directory path

**Options:**
- `-f, --force`: Overwrite existing files
- `-v, --verbose`: Verbose output

**Examples:**
```bash
# Basic extraction
ignore-zipper extract ./archive.zip ./extracted

# Force overwrite with verbose output
ignore-zipper extract ./app.zip ./deploy -f -v
```

### list

Lists the contents of a ZIP file.

```bash
ignore-zipper list <input>
```

**Arguments:**
- `input`: Input ZIP file path

**Example:**
```bash
ignore-zipper list ./archive.zip
```

### rules

Shows active ignore rules for a directory.

```bash
ignore-zipper rules <directory> [options]
```

**Arguments:**
- `directory`: Directory to analyze

**Options:**
- `-i, --ignore-file <files...>`: Additional ignore files
- `-p, --pattern <patterns...>`: Additional ignore patterns
- `--ignore-pattern <pattern>`: Custom pattern for ignore files
- `--no-auto-ignore`: Skip automatic .*ignore file loading

**Examples:**
```bash
# Show default rules
ignore-zipper rules ./project

# Show rules with custom ignore files
ignore-zipper rules ./src -i .buildignore -p "*.tmp"

# Custom ignore pattern
ignore-zipper rules ./app --ignore-pattern ".deploy*"
```

## Error Handling

The library provides comprehensive error handling:

### Common Errors

1. **File Not Found**: When source directories or ZIP files don't exist
2. **Permission Errors**: When files can't be read due to permissions
3. **Path Traversal**: When ZIP entries try to extract outside target directory
4. **Invalid Compression**: When compression level is outside 0-9 range

### Error Examples

```typescript
try {
  await zipper.createZip('./nonexistent', './output.zip');
} catch (error) {
  if (error.code === 'ENOENT') {
    console.log('Source directory not found');
  }
}

try {
  await zipper.extractZip('./malicious.zip', './safe-dir');
} catch (error) {
  // Path traversal attempts are automatically blocked
  console.log('Extraction failed:', error.message);
}
```

## Examples

### Basic ZIP Creation with Custom Ignore Rules

```typescript
import { Zipper } from 'ignore-zipper';

async function createProjectZip() {
  const zipper = new Zipper('./my-project');
  
  await zipper.createZip('./my-project', './releases/v1.0.0.zip', {
    compressionLevel: 9,
    ignoreFiles: ['.deployignore'],
    customPatterns: [
      '*.tmp',
      'cache/',
      'logs/',
      '!important.log'  // Include this specific log file
    ],
    verbose: true
  });
  
  console.log('Project ZIP created successfully!');
}
```

### Advanced Ignore Pattern Handling

```typescript
import { IgnoreParser } from 'ignore-zipper';

function analyzeIgnoreRules() {
  const parser = new IgnoreParser('./project');
  
  // Load different types of ignore files
  parser.loadDefaultIgnoreFiles();
  parser.loadIgnoreFilesByPattern('.build*');
  parser.addPattern('temp-*');
  
  // Check what files would be ignored
  const testFiles = [
    '/project/src/main.ts',
    '/project/node_modules/package',
    '/project/build/output.js',
    '/project/temp-cache'
  ];
  
  testFiles.forEach(file => {
    const ignored = parser.shouldIgnore(file);
    console.log(`${file}: ${ignored ? 'IGNORED' : 'INCLUDED'}`);
  });
  
  // Inspect loaded rules
  console.log('Loaded files:', parser.getLoadedFiles());
  console.log('Active rules:', parser.getRules());
}
```

### File Traversal with Custom Filtering

```typescript
import { FileTraversal, IgnoreParser } from 'ignore-zipper';

async function customFileTraversal() {
  const parser = new IgnoreParser('./project');
  parser.loadDefaultIgnoreFiles();
  parser.addPattern('*.test.js'); // Ignore test files
  
  const traversal = new FileTraversal('./project', parser);
  
  // Get only TypeScript files
  const tsFiles = [];
  for await (const entry of traversal.walkDirectory('./src')) {
    if (!entry.isDirectory && entry.relativePath.endsWith('.ts')) {
      tsFiles.push(entry);
    }
  }
  
  console.log(`Found ${tsFiles.length} TypeScript files`);
  tsFiles.forEach(file => {
    console.log(`- ${file.relativePath} (${file.stats.size} bytes)`);
  });
}
```

### Batch ZIP Operations

```typescript
import { Zipper } from 'ignore-zipper';
import * as path from 'path';

async function batchZipDirectories() {
  const directories = ['./src', './docs', './examples'];
  
  for (const dir of directories) {
    const zipper = new Zipper(dir);
    const outputName = `${path.basename(dir)}-backup.zip`;
    
    try {
      await zipper.createZip(dir, `./backups/${outputName}`, {
        compressionLevel: 6,
        verbose: true
      });
      
      console.log(`✓ Created backup: ${outputName}`);
    } catch (error) {
      console.error(`✗ Failed to backup ${dir}:`, error.message);
    }
  }
}
```

### Custom Ignore File Patterns

```typescript
import { Zipper } from 'ignore-zipper';

async function useCustomIgnorePatterns() {
  const zipper = new Zipper('./project');
  
  // Create ZIP using only build-related ignore files
  await zipper.createZip('./project', './build.zip', {
    autoIgnore: false,  // Don't auto-load .*ignore files
    ignorePattern: '.build*',  // Load .buildignore, .build-dev, etc.
    customPatterns: [
      'src/**/*.test.ts',  // Ignore test files
      'docs/',             // Ignore documentation
      '!docs/api.md'       // But include API documentation
    ],
    verbose: true
  });
}
```

This comprehensive API documentation covers all public interfaces, classes, methods, and usage patterns available in the ignore-zipper library. Each section includes detailed explanations, parameter descriptions, return values, and practical examples to help developers effectively use the library in their projects.