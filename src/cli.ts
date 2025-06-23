#!/usr/bin/env node

import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';
import { Zipper } from './zipper';

const program = new Command();

program
  .name('ignore-zipper')
  .description('CLI tool for zip operations with ignore file support')
  .version('0.0.2');

program
  .command('create')
  .description('Create a ZIP file with ignore rules applied')
  .argument('<source>', 'Source directory to zip')
  .argument('<output>', 'Output ZIP file path')
  .option('-c, --compression <level>', 'Compression level (0-9)', '6')
  .option('-i, --ignore-file <files...>', 'Additional ignore files to use')
  .option('-p, --pattern <patterns...>', 'Additional ignore patterns')
  .option('--ignore-pattern <pattern>', 'Custom pattern for ignore files (e.g., ".*ignore" or ".myignore")')
  .option('--no-auto-ignore', 'Skip automatic loading of .*ignore files')
  .option('-v, --verbose', 'Verbose output')
  .action(async (source: string, output: string, options) => {
    try {
      const sourcePath = path.resolve(source);
      const outputPath = path.resolve(output);

      if (!fs.existsSync(sourcePath)) {
        console.error(chalk.red(`Error: Source path does not exist: ${sourcePath}`));
        process.exit(1);
      }

      if (!fs.statSync(sourcePath).isDirectory()) {
        console.error(chalk.red(`Error: Source must be a directory: ${sourcePath}`));
        process.exit(1);
      }

      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const zipper = new Zipper(sourcePath);
      
      console.log(chalk.blue(`Creating ZIP: ${outputPath}`));
      console.log(chalk.blue(`Source: ${sourcePath}`));

      if (options.verbose) {
        console.log(chalk.gray('Loading ignore rules...'));
      }

      await zipper.createZip(sourcePath, outputPath, {
        compressionLevel: parseInt(options.compression),
        ignoreFiles: options.ignoreFile || [],
        customPatterns: options.pattern || [],
        ignorePattern: options.ignorePattern,
        autoIgnore: options.autoIgnore,
        verbose: options.verbose
      });

      console.log(chalk.green(`✓ ZIP created successfully: ${outputPath}`));
    } catch (error) {
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

program
  .command('extract')
  .description('Extract a ZIP file')
  .argument('<input>', 'Input ZIP file path')
  .argument('<output>', 'Output directory path')
  .option('-f, --force', 'Overwrite existing files')
  .option('-v, --verbose', 'Verbose output')
  .action(async (input: string, output: string, options) => {
    try {
      const inputPath = path.resolve(input);
      const outputPath = path.resolve(output);

      if (!fs.existsSync(inputPath)) {
        console.error(chalk.red(`Error: ZIP file does not exist: ${inputPath}`));
        process.exit(1);
      }

      const zipper = new Zipper(outputPath);
      
      console.log(chalk.blue(`Extracting ZIP: ${inputPath}`));
      console.log(chalk.blue(`Output: ${outputPath}`));

      await zipper.extractZip(inputPath, outputPath, {
        overwrite: options.force,
        verbose: options.verbose
      });

      console.log(chalk.green(`✓ ZIP extracted successfully to: ${outputPath}`));
    } catch (error) {
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List contents of a ZIP file')
  .argument('<input>', 'Input ZIP file path')
  .action(async (input: string) => {
    try {
      const inputPath = path.resolve(input);

      if (!fs.existsSync(inputPath)) {
        console.error(chalk.red(`Error: ZIP file does not exist: ${inputPath}`));
        process.exit(1);
      }

      const zipper = new Zipper(path.dirname(inputPath));
      const entries = await zipper.listZipContents(inputPath);

      console.log(chalk.blue(`Contents of ${inputPath}:`));
      console.log(chalk.gray('─'.repeat(50)));
      
      for (const entry of entries) {
        if (entry.endsWith('/')) {
          console.log(chalk.cyan(`📁 ${entry}`));
        } else {
          console.log(`📄 ${entry}`);
        }
      }
      
      console.log(chalk.gray('─'.repeat(50)));
      console.log(chalk.green(`Total entries: ${entries.length}`));
    } catch (error) {
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

program
  .command('rules')
  .description('Show active ignore rules for a directory')
  .argument('<directory>', 'Directory to analyze')
  .option('-i, --ignore-file <files...>', 'Additional ignore files to use')
  .option('-p, --pattern <patterns...>', 'Additional ignore patterns')
  .option('--ignore-pattern <pattern>', 'Custom pattern for ignore files (e.g., ".*ignore" or ".myignore")')
  .option('--no-auto-ignore', 'Skip automatic loading of .*ignore files')
  .action((directory: string, options) => {
    try {
      const dirPath = path.resolve(directory);

      if (!fs.existsSync(dirPath)) {
        console.error(chalk.red(`Error: Directory does not exist: ${dirPath}`));
        process.exit(1);
      }

      const zipper = new Zipper(dirPath);
      const ignoreParser = zipper.getIgnoreParser();
      
      // Load ignore files based on options
      if (options.autoIgnore !== false) {
        ignoreParser.loadDefaultIgnoreFiles();
      } else {
        // Load only standard ignore files if auto-ignore is disabled
        const standardFiles = ['.gitignore', '.zipignore', '.ignore'];
        for (const ignoreFile of standardFiles) {
          const fullPath = path.join(dirPath, ignoreFile);
          ignoreParser.loadIgnoreFile(fullPath);
        }
      }

      // Load files matching custom ignore pattern
      if (options.ignorePattern) {
        ignoreParser.loadIgnoreFilesByPattern(options.ignorePattern);
      }
      
      if (options.ignoreFile) {
        for (const ignoreFile of options.ignoreFile) {
          ignoreParser.loadIgnoreFile(path.resolve(ignoreFile));
        }
      }

      if (options.pattern) {
        for (const pattern of options.pattern) {
          ignoreParser.addPattern(pattern);
        }
      }

      const rules = ignoreParser.getRules();
      const loadedFiles = ignoreParser.getLoadedFiles();
      
      console.log(chalk.blue(`Ignore rules for: ${dirPath}`));
      console.log(chalk.gray('─'.repeat(50)));
      
      // Show loaded ignore files
      if (loadedFiles.length > 0) {
        console.log(chalk.cyan(`📁 Loaded ignore files: ${loadedFiles.join(', ')}`));
        console.log(chalk.gray('─'.repeat(50)));
      }
      
      if (rules.length === 0) {
        console.log(chalk.yellow('No ignore rules found'));
      } else {
        for (const rule of rules) {
          const prefix = rule.negate ? chalk.green('!') : chalk.red('-');
          const suffix = rule.directory ? chalk.gray(' (directories only)') : '';
          console.log(`${prefix} ${rule.pattern}${suffix}`);
        }
      }
      
      console.log(chalk.gray('─'.repeat(50)));
      console.log(chalk.green(`Total rules: ${rules.length}`));
    } catch (error) {
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

program.parse();