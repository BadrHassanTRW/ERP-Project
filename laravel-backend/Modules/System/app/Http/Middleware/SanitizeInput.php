<?php

namespace Modules\System\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware to sanitize input against SQL injection and XSS patterns.
 * 
 * Requirements: 10.2 - WHEN an API request contains malformed or malicious input 
 * THEN the ERP_System SHALL sanitize the input and reject invalid data
 */
class SanitizeInput
{
    /**
     * SQL injection patterns to detect and sanitize.
     */
    protected array $sqlPatterns = [
        '/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE|EXEC|EXECUTE)\b)/i',
        '/(\b(OR|AND)\s+[\d\w]+\s*=\s*[\d\w]+)/i',
        '/(--|\#|\/\*|\*\/)/i',
        '/(\bINTO\s+OUTFILE\b)/i',
        '/(\bLOAD_FILE\b)/i',
        '/(\bBENCHMARK\b)/i',
        '/(\bSLEEP\b\s*\()/i',
        '/(\bWAITFOR\s+DELAY\b)/i',
        '/(;\s*(SELECT|INSERT|UPDATE|DELETE|DROP))/i',
        '/(\'\s*(OR|AND)\s*\')/i',
    ];

    /**
     * XSS patterns to detect and sanitize.
     */
    protected array $xssPatterns = [
        '/<script\b[^>]*>(.*?)<\/script>/is',
        '/javascript\s*:/i',
        '/on\w+\s*=/i',
        '/<iframe\b[^>]*>(.*?)<\/iframe>/is',
        '/<object\b[^>]*>(.*?)<\/object>/is',
        '/<embed\b[^>]*>/i',
        '/<link\b[^>]*>/i',
        '/<meta\b[^>]*>/i',
        '/expression\s*\(/i',
        '/vbscript\s*:/i',
        '/data\s*:\s*text\/html/i',
    ];

    /**
     * Fields that should be excluded from sanitization.
     */
    protected array $excludedFields = [
        'password',
        'password_confirmation',
        'current_password',
        'new_password',
    ];

    /**
     * Handle an incoming request.
     *
     * @param Request $request
     * @param Closure $next
     * @return Response
     */
    public function handle(Request $request, Closure $next): Response
    {
        $input = $request->all();
        
        // Check for malicious patterns first
        $maliciousFields = $this->detectMaliciousInput($input);
        
        if (!empty($maliciousFields)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid input detected. Request rejected for security reasons.',
                'error_code' => 'MALICIOUS_INPUT_DETECTED',
                'errors' => [
                    'input' => ['The request contains potentially malicious content.'],
                ],
            ], 422);
        }

        // Sanitize the input
        $sanitizedInput = $this->sanitizeArray($input);
        $request->merge($sanitizedInput);

        return $next($request);
    }

    /**
     * Detect malicious input patterns.
     *
     * @param array $data
     * @param string $prefix
     * @return array
     */
    protected function detectMaliciousInput(array $data, string $prefix = ''): array
    {
        $maliciousFields = [];

        foreach ($data as $key => $value) {
            $fieldName = $prefix ? "{$prefix}.{$key}" : $key;

            // Skip excluded fields
            if (in_array($key, $this->excludedFields)) {
                continue;
            }

            if (is_array($value)) {
                $maliciousFields = array_merge(
                    $maliciousFields,
                    $this->detectMaliciousInput($value, $fieldName)
                );
            } elseif (is_string($value)) {
                if ($this->containsSqlInjection($value) || $this->containsXss($value)) {
                    $maliciousFields[] = $fieldName;
                }
            }
        }

        return $maliciousFields;
    }

    /**
     * Check if a string contains SQL injection patterns.
     *
     * @param string $value
     * @return bool
     */
    protected function containsSqlInjection(string $value): bool
    {
        foreach ($this->sqlPatterns as $pattern) {
            if (preg_match($pattern, $value)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if a string contains XSS patterns.
     *
     * @param string $value
     * @return bool
     */
    protected function containsXss(string $value): bool
    {
        foreach ($this->xssPatterns as $pattern) {
            if (preg_match($pattern, $value)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Sanitize an array of input data recursively.
     *
     * @param array $data
     * @return array
     */
    protected function sanitizeArray(array $data): array
    {
        $sanitized = [];

        foreach ($data as $key => $value) {
            // Skip excluded fields
            if (in_array($key, $this->excludedFields)) {
                $sanitized[$key] = $value;
                continue;
            }

            if (is_array($value)) {
                $sanitized[$key] = $this->sanitizeArray($value);
            } elseif (is_string($value)) {
                $sanitized[$key] = $this->sanitizeString($value);
            } else {
                $sanitized[$key] = $value;
            }
        }

        return $sanitized;
    }

    /**
     * Sanitize a string value.
     *
     * @param string $value
     * @return string
     */
    protected function sanitizeString(string $value): string
    {
        // Convert special characters to HTML entities
        $value = htmlspecialchars($value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        
        // Strip null bytes
        $value = str_replace(chr(0), '', $value);
        
        // Trim whitespace
        $value = trim($value);

        return $value;
    }
}
