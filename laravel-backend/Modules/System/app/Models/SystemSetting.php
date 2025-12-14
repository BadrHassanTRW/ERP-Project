<?php

namespace Modules\System\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class SystemSetting extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'key',
        'value',
        'type',
    ];

    /**
     * Cache key prefix for settings.
     */
    protected const CACHE_PREFIX = 'system_setting_';

    /**
     * Cache TTL in seconds (1 hour).
     */
    protected const CACHE_TTL = 3600;

    /**
     * Get a setting value by key.
     *
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        $cacheKey = self::CACHE_PREFIX . $key;

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($key, $default) {
            $setting = self::where('key', $key)->first();

            if (!$setting) {
                return $default;
            }

            return self::castValue($setting->value, $setting->type);
        });
    }


    /**
     * Set a setting value by key.
     *
     * @param string $key
     * @param mixed $value
     * @param string $type
     * @return void
     */
    public static function set(string $key, mixed $value, string $type = 'string'): void
    {
        $stringValue = self::valueToString($value, $type);

        self::updateOrCreate(
            ['key' => $key],
            ['value' => $stringValue, 'type' => $type]
        );

        // Clear the cache for this key
        Cache::forget(self::CACHE_PREFIX . $key);
        Cache::forget(self::CACHE_PREFIX . 'all');
    }

    /**
     * Get all settings.
     *
     * @return array
     */
    public static function getAll(): array
    {
        $cacheKey = self::CACHE_PREFIX . 'all';

        return Cache::remember($cacheKey, self::CACHE_TTL, function () {
            $settings = self::all();
            $result = [];

            foreach ($settings as $setting) {
                $result[$setting->key] = self::castValue($setting->value, $setting->type);
            }

            return $result;
        });
    }

    /**
     * Cast a value to its proper type.
     *
     * @param string|null $value
     * @param string $type
     * @return mixed
     */
    protected static function castValue(?string $value, string $type): mixed
    {
        if ($value === null) {
            return null;
        }

        return match ($type) {
            'boolean', 'bool' => filter_var($value, FILTER_VALIDATE_BOOLEAN),
            'integer', 'int' => (int) $value,
            'float', 'double' => (float) $value,
            'array', 'json' => json_decode($value, true),
            default => $value,
        };
    }

    /**
     * Convert a value to string for storage.
     *
     * @param mixed $value
     * @param string $type
     * @return string|null
     */
    protected static function valueToString(mixed $value, string $type): ?string
    {
        if ($value === null) {
            return null;
        }

        return match ($type) {
            'boolean', 'bool' => $value ? '1' : '0',
            'array', 'json' => json_encode($value),
            default => (string) $value,
        };
    }

    /**
     * Clear all settings cache.
     *
     * @return void
     */
    public static function clearCache(): void
    {
        $settings = self::all();

        foreach ($settings as $setting) {
            Cache::forget(self::CACHE_PREFIX . $setting->key);
        }

        Cache::forget(self::CACHE_PREFIX . 'all');
    }
}
