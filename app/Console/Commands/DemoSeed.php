<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;

class DemoSeed extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'demo:seed {--fresh : Drop all tables and re-run all migrations}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Prepare demo data (migrate and seed)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        if ($this->option('fresh')) {
            $this->info('Running migrate:fresh --seed...');
            Artisan::call('migrate:fresh', ['--seed' => true], $this->output);
        } else {
            $this->info('Running migrate --seed...');
            Artisan::call('migrate', ['--seed' => true], $this->output);
        }

        $this->info('Demo data ready.');

        return self::SUCCESS;
    }
}
