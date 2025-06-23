import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';
import yauzl from 'yauzl';
import { IgnoreParser } from './ignore-parser';
import { FileTraversal } from './file-traversal';

export interface ZipOptions {
  compressionLevel?: number;
  ignoreFiles?: string[];
  customPatterns?: string[];
  verbose?: boolean;
}

export interface ExtractOptions {
  overwrite?: boolean;
  verbose?: boolean;
}

export class Zipper {
  private ignoreParser: IgnoreParser;
  private fileTraversal: FileTraversal;

  constructor(basePath: string) {
    this.ignoreParser = new IgnoreParser(basePath);
    this.fileTraversal = new FileTraversal(basePath, this.ignoreParser);
  }

  async createZip(sourcePath: string, outputPath: string, options: ZipOptions = {}): Promise<void> {
    const {
      compressionLevel = 6,
      ignoreFiles = [],
      customPatterns = [],
      verbose = false
    } = options;

    // Load ignore files
    this.ignoreParser.loadDefaultIgnoreFiles();
    
    // Load custom ignore files
    for (const ignoreFile of ignoreFiles) {
      this.ignoreParser.loadIgnoreFile(ignoreFile);
    }

    // Add custom patterns
    for (const pattern of customPatterns) {
      this.ignoreParser.addPattern(pattern);
    }

    // Create the archive
    const archive = archiver('zip', {
      zlib: { level: compressionLevel }
    });

    const output = fs.createWriteStream(outputPath);
    
    return new Promise((resolve, reject) => {
      output.on('close', () => {
        if (verbose) {
          console.log(`Created ${outputPath} (${archive.pointer()} bytes)`);
        }
        resolve(undefined);
      });

      archive.on('error', reject);
      archive.pipe(output);

      // Add files to archive
      this.addFilesToArchive(archive, sourcePath, verbose)
        .then(() => {
          archive.finalize();
        })
        .catch(reject);
    });
  }

  private async addFilesToArchive(archive: archiver.Archiver, sourcePath: string, verbose: boolean): Promise<void> {
    const files = await this.fileTraversal.getFilesOnly(sourcePath);
    
    for (const file of files) {
      if (verbose) {
        console.log(`Adding: ${file.relativePath}`);
      }
      
      archive.file(file.fullPath, { name: file.relativePath });
    }
  }

  async extractZip(zipPath: string, outputPath: string, options: ExtractOptions = {}): Promise<void> {
    const { overwrite = false, verbose = false } = options;

    if (!fs.existsSync(zipPath)) {
      throw new Error(`ZIP file not found: ${zipPath}`);
    }

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    const zipFile = await new Promise<yauzl.ZipFile>((resolve, reject) => {
      yauzl.open(zipPath, { lazyEntries: true }, (err, zipFile) => {
        if (err) reject(err);
        else resolve(zipFile!);
      });
    });

    return new Promise((resolve, reject) => {
      zipFile.on('entry', (entry: yauzl.Entry) => {
        const outputFilePath = path.join(outputPath, entry.fileName);
        
        // Security check: prevent directory traversal
        if (!outputFilePath.startsWith(path.resolve(outputPath))) {
          console.warn(`Skipping potentially dangerous path: ${entry.fileName}`);
          zipFile.readEntry();
          return;
        }

        if (entry.fileName.endsWith('/')) {
          // Directory entry
          fs.mkdirSync(outputFilePath, { recursive: true });
          if (verbose) {
            console.log(`Created directory: ${entry.fileName}`);
          }
          zipFile.readEntry();
        } else {
          // File entry
          if (!overwrite && fs.existsSync(outputFilePath)) {
            console.warn(`File exists, skipping: ${entry.fileName}`);
            zipFile.readEntry();
            return;
          }

          // Create directory if it doesn't exist
          const dir = path.dirname(outputFilePath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }

          zipFile.openReadStream(entry, (err, readStream) => {
            if (err) {
              reject(err);
              return;
            }

            const writeStream = fs.createWriteStream(outputFilePath);
            
            writeStream.on('error', reject);
            writeStream.on('close', () => {
              if (verbose) {
                console.log(`Extracted: ${entry.fileName}`);
              }
              zipFile.readEntry();
            });

            readStream!.pipe(writeStream);
          });
        }
      });

      zipFile.on('end', () => resolve(undefined));
      zipFile.on('error', reject);
      zipFile.readEntry();
    });
  }

  async listZipContents(zipPath: string): Promise<string[]> {
    if (!fs.existsSync(zipPath)) {
      throw new Error(`ZIP file not found: ${zipPath}`);
    }

    const zipFile = await new Promise<yauzl.ZipFile>((resolve, reject) => {
      yauzl.open(zipPath, { lazyEntries: true }, (err, zipFile) => {
        if (err) reject(err);
        else resolve(zipFile!);
      });
    });
    const entries: string[] = [];

    return new Promise((resolve, reject) => {
      zipFile.on('entry', (entry: yauzl.Entry) => {
        entries.push(entry.fileName);
        zipFile.readEntry();
      });

      zipFile.on('end', () => resolve(entries));
      zipFile.on('error', reject);
      zipFile.readEntry();
    });
  }

  getIgnoreParser(): IgnoreParser {
    return this.ignoreParser;
  }
}