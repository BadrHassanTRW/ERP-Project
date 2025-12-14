# ERP Project

A full-stack ERP system with a Next.js frontend and Laravel backend.

## 📁 Project Structure

```
├── /                    # Next.js Frontend (Dashboard)
├── /laravel-backend     # Laravel API Backend
```

---

## 🖥️ Prerequisites - Install These First

Before you begin, install the following software on your computer:

### 1. Node.js (for Frontend)
- Download from: https://nodejs.org/
- Choose the **LTS version** (recommended)
- Run the installer and follow the prompts
- Verify installation: Open terminal/command prompt and run:
  ```bash
  node --version
  npm --version
  ```

### 2. PHP 8.2+ (for Backend)
**Windows:**
- Download XAMPP from: https://www.apachefriends.org/
- Or download PHP directly: https://windows.php.net/download/
- Add PHP to your system PATH

**Mac:**
```bash
brew install php
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install php php-mysql php-xml php-curl php-mbstring php-zip
```

Verify installation:
```bash
php --version
```

### 3. Composer (PHP Package Manager)
- Download from: https://getcomposer.org/download/
- Run the installer
- Verify installation:
  ```bash
  composer --version
  ```

### 4. MySQL Database
**Option A - XAMPP (Easiest for Windows):**
- XAMPP includes MySQL - just start it from the XAMPP Control Panel

**Option B - MySQL Installer:**
- Download from: https://dev.mysql.com/downloads/mysql/
- Remember your root password during installation

**Option C - Using WAMP/MAMP:**
- WAMP (Windows): https://www.wampserver.com/
- MAMP (Mac): https://www.mamp.info/

### 5. Git
- Download from: https://git-scm.com/downloads
- Verify installation:
  ```bash
  git --version
  ```

---

## 🚀 Installation Steps

### Step 1: Clone the Repository

Open your terminal/command prompt and run:

```bash
git clone https://github.com/BadrHassanTRW/ERP-Project.git
cd ERP-Project
```

---

### Step 2: Setup the Database

1. **Start MySQL** (via XAMPP Control Panel, or your MySQL service)

2. **Create a new database:**
   
   Open phpMyAdmin (http://localhost/phpmyadmin) or MySQL command line:
   ```sql
   CREATE DATABASE erp_database;
   ```

---

### Step 3: Setup Backend (Laravel)

Open a terminal in the project folder and run these commands one by one:

```bash
# Navigate to backend folder
cd laravel-backend

# Install PHP dependencies
composer install

# Copy the example environment file
copy .env.example .env        # Windows
# cp .env.example .env        # Mac/Linux

# Generate application key
php artisan key:generate
```

Now **edit the `.env` file** in the `laravel-backend` folder. Find these lines and update them:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=erp_database
DB_USERNAME=root
DB_PASSWORD=
```

> ⚠️ If you set a MySQL password during installation, add it to `DB_PASSWORD=`

Continue with these commands:

```bash
# Run database migrations (creates tables)
php artisan migrate

# Start the Laravel server
php artisan serve
```

✅ **Backend is now running at:** http://127.0.0.1:8000

> Keep this terminal window open!

---

### Step 4: Setup Frontend (Next.js)

Open a **NEW terminal window** (keep the backend running) and run:

```bash
# Navigate to project root (frontend)
cd ERP-Project

# Install Node.js dependencies
npm install

# Copy the example environment file
copy .env.example .env.local   # Windows
# cp .env.example .env.local   # Mac/Linux

# Start the development server
npm run dev
```

✅ **Frontend is now running at:** http://localhost:3000

---

## ✅ You're Done!

Open your browser and go to: **http://localhost:3000**

You should see the ERP Dashboard!

---

## 📋 Quick Reference - Running the Project

Every time you want to work on the project, you need to start both servers:

**Terminal 1 - Backend:**
```bash
cd ERP-Project/laravel-backend
php artisan serve
```

**Terminal 2 - Frontend:**
```bash
cd ERP-Project
npm run dev
```

---

## 🔧 Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000
```

### Backend (.env)
Key variables:
| Variable | Description | Default |
|----------|-------------|---------|
| DB_DATABASE | Database name | erp_database |
| DB_USERNAME | Database user | root |
| DB_PASSWORD | Database password | (empty) |
| CORS_ALLOWED_ORIGINS | Frontend URL | http://localhost:3000 |

---

## 🛠️ Tech Stack

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
- Modular Architecture

---

## ❓ Troubleshooting

### "php is not recognized as a command"
- Add PHP to your system PATH, or use XAMPP's PHP location

### "composer is not recognized"
- Reinstall Composer and make sure to check "Add to PATH"

### Database connection error
- Make sure MySQL is running
- Check your `.env` database credentials
- Make sure the database exists

### CORS errors in browser
- Make sure both servers are running
- Check that `CORS_ALLOWED_ORIGINS` in backend `.env` includes `http://localhost:3000`

### Port already in use
- Backend: `php artisan serve --port=8001`
- Frontend: `npm run dev -- -p 3001`

---

## 📄 License

MIT
