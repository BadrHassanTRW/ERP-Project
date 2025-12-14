<?php

namespace Modules\System\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Modules\System\Models\SystemSetting;

class SystemSettingService
{
    /**
     * Allowed logo file types.
     */
    protected const ALLOWED_LOGO_TYPES = ['png', 'jpg', 'jpeg', 'svg'];

    /**
     * Maximum logo file size in bytes (2MB).
     */
    protected const MAX_LOGO_SIZE = 2097152;

    /**
     * @var AuditLogService
     */
    protected AuditLogService $auditLogService;

    /**
     * Constructor.
     *
     * @param AuditLogService $auditLogService
     */
    public function __construct(AuditLogService $auditLogService)
    {
        $this->auditLogService = $auditLogService;
    }

    /**
     * Get a setting value by key.
     *
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    public function get(string $key, mixed $default = null): mixed
    {
        return SystemSetting::get($key, $default);
    }

    /**
     * Set a setting value by key.
     *
     * @param string $key
     * @param mixed $value
     * @param string $type
     * @return void
     */
    public function set(string $key, mixed $value, string $type = 'string'): void
    {
        $oldValue = SystemSetting::get($key);

        SystemSetting::set($key, $value, $type);

        // Log the change
        $this->auditLogService->logUpdate(
            'system_settings',
            0,
            ['key' => $key, 'value' => $oldValue],
            ['key' => $key, 'value' => $value]
        );
    }

    /**
     * Get all settings.
     *
     * @return array
     */
    public function getAll(): array
    {
        return SystemSetting::getAll();
    }

    /**
     * Update multiple settings at once.
     *
     * @param array $settings
     * @return array
     */
    public function updateMultiple(array $settings): array
    {
        $oldSettings = $this->getAll();

        foreach ($settings as $key => $data) {
            if (is_array($data) && isset($data['value'])) {
                $type = $data['type'] ?? 'string';
                SystemSetting::set($key, $data['value'], $type);
            } else {
                SystemSetting::set($key, $data);
            }
        }

        $newSettings = SystemSetting::getAll();

        // Log the bulk update
        $this->auditLogService->logUpdate(
            'system_settings',
            0,
            $oldSettings,
            $newSettings
        );

        return $newSettings;
    }

    /**
     * Upload and store a company logo.
     *
     * @param UploadedFile $file
     * @return string The path to the stored logo
     * @throws ValidationException
     */
    public function uploadLogo(UploadedFile $file): string
    {
        // Validate file type
        $extension = strtolower($file->getClientOriginalExtension());
        if (!in_array($extension, self::ALLOWED_LOGO_TYPES)) {
            throw ValidationException::withMessages([
                'logo' => ['Logo must be a PNG, JPG, or SVG file.'],
            ]);
        }

        // Validate file size
        if ($file->getSize() > self::MAX_LOGO_SIZE) {
            throw ValidationException::withMessages([
                'logo' => ['Logo must not exceed 2MB.'],
            ]);
        }

        // Delete old logo if exists
        $oldLogo = $this->get('company_logo');
        if ($oldLogo && Storage::disk('public')->exists($oldLogo)) {
            Storage::disk('public')->delete($oldLogo);
        }

        // Store the new logo
        $path = $file->store('logos', 'public');

        // Save the path to settings
        $this->set('company_logo', $path, 'string');

        return $path;
    }

    /**
     * Delete the company logo.
     *
     * @return bool
     */
    public function deleteLogo(): bool
    {
        $logo = $this->get('company_logo');

        if ($logo && Storage::disk('public')->exists($logo)) {
            Storage::disk('public')->delete($logo);
        }

        $this->set('company_logo', null, 'string');

        return true;
    }

    /**
     * Get company information settings.
     *
     * @return array
     */
    public function getCompanyInfo(): array
    {
        return [
            'company_name' => $this->get('company_name', ''),
            'company_address' => $this->get('company_address', ''),
            'company_phone' => $this->get('company_phone', ''),
            'company_email' => $this->get('company_email', ''),
            'company_logo' => $this->get('company_logo'),
        ];
    }

    /**
     * Get system preferences.
     *
     * @return array
     */
    public function getSystemPreferences(): array
    {
        return [
            'date_format' => $this->get('date_format', 'Y-m-d'),
            'timezone' => $this->get('timezone', 'UTC'),
            'currency' => $this->get('currency', 'USD'),
            'currency_symbol' => $this->get('currency_symbol', '$'),
        ];
    }

    /**
     * Clear all settings cache.
     *
     * @return void
     */
    public function clearCache(): void
    {
        SystemSetting::clearCache();
    }
}
