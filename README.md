# LMS Project

A Learning Management System built with React, TypeScript, Vite, Tailwind CSS, Django REST Framework, and PostgreSQL.

## Initial Setup

### Prerequisites
- Python 3.10+ (tested on 3.14.7)
- Node.js (v20+)
- PostgreSQL

### 1. Database Configuration
By default, the backend runs on SQLite for development if no database variables are provided. To use PostgreSQL, create an empty database locally and configure your `.env` file:
```bash
# Example PostgreSQL command to create the DB
createdb lms_db
```
Create a `.env` file in the root based on `.env.example`:
```bash
cp .env.example .env
```

### 2. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Running Tests
In the `backend` directory, run:
```bash
pytest
```