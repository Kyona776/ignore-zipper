import * as fs from 'fs';
import * as path from 'path';
import { IgnoreParser } from './ignore-parser';

export interface FileEntry {
  fullPath: string;
  relativePath: string;
  isDirectory: boolean;
  stats: fs.Stats;
}

export class FileTraversal {
  private ignoreParser: IgnoreParser;

  constructor(basePath: string, ignoreParser?: IgnoreParser) {
    this.ignoreParser = ignoreParser || new IgnoreParser(basePath);
  }

  async* walkDirectory(directoryPath: string): AsyncGenerator<FileEntry> {
    const basePath = this.ignoreParser['basePath'];
    
    try {
      const entries = await fs.promises.readdir(directoryPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(directoryPath, entry.name);
        const relativePath = path.relative(basePath, fullPath);
        
        // Skip if ignored
        if (this.ignoreParser.shouldIgnore(fullPath, entry.isDirectory())) {
          continue;
        }

        const stats = await fs.promises.stat(fullPath);
        
        const fileEntry: FileEntry = {
          fullPath,
          relativePath: relativePath.replace(/\\/g, '/'), // Normalize path separators
          isDirectory: entry.isDirectory(),
          stats
        };

        yield fileEntry;

        // Recursively traverse directories
        if (entry.isDirectory()) {
          yield* this.walkDirectory(fullPath);
        }
      }
    } catch (error) {
      // Skip directories we can't read (permission issues, etc.)
      if ((error as NodeJS.ErrnoException).code !== 'EACCES') {
        throw error;
      }
    }
  }

  async getFileList(directoryPath: string): Promise<FileEntry[]> {
    const files: FileEntry[] = [];
    
    for await (const file of this.walkDirectory(directoryPath)) {
      files.push(file);
    }
    
    return files;
  }

  async getFilesOnly(directoryPath: string): Promise<FileEntry[]> {
    const files: FileEntry[] = [];
    
    for await (const file of this.walkDirectory(directoryPath)) {
      if (!file.isDirectory) {
        files.push(file);
      }
    }
    
    return files;
  }

  setIgnoreParser(ignoreParser: IgnoreParser): void {
    this.ignoreParser = ignoreParser;
  }

  getIgnoreParser(): IgnoreParser {
    return this.ignoreParser;
  }
}