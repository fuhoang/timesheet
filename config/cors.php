<?php

$defaultOrigins = array_values(array_unique(array_filter([
    config('endpoints.frontend_url'),
    config('endpoints.frontend_dev_url'),
    config('endpoints.backend_url'),
])));

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => array_filter(array_map('trim', explode(',', env(
        'CORS_ALLOWED_ORIGINS',
        implode(',', $defaultOrigins)
    )))),
    'allowed_headers' => ['*'],
    'supports_credentials' => true,
];
