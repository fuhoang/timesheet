<?php

return [
    'backend_url' => env('APP_URL'),
    'frontend_url' => env('FRONTEND_URL', env('VITE_FRONTEND_URL')),
    'frontend_dev_url' => env('VITE_FRONTEND_URL', env('FRONTEND_URL')),
    'api_url' => env('VITE_API_URL', env('APP_URL')),
];

