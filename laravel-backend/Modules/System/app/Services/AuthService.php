<?php

namespace Modules\System\Services;

use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthService
{
    /**
     * Maximum login attempts before lockout.
     */
    protected const MAX_LOGIN_ATTEMPTS = 5;

    /**
     * Lockout duration in minutes.
     */
    protected const LOCKOUT_MINUTES = 15;

    /**
     * Password reset token expiration in minutes.
     */
    protected const PASSWORD_RESET_EXPIRATION = 60;

    /**
     * Register a new user.
     *
     * @param array $data
     * @return User
     * @throws ValidationException
     */
    public function register(array $data): User
    {
        // Check for duplicate email
        if (User::where('email', $data['email'])->exists()) {
            throw ValidationException::withMessages([
                'email' => ['The email has already been taken.'],
            ]);
        }

        // Validate password length
        if (strlen($data['password']) < 8) {
            throw ValidationException::withMessages([
                'password' => ['The password must be at least 8 characters.'],
            ]);
        }

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'is_active' => true,
        ]);

        $this->sendVerificationEmail($user);

        return $user;
    }


    /**
     * Send verification email to user.
     *
     * @param User $user
     * @return void
     */
    public function sendVerificationEmail(User $user): void
    {
        $token = $this->generateVerificationToken($user);
        
        // Store the verification token
        DB::table('email_verification_tokens')->updateOrInsert(
            ['email' => $user->email],
            [
                'token' => hash('sha256', $token),
                'created_at' => now(),
            ]
        );

        // In a real application, you would send an email here
        // Mail::to($user->email)->send(new VerificationEmail($token));
    }

    /**
     * Generate a verification token for the user.
     *
     * @param User $user
     * @return string
     */
    protected function generateVerificationToken(User $user): string
    {
        return hash_hmac('sha256', $user->email . Str::random(40), config('app.key'));
    }

    /**
     * Verify user's email with token.
     *
     * @param string $token
     * @return bool
     */
    public function verifyEmail(string $token): bool
    {
        $hashedToken = hash('sha256', $token);
        
        $record = DB::table('email_verification_tokens')
            ->where('token', $hashedToken)
            ->first();

        if (!$record) {
            return false;
        }

        $user = User::where('email', $record->email)->first();
        
        if (!$user) {
            return false;
        }

        $user->email_verified_at = now();
        $user->save();

        // Delete the used token
        DB::table('email_verification_tokens')
            ->where('email', $record->email)
            ->delete();

        return true;
    }

    /**
     * Login user with credentials.
     *
     * @param string $email
     * @param string $password
     * @return array|null
     * @throws ValidationException
     */
    public function login(string $email, string $password): ?array
    {
        // Check if account is locked
        if (!$this->checkLoginAttempts($email)) {
            throw ValidationException::withMessages([
                'email' => ['Too many login attempts. Please try again in ' . self::LOCKOUT_MINUTES . ' minutes.'],
            ]);
        }

        $user = User::where('email', $email)->first();

        if (!$user || !Hash::check($password, $user->password)) {
            $this->incrementLoginAttempts($email);
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Check if email is verified
        if (!$user->email_verified_at) {
            throw ValidationException::withMessages([
                'email' => ['Please verify your email address before logging in.'],
            ]);
        }

        // Check if user is active
        if (!$user->is_active) {
            throw ValidationException::withMessages([
                'email' => ['Your account has been deactivated.'],
            ]);
        }

        $this->clearLoginAttempts($email);

        $token = $user->createToken('auth-token')->plainTextToken;

        return [
            'user' => $user,
            'token' => $token,
        ];
    }

    /**
     * Logout user by revoking current token.
     *
     * @param User $user
     * @return bool
     */
    public function logout(User $user): bool
    {
        // Revoke the current access token
        $user->currentAccessToken()->delete();
        
        return true;
    }

    /**
     * Check if login attempts are within limit.
     *
     * @param string $email
     * @return bool
     */
    public function checkLoginAttempts(string $email): bool
    {
        $key = $this->getLoginAttemptsKey($email);
        $attempts = Cache::get($key, 0);
        
        return $attempts < self::MAX_LOGIN_ATTEMPTS;
    }

    /**
     * Increment login attempts for email.
     *
     * @param string $email
     * @return void
     */
    public function incrementLoginAttempts(string $email): void
    {
        $key = $this->getLoginAttemptsKey($email);
        $attempts = Cache::get($key, 0);
        
        Cache::put($key, $attempts + 1, now()->addMinutes(self::LOCKOUT_MINUTES));
    }

    /**
     * Clear login attempts for email.
     *
     * @param string $email
     * @return void
     */
    public function clearLoginAttempts(string $email): void
    {
        Cache::forget($this->getLoginAttemptsKey($email));
    }

    /**
     * Get cache key for login attempts.
     *
     * @param string $email
     * @return string
     */
    protected function getLoginAttemptsKey(string $email): string
    {
        return 'login_attempts:' . $email;
    }

    /**
     * Send password reset link to user.
     *
     * @param string $email
     * @return bool
     */
    public function sendPasswordResetLink(string $email): bool
    {
        $user = User::where('email', $email)->first();

        // Always return true to not reveal if email exists (security)
        if (!$user) {
            return true;
        }

        $token = Str::random(64);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $email],
            [
                'token' => hash('sha256', $token),
                'created_at' => now(),
            ]
        );

        // In a real application, you would send an email here
        // Mail::to($email)->send(new PasswordResetEmail($token));

        return true;
    }

    /**
     * Reset user's password with token.
     *
     * @param string $token
     * @param string $email
     * @param string $password
     * @return bool
     * @throws ValidationException
     */
    public function resetPassword(string $token, string $email, string $password): bool
    {
        $hashedToken = hash('sha256', $token);

        $record = DB::table('password_reset_tokens')
            ->where('email', $email)
            ->where('token', $hashedToken)
            ->first();

        if (!$record) {
            throw ValidationException::withMessages([
                'token' => ['Invalid password reset token.'],
            ]);
        }

        // Check if token is expired (60 minutes)
        $createdAt = \Carbon\Carbon::parse($record->created_at);
        if ($createdAt->addMinutes(self::PASSWORD_RESET_EXPIRATION)->isPast()) {
            DB::table('password_reset_tokens')->where('email', $email)->delete();
            throw ValidationException::withMessages([
                'token' => ['Password reset token has expired. Please request a new one.'],
            ]);
        }

        $user = User::where('email', $email)->first();

        if (!$user) {
            throw ValidationException::withMessages([
                'email' => ['User not found.'],
            ]);
        }

        $user->password = Hash::make($password);
        $user->save();

        // Delete the used token
        DB::table('password_reset_tokens')->where('email', $email)->delete();

        // Invalidate all existing sessions/tokens
        $user->tokens()->delete();

        return true;
    }
}
