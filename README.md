# AchievedIT

A personal achievement registry to upload, organize, search, and manage certificates and achievements.

Users can upload certificate images or PDFs, enter details manually, or use AI-powered extraction to automatically extract certificate information.

## ✨ Features

* 📜 Upload certificates as images or PDFs
* 🤖 AI-powered certificate information extraction
* 🔍 Search and filter achievements
* 👤 Personal user-specific certificate collection
* 🔐 Secure authentication with JWT
* 🔑 Password hashing with bcrypt
* ☁️ Cloudinary-based certificate storage
* 📱 Responsive and modern UI
* 🛡️ Protected API routes
* ⚡ Fast and lightweight architecture

## 🛠️ Tech Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose

### Authentication

* JWT
* httpOnly Cookies
* bcrypt

### Storage & AI

* Cloudinary
* Groq AI

### Deployment

* Vercel — Frontend
* Render — Backend
* MongoDB Atlas — Database

## 📁 Project Structure

```text
achievedit-mern/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── db/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   └── types/
│   └── package.json
│
├── render.yaml
└── README.md
```

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/achievedit-mern.git
cd achievedit-mern
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

GROQ_API_KEY=your_groq_api_key

CLIENT_URL=http://localhost:5173
```

Start the backend:

```bash
npm run dev
```

Backend runs on:

```text
http://localhost:5000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

## 🔐 Security

* Passwords are securely hashed using bcrypt.
* Authentication uses JWT stored in httpOnly cookies.
* Protected routes require authentication.
* Users can access only their own certificates.
* AI API credentials remain on the backend.
* Certificate files are stored in Cloudinary instead of MongoDB.
* API requests are rate-limited.
* Security headers are configured using Helmet.

## 🌐 Deployment

### Frontend

Deploy the `frontend` directory to Vercel.

Set:

```env
VITE_API_URL=https://your-backend-url/api
```

### Backend

Deploy the `backend` directory to Render and configure the required environment variables.

Set:

```env
CLIENT_URL=https://your-frontend-url
```

## 📌 Future Improvements

* Bulk certificate upload
* Duplicate certificate detection
* CSV/DOCX export
* Shareable achievement portfolio
* Advanced analytics and achievement insights

## 👩‍💻 Developer

**Pratyusha**

Built with React, Node.js, MongoDB, Cloudinary, and AI.
