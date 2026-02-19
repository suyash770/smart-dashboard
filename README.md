# SmartDash - AI-Powered Analytics Dashboard

**SmartDash** is a modern, full-stack analytics platform that leverages Artificial Intelligence to provide actionable insights, predictive modeling, and real-time data visualization. It allows users to track custom metrics, visualize trends, and receive automated alerts based on AI-driven forecasts.

![SmartDash Screenshot](frontend/public/logo512.png)

## 🚀 Features

*   **AI-Powered Predictions:** Predict future trends using Linear Regression models trained on your data.
*   **Smart Insights:** Get automated text-based insights explaining your data trends (e.g., "Revenue is surging by 15%").
*   **Interactive Visualization:** Beautiful, responsive charts using Recharts for real-time data exploration.
*   **Custom Alerts:** Set thresholds (e.g., "Notify me if Sales drops below 100") and get instant in-app notifications.
*   **File Upload Analysis:** Upload PDF or TXT files to instantly extract data and generate predictions.
*   **Cross-Category Correlations:** Discover hidden relationships between different metrics (e.g., "When Website Traffic goes up, Sales go up").
*   **Modern UI/UX:** A sleek, dark-moded interface built with React, Tailwind CSS, and Glassmorphism design principles.
*   **Robust Security:** JWT authentication, protected routes, and secure password handling.

## 🛠️ Tech Stack

### Frontend
*   **React 19**
*   **Tailwind CSS 4** (Styling & Design System)
*   **Recharts** (Data Visualization)
*   **Lucide React** (Icons)
*   **Axios** (API Communication)

### Backend
*   **Node.js & Express**
*   **MongoDB & Mongoose** (Database)
*   **JWT & Bcrypt** (Authentication)
*   **Node-Cron** (Scheduled Tasks)
*   **Nodemailer** (Email Notifications)

### AI Engine
*   **Python & Flask**
*   **Scikit-Learn** (Linear Regression Models)
*   **NumPy & Pandas** (Data Processing)
*   **PyPDF** (PDF Parsing)

## 📦 Installation & Setup

Prerequisites: Node.js, Python 3.9+, and MongoDB installed locally or a generic Atlas URI.

### 1. Clone the Repository
```bash
git clone https://github.com/suyash770/smart-dashboard.git
cd smart-dashboard
```

### 2. Backend Setup
```bash
cd backend
npm install
# Create a .env file with:
# PORT=5000
# MONGO_URI=your_mongodb_connection_string
# JWT_SECRET=your_secret_key
# AI_ENGINE_URL=http://127.0.0.1:5001
npm run dev
```

### 3. AI Engine Setup
```bash
cd ai_engine
pip install -r requirements.txt
python app.py
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm start
```

## 👨‍💻 Developer

**Suyash Gupta** - Data Scientist & ML Engineer  
Passionate about turning raw data into actionable insights through full-stack development and machine learning.

*   [GitHub](https://github.com/suyash770)
*   [LinkedIn](https://www.linkedin.com/in/suyashgupta23/)

---

© 2026 SmartDash. All rights reserved.
