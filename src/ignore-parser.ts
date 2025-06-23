import * as fs from 'fs';
import * as path from 'path';
import { minimatch } from 'minimatch';

export interface IgnoreRule {
  pattern: string;
  negate: boolean;
  directory: boolean;
}

export class IgnoreParser {
  private rules: IgnoreRule[] = [];
  private basePath: string;
  private loadedFiles: string[] = [];

  constructor(basePath: string) {
    this.basePath = path.resolve(basePath);
  }

  loadIgnoreFile(ignoreFilePath: string): void {
    if (!fs.existsSync(ignoreFilePath)) {
      return;
    }

    const content = fs.readFileSync(ignoreFilePath, 'utf8');
    const lines = content.split('\n');

    // Track which files we've loaded
    const fileName = path.basename(ignoreFilePath);
    if (!this.loadedFiles.includes(fileName)) {
      this.loadedFiles.push(fileName);
    }

    for (const line of lines) {
      const rule = this.parseIgnoreLine(line);
      if (rule) {
        this.rules.push(rule);
      }
    }
  }

  loadDefaultIgnoreFiles(): void {
    const ignoreFiles = ['.gitignore', '.zipignore', '.ignore'];
    
    // Load standard ignore files
    for (const ignoreFile of ignoreFiles) {
      const fullPath = path.join(this.basePath, ignoreFile);
      this.loadIgnoreFile(fullPath);
    }

    // Load all .*ignore files in the directory
    this.loadStarIgnoreFiles();
  }

  loadStarIgnoreFiles(): void {
    try {
      const files = fs.readdirSync(this.basePath);
      
      for (const file of files) {
        // Match any file that ends with 'ignore' and starts with a dot
        if (file.match(/^\..*ignore$/)) {
          // Skip files we already loaded in loadDefaultIgnoreFiles
          if (!['.gitignore', '.zipignore', '.ignore'].includes(file)) {
            const fullPath = path.join(this.basePath, file);
            this.loadIgnoreFile(fullPath);
          }
        }
      }
    } catch (error) {
      // Silently fail if we can't read the directory
      // This might happen due to permissions or if basePath doesn't exist
    }
  }

  addPattern(pattern: string): void {
    const rule = this.parseIgnoreLine(pattern);
    if (rule) {
      this.rules.push(rule);
    }
  }

  private parseIgnoreLine(line: string): IgnoreRule | null {
    const trimmed = line.trim();
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
      return null;
    }

    let pattern = trimmed;
    let negate = false;
    let directory = false;

    // Handle negation
    if (pattern.startsWith('!')) {
      negate = true;
      pattern = pattern.slice(1);
    }

    // Handle directory-only patterns
    if (pattern.endsWith('/')) {
      directory = true;
      pattern = pattern.slice(0, -1);
    }

    // Handle leading slash (relative to root)
    if (pattern.startsWith('/')) {
      pattern = pattern.slice(1);
    }

    return {
      pattern,
      negate,
      directory
    };
  }

  shouldIgnore(filePath: string, isDirectory: boolean = false): boolean {
    const relativePath = path.relative(this.basePath, filePath);
    
    // Normalize path separators for cross-platform compatibility
    const normalizedPath = relativePath.replace(/\\/g, '/');
    
    let ignored = false;

    for (const rule of this.rules) {
      // Skip directory-only rules for files
      if (rule.directory && !isDirectory) {
        continue;
      }

      const matches = this.matchesPattern(normalizedPath, rule.pattern);
      
      if (matches) {
        ignored = !rule.negate;
      }
    }

    return ignored;
  }

  private matchesPattern(filePath: string, pattern: string): boolean {
    // Handle exact matches
    if (filePath === pattern) {
      return true;
    }

    // Handle glob patterns
    if (minimatch(filePath, pattern, { 
      dot: true,
      matchBase: true 
    })) {
      return true;
    }

    // Handle patterns that should match directories and their contents
    const pathSegments = filePath.split('/');
    for (let i = 0; i < pathSegments.length; i++) {
      const partialPath = pathSegments.slice(i).join('/');
      if (minimatch(partialPath, pattern, { 
        dot: true,
        matchBase: true 
      })) {
        return true;
      }
    }

    return false;
  }

  getRules(): IgnoreRule[] {
    return [...this.rules];
  }

  clear(): void {
    this.rules = [];
    this.loadedFiles = [];
  }

  getLoadedFiles(): string[] {
    return [...this.loadedFiles];
  }

  loadIgnoreFilesByPattern(pattern: string): void {
    try {
      const files = fs.readdirSync(this.basePath);
      
      for (const file of files) {
        // Use minimatch for pattern matching
        if (minimatch(file, pattern, { dot: true })) {
          const fullPath = path.join(this.basePath, file);
          this.loadIgnoreFile(fullPath);
        }
      }
    } catch (error) {
      // Silently fail if we can't read the directory
    }
  }
}