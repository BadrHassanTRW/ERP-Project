<?php

namespace Modules\System\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Modules\System\Http\Requests\SystemSettingRequest;
use Modules\System\Services\SystemSettingService;

class SystemSettingController extends Controller
{
    protected SystemSettingService $settingService;

    public function __construct(SystemSettingService $settingService)
    {
        $this->settingService = $settingService;
    }

    /**
     * Display all system settings.
     * GET /api/settings
     *
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        $settings = $this->settingService->getAll();
        $companyInfo = $this->settingService->getCompanyInfo();
        $preferences = $this->settingService->getSystemPreferences();

        return response()->json([
            'success' => true,
            'data' => [
                'settings' => $settings,
                'company_info' => $companyInfo,
                'preferences' => $preferences,
            ],
        ]);
    }

    /**
     * Update system settings.
     * PUT /api/settings
     *
     * @param SystemSettingRequest $request
     * @return JsonResponse
     */
    public function update(SystemSettingRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // Update each setting
        foreach ($validated as $key => $value) {
            if ($value !== null) {
                $this->settingService->set($key, $value);
            }
        }

        $settings = $this->settingService->getAll();
        $companyInfo = $this->settingService->getCompanyInfo();
        $preferences = $this->settingService->getSystemPreferences();

        return response()->json([
            'success' => true,
            'message' => 'Settings updated successfully.',
            'data' => [
                'settings' => $settings,
                'company_info' => $companyInfo,
                'preferences' => $preferences,
            ],
        ]);
    }

    /**
     * Upload company logo.
     * POST /api/settings/logo
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function uploadLogo(Request $request): JsonResponse
    {
        $request->validate([
            'logo' => ['required', 'file', 'max:2048', 'mimes:png,jpg,jpeg,svg'],
        ]);

        try {
            $path = $this->settingService->uploadLogo($request->file('logo'));

            return response()->json([
                'success' => true,
                'message' => 'Logo uploaded successfully.',
                'data' => [
                    'logo_path' => $path,
                    'logo_url' => asset('storage/' . $path),
                ],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
                'error_code' => 'VALIDATION_ERROR',
            ], 422);
        }
    }

    /**
     * Delete company logo.
     * DELETE /api/settings/logo
     *
     * @return JsonResponse
     */
    public function deleteLogo(): JsonResponse
    {
        $this->settingService->deleteLogo();

        return response()->json([
            'success' => true,
            'message' => 'Logo deleted successfully.',
        ]);
    }

    /**
     * Get a specific setting by key.
     * GET /api/settings/{key}
     *
     * @param string $key
     * @return JsonResponse
     */
    public function show(string $key): JsonResponse
    {
        $value = $this->settingService->get($key);

        return response()->json([
            'success' => true,
            'data' => [
                'key' => $key,
                'value' => $value,
            ],
        ]);
    }

    /**
     * Clear settings cache.
     * POST /api/settings/clear-cache
     *
     * @return JsonResponse
     */
    public function clearCache(): JsonResponse
    {
        $this->settingService->clearCache();

        return response()->json([
            'success' => true,
            'message' => 'Settings cache cleared successfully.',
        ]);
    }
}
