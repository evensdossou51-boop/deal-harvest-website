/**
 * Automated Scheduler for Walmart Product Import
 * Runs the import process on a schedule (daily/weekly)
 */

const cron = require('node-cron');
const WalmartImporter = require('./walmart-importer');

// Configuration
const CONFIG = {
    // Schedule options
    schedules: {
        daily: '0 9 * * *',      // Every day at 9 AM
        weekly: '0 9 * * 1',     // Every Monday at 9 AM
        hourly: '0 * * * *'      // Every hour (for testing)
    },
    
    // Import settings
    maxProductsPerRun: 5,
    enableNotifications: true
};

class ImportScheduler {
    constructor(config) {
        this.config = config;
        this.isRunning = false;
    }

    /**
     * Log with timestamp
     */
    log(message) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${message}`);
    }

    /**
     * Run the import process
     */
    async runImport() {
        if (this.isRunning) {
            this.log('⏳ Import already running, skipping...');
            return;
        }

        try {
            this.isRunning = true;
            this.log('🚀 Starting scheduled Walmart import...');
            
            const importer = new WalmartImporter({
                ...require('./walmart-importer').CONFIG,
                maxProducts: this.config.maxProductsPerRun
            });
            
            await importer.run();
            
            this.log('✅ Scheduled import completed successfully!');
            
        } catch (error) {
            this.log(`❌ Scheduled import failed: ${error.message}`);
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Start scheduler with specified frequency
     */
    start(frequency = 'daily') {
        const schedule = this.config.schedules[frequency];
        
        if (!schedule) {
            console.error(`❌ Invalid frequency: ${frequency}`);
            console.log('Available frequencies:', Object.keys(this.config.schedules));
            return;
        }

        this.log(`📅 Starting scheduler: ${frequency} (${schedule})`);
        
        cron.schedule(schedule, async () => {
            await this.runImport();
        });

        this.log('✅ Scheduler started successfully!');
        this.log('Press Ctrl+C to stop the scheduler');
        
        // Keep the process running
        process.stdin.resume();
    }

    /**
     * Run one-time import (for testing)
     */
    async runOnce() {
        this.log('🔧 Running one-time import for testing...');
        await this.runImport();
        process.exit(0);
    }
}

// ===== COMMAND LINE INTERFACE =====
if (require.main === module) {
    const scheduler = new ImportScheduler(CONFIG);
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('📋 Walmart Import Scheduler');
        console.log('Usage: node scheduler.js [command]');
        console.log('');
        console.log('Commands:');
        console.log('  daily     - Run import daily at 9 AM');
        console.log('  weekly    - Run import weekly on Mondays at 9 AM');
        console.log('  hourly    - Run import every hour (testing)');
        console.log('  once      - Run import once and exit');
        console.log('');
        process.exit(1);
    }
    
    const command = args[0];
    
    if (command === 'once') {
        scheduler.runOnce();
    } else if (scheduler.config.schedules[command]) {
        scheduler.start(command);
    } else {
        console.error(`❌ Unknown command: ${command}`);
        process.exit(1);
    }
}

module.exports = ImportScheduler;