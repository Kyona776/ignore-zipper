// Type definitions for ignore-zipper
// Project: https://github.com/Kyona776/ignore-zipper
// Definitions by: Kyona776

import { Stats } from 'node:fs';

/**
 * Configuration options for ZIP file creation
 */
export interface ZipOptions {
  /**
   * Compression level (0-9)
   * @default 6
   */
  compressionLevel?: number;
  
  /**
   * Additional ignore files to load
   */
  ignoreFiles?: string[];
  
  /**
   * Custom ignore patterns to apply
   */
  customPatterns?: string[];
  
  /**
   * Custom pattern for loading ignore files (e.g., ".*ignore" or ".myignore")
   */
  ignorePattern?: string;
  
  /**
   * Load .*ignore files automatically
   * @default true
   */
  autoIgnore?: boolean;
  
  /**
   * Enable verbose output
   * @default false
   */
  verbose?: boolean;
}

/**
 * Configuration options for ZIP file extraction
 */
export interface ExtractOptions {
  /**
   * Overwrite existing files
   * @default false
   */
  overwrite?: boolean;
  
  /**
   * Enable verbose output
   * @default false
   */
  verbose?: boolean;
}

/**
 * Represents a single ignore rule parsed from ignore files
 */
export interface IgnoreRule {
  /** The ignore pattern */
  pattern: string;
  
  /** Whether this is a negation rule (starts with !) */
  negate: boolean;
  
  /** Whether this rule applies only to directories */
  directory: boolean;
}

/**
 * Represents a file or directory entry during traversal
 */
export interface FileEntry {
  /** Absolute path to the file/directory */
  fullPath: string;
  
  /** Path relative to the base directory */
  relativePath: string;
  
  /** Whether this entry is a directory */
  isDirectory: boolean;
  
  /** Node.js file statistics */
  stats: Stats;
}

/**
 * Handles parsing and matching of ignore patterns from various ignore files
 */
export class IgnoreParser {
  /**
   * Creates a new IgnoreParser instance
   * @param basePath Base directory for resolving relative paths and locating ignore files
   */
  constructor(basePath: string);
  
  /**
   * Loads ignore patterns from a specific file
   * @param ignoreFilePath Path to the ignore file to load
   */
  loadIgnoreFile(ignoreFilePath: string): void;
  
  /**
   * Automatically loads standard ignore files (.gitignore, .zipignore, .ignore) and all .*ignore files
   */
  loadDefaultIgnoreFiles(): void;
  
  /**
   * Loads ignore files matching a specific pattern
   * @param pattern Glob pattern to match ignore files
   */
  loadIgnoreFilesByPattern(pattern: string): void;
  
  /**
   * Adds a custom ignore pattern programmatically
   * @param pattern Ignore pattern to add
   */
  addPattern(pattern: string): void;
  
  /**
   * Tests whether a file or directory should be ignored
   * @param filePath Full path to test
   * @param isDirectory Whether the path is a directory
   * @returns true if the file should be ignored
   */
  shouldIgnore(filePath: string, isDirectory?: boolean): boolean;
  
  /**
   * Returns all loaded ignore rules
   * @returns Array of all ignore rules
   */
  getRules(): IgnoreRule[];
  
  /**
   * Returns the names of all loaded ignore files
   * @returns Array of loaded ignore file names
   */
  getLoadedFiles(): string[];
  
  /**
   * Clears all loaded rules and file history
   */
  clear(): void;
}

/**
 * Handles directory traversal with ignore pattern filtering
 */
export class FileTraversal {
  /**
   * Creates a new FileTraversal instance
   * @param basePath Base directory for traversal
   * @param ignoreParser Parser for ignore rules
   */
  constructor(basePath: string, ignoreParser?: IgnoreParser);
  
  /**
   * Asynchronously walks a directory tree, yielding FileEntry objects
   * @param directoryPath Directory to walk
   * @returns Generator yielding file entries
   */
  walkDirectory(directoryPath: string): AsyncGenerator<FileEntry>;
  
  /**
   * Gets all files and directories as an array
   * @param directoryPath Directory to traverse
   * @returns Array of all entries (files and directories)
   */
  getFileList(directoryPath: string): Promise<FileEntry[]>;
  
  /**
   * Gets only files (excludes directories) as an array
   * @param directoryPath Directory to traverse
   * @returns Array of file entries only
   */
  getFilesOnly(directoryPath: string): Promise<FileEntry[]>;
  
  /**
   * Sets a new ignore parser instance
   * @param ignoreParser New ignore parser instance
   */
  setIgnoreParser(ignoreParser: IgnoreParser): void;
  
  /**
   * Gets the current ignore parser instance
   * @returns Current ignore parser instance
   */
  getIgnoreParser(): IgnoreParser;
}

/**
 * Main class for creating, extracting, and listing ZIP files with ignore pattern support
 */
export class Zipper {
  /**
   * Creates a new Zipper instance
   * @param basePath The base directory path for ignore file resolution
   */
  constructor(basePath: string);
  
  /**
   * Creates a ZIP file from a source directory, applying ignore rules
   * @param sourcePath Path to the source directory to zip
   * @param outputPath Path where the ZIP file will be created
   * @param options Configuration options
   * @throws Error if source path doesn't exist or isn't a directory
   * @throws Error if unable to create output directory or write ZIP file
   */
  createZip(sourcePath: string, outputPath: string, options?: ZipOptions): Promise<void>;
  
  /**
   * Extracts a ZIP file to a target directory
   * @param zipPath Path to the ZIP file to extract
   * @param outputPath Directory where files will be extracted
   * @param options Extraction options
   * @throws Error if ZIP file doesn't exist
   * @throws Error if unable to create output directory
   * @throws Error if file extraction fails
   */
  extractZip(zipPath: string, outputPath: string, options?: ExtractOptions): Promise<void>;
  
  /**
   * Lists all entries in a ZIP file
   * @param zipPath Path to the ZIP file
   * @returns Array of file and directory paths in the ZIP
   * @throws Error if ZIP file doesn't exist
   */
  listZipContents(zipPath: string): Promise<string[]>;
  
  /**
   * Returns the internal IgnoreParser instance for advanced usage
   * @returns The parser instance used by this Zipper
   */
  getIgnoreParser(): IgnoreParser;
}