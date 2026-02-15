<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;


return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
            $middleware->api(prepend: [
                \App\Http\Middleware\AttachRequestId::class,
                EnsureFrontendRequestsAreStateful::class,
                \Illuminate\Routing\Middleware\SubstituteBindings::class,
            ]);

            $middleware->alias([
                'admin' => \App\Http\Middleware\AdminMiddleware::class,
            ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (\Throwable $e, Request $request) {
            if (!$request->expectsJson()) {
                return null;
            }

            $status = $e instanceof HttpExceptionInterface ? $e->getStatusCode() : 500;
            $requestId = $request->attributes->get('request_id');

            if ($e instanceof ValidationException) {
                return response()->json([
                    'message' => $e->getMessage(),
                    'errors' => $e->errors(),
                    'request_id' => $requestId,
                ], 422)->header('X-Request-Id', $requestId);
            }

            if ($e instanceof AuthenticationException) {
                return response()->json([
                    'message' => 'Unauthenticated.',
                    'request_id' => $requestId,
                ], 401)->header('X-Request-Id', $requestId);
            }

            if ($e instanceof AuthorizationException) {
                return response()->json([
                    'message' => 'This action is unauthorized.',
                    'request_id' => $requestId,
                ], 403)->header('X-Request-Id', $requestId);
            }

            $message = $e->getMessage();
            if ($message === '' || $status >= 500) {
                $message = $status >= 500 ? 'Server Error' : 'Request failed';
            }

            return response()->json([
                'message' => $message,
                'request_id' => $requestId,
            ], $status)->header('X-Request-Id', $requestId);
        });
    })->create();
