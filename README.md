# ERP Project

A full-stack ERP system with a Next.js frontend and Laravel backend.

## Project Structure

```
├── /                    # Next.js Frontend (Dashboard)
├── /laravel-backend     # Laravel API Backend
```

## Requirements

- Node.js 18+
- PHP 8.2+
- Composer
- MySQL/MariaDB

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/BadrHassanTRW/ERP-Project.git
cd ERP-Project
```

### 2. Backend Setup (Laravel)

```bash
cd laravel-backend

# Install PHP dependencies
composer install

# Copy environment file and configure
cp .env.example .env

# Generate application key
php artisan key:generate

# Configure your database in .env file:
# DB_DATABASE=your_database
# DB_USERNAME=your_username
# DB_PASSWORD=your_password

# Run migrations
php artisan migrate

# Start the backend server
php artisan serve
```

The API will be available at `http://127.0.0.1:8000`

### 3. Frontend Setup (Next.js)

```bash
# From the root directory
cd ..

# Install Node dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Start the development server
npm run dev
```

The dashboard will be available at `http://localhost:3000`

## Environment Variables

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000
```

### Backend (.env)

Key variables to configure:
- `DB_DATABASE` - Your database name
- `DB_USERNAME` - Database username
- `DB_PASSWORD` - Database password
- `CORS_ALLOWED_ORIGINS` - Frontend URL for CORS
- `SANCTUM_STATEFUL_DOMAINS` - Domains for session authentication

## Tech Stack

### Frontend
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Zustand (State Management)

### Backend
- Laravel 11
- Laravel Sanctum (Authentication)
- MySQL
- Modular Architecture (nwidart/laravel-modules)

## License

MIT
