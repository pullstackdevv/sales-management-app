<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Cache\RateLimiter;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Symfony\Component\HttpFoundation\Response;

class ApiRateLimiter
{
    /**
     * The rate limiter instance.
     */
    protected RateLimiter $limiter;

    /**
     * Create a new middleware instance.
     */
    public function __construct(RateLimiter $limiter)
    {
        $this->limiter = $limiter;
    }

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $maxAttempts = '60', string $decayMinutes = '1'): Response
    {
        $key = $this->resolveRequestSignature($request);
        
        $maxAttempts = (int) $maxAttempts;
        $decayMinutes = (int) $decayMinutes;

        if ($this->limiter->tooManyAttempts($key, $maxAttempts)) {
            throw $this->buildException($request, $key, $maxAttempts, $decayMinutes);
        }

        $this->limiter->hit($key, $decayMinutes * 60);

        $response = $next($request);

        return $this->addHeaders(
            $response,
            $maxAttempts,
            $this->calculateRemainingAttempts($key, $maxAttempts)
        );
    }

    /**
     * Resolve the request signature.
     */
    protected function resolveRequestSignature(Request $request): string
    {
        if ($user = $request->user()) {
            return sha1('api_rate_limit:user:' . $user->getAuthIdentifier());
        }

        return sha1('api_rate_limit:ip:' . $request->ip());
    }

    /**
     * Create a 'too many attempts' exception.
     */
    protected function buildException(Request $request, string $key, int $maxAttempts, int $decayMinutes): ThrottleRequestsException
    {
        $retryAfter = $this->getTimeUntilNextRetry($key);

        $headers = $this->getHeaders(
            $maxAttempts,
            $this->calculateRemainingAttempts($key, $maxAttempts, $retryAfter),
            $retryAfter
        );

        return new ThrottleRequestsException(
            'Too Many Attempts.',
            null,
            $headers
        );
    }

    /**
     * Get the number of seconds until the next retry.
     */
    protected function getTimeUntilNextRetry(string $key): int
    {
        return $this->limiter->availableIn($key);
    }

    /**
     * Add the limit header information to the given response.
     */
    protected function addHeaders(Response $response, int $maxAttempts, int $remainingAttempts, ?int $retryAfter = null): Response
    {
        $headers = $this->getHeaders($maxAttempts, $remainingAttempts, $retryAfter);

        $response->headers->add($headers);

        return $response;
    }

    /**
     * Get the limit headers information.
     */
    protected function getHeaders(int $maxAttempts, int $remainingAttempts, ?int $retryAfter = null): array
    {
        $headers = [
            'X-RateLimit-Limit' => $maxAttempts,
            'X-RateLimit-Remaining' => $remainingAttempts,
        ];

        if (! is_null($retryAfter)) {
            $headers['Retry-After'] = $retryAfter;
            $headers['X-RateLimit-Reset'] = time() + $retryAfter;
        }

        return $headers;
    }

    /**
     * Calculate the number of remaining attempts.
     */
    protected function calculateRemainingAttempts(string $key, int $maxAttempts, ?int $retryAfter = null): int
    {
        return is_null($retryAfter) ? $this->limiter->retriesLeft($key, $maxAttempts) : 0;
    }
}