# ignore-zipper Quick Reference

A concise reference for the most commonly used features of the ignore-zipper library.

## Installation

```bash
npm install ignore-zipper           # Local
npm install -g ignore-zipper        # Global CLI
npx ignore-zipper --help           # Run without installing
```

## Basic Usage

### Programmatic API

```typescript
import { Zipper } from 'ignore-zipper';

const zipper = new Zipper('./project');

// Create ZIP (respects .gitignore, .zipignore automatically)
await zipper.createZip('./src', './build.zip');

// Extract ZIP
await zipper.extractZip('./archive.zip', './output');

// List contents
const files = await zipper.listZipContents('./archive.zip');
```

### CLI Commands

```bash
# Create ZIP
ignore-zipper create ./project ./project.zip

# Extract ZIP
ignore-zipper extract ./archive.zip ./output

# List contents
ignore-zipper list ./archive.zip

# Show ignore rules
ignore-zipper rules ./project
```

## Common Options

### ZIP Creation Options

```typescript
await zipper.createZip('./src', './build.zip', {
  compressionLevel: 9,              // 0-9 (default: 6)
  ignoreFiles: ['.buildignore'],    // Additional ignore files
  customPatterns: ['*.tmp'],        // Custom patterns
  verbose: true                     // Show detailed output
});
```

### CLI Equivalents

```bash
ignore-zipper create ./src ./build.zip \
  --compression 9 \
  --ignore-file .buildignore \
  --pattern "*.tmp" \
  --verbose
```

## Ignore File Patterns

| Pattern | Description | Example |
|---------|-------------|---------|
| `file.txt` | Specific file | `config.json` |
| `*.ext` | File extension | `*.log`, `*.tmp` |
| `dir/` | Directory | `node_modules/` |
| `**/pattern` | Nested match | `**/test/` |
| `!pattern` | Negate (include) | `!important.log` |
| `/root-only` | Root directory only | `/package.json` |

## Advanced Usage

### Custom Ignore Loading

```typescript
// Don't auto-load .*ignore files, use only specific ones
await zipper.createZip('./src', './build.zip', {
  autoIgnore: false,
  ignoreFiles: ['.gitignore', '.buildignore']
});
```

```bash
ignore-zipper create ./src ./build.zip \
  --no-auto-ignore \
  --ignore-file .gitignore .buildignore
```

### Ignore Pattern Matching

```typescript
// Load files matching pattern
await zipper.createZip('./src', './build.zip', {
  ignorePattern: '.deploy*'  // Loads .deployignore, .deploy-prod, etc.
});
```

```bash
ignore-zipper create ./src ./build.zip --ignore-pattern ".deploy*"
```

### Working with IgnoreParser

```typescript
import { IgnoreParser } from 'ignore-zipper';

const parser = new IgnoreParser('./project');
parser.loadDefaultIgnoreFiles();
parser.addPattern('*.cache');

// Test if file should be ignored
const shouldIgnore = parser.shouldIgnore('/project/temp.cache');

// Get all rules and loaded files
const rules = parser.getRules();
const files = parser.getLoadedFiles();
```

### File Traversal

```typescript
import { FileTraversal } from 'ignore-zipper';

const traversal = new FileTraversal('./project');

// Walk directory with generator
for await (const entry of traversal.walkDirectory('./src')) {
  console.log(entry.relativePath, entry.isDirectory);
}

// Get all files at once
const files = await traversal.getFilesOnly('./src');
```

## Common Patterns

### Project Backup

```typescript
const zipper = new Zipper('./my-app');
await zipper.createZip('./my-app', `./backups/backup-${Date.now()}.zip`, {
  compressionLevel: 9,
  customPatterns: ['*.log', 'tmp/'],
  verbose: true
});
```

### Build Artifact Creation

```typescript
await zipper.createZip('./dist', './releases/v1.0.0.zip', {
  autoIgnore: false,  // Don't use .gitignore
  ignoreFiles: ['.deployignore'],
  customPatterns: ['*.map', '*.test.*']
});
```

### Safe Extraction

```typescript
await zipper.extractZip('./download.zip', './safe-dir', {
  overwrite: false,  // Don't overwrite existing files
  verbose: true
});
```

## Error Handling

```typescript
try {
  await zipper.createZip('./src', './build.zip');
} catch (error) {
  if (error.code === 'ENOENT') {
    console.log('Source directory not found');
  } else if (error.code === 'EACCES') {
    console.log('Permission denied');
  } else {
    console.log('Unexpected error:', error.message);
  }
}
```

## Environment Variables

```bash
export NODE_ENV=production
ignore-zipper create ./app ./app.zip --verbose
```

## Common CLI Examples

```bash
# High compression backup
ignore-zipper create ./project ./backup.zip -c 9 -v

# Deployment package (custom ignore)
ignore-zipper create ./app ./deploy.zip -i .deployignore --no-auto-ignore

# Extract with overwrite protection
ignore-zipper extract ./risky.zip ./safe-dir

# Debug ignore rules
ignore-zipper rules ./project -v
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Files not ignored | Check ignore file syntax and paths |
| Permission errors | Run with appropriate permissions |
| Large file size | Increase compression level (-c 9) |
| Missing files | Use `--verbose` to see what's included |
| Path errors | Use absolute paths or check working directory |

## TypeScript Support

The library includes full TypeScript definitions:

```typescript
import { Zipper, ZipOptions, IgnoreRule } from 'ignore-zipper';

const options: ZipOptions = {
  compressionLevel: 9,
  verbose: true
};

const zipper = new Zipper('./project');
await zipper.createZip('./src', './output.zip', options);
```

For complete API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).