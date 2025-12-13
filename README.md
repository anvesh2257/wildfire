
# WildfireIntel: Predictive AI Risk Assessment Agent 🌍🔥

![WildfireIntel Dashboard](/public/dashboard-preview.png)

**WildfireIntel** is a next-generation environmental intelligence platform that combines **Satellite Data**, **Machine Learning (XGBoost)**, and **Interactive 3D Visualization** to predict and analyze wildfire risks globally.

Designed for researchers, emergency responders, and the public, it provides real-time risk assessment, detailed environmental analytics, and an **AI Analyst Chatbot** for data interpretation.

## ✨ Key Features

### 🧠 Advanced AI & Analytics
-   **Predictive ML Model:** Custom **XGBoost** model trained on historical fire data to predict ignition probability based on Temperature, Humidity, Wind, and Vegetation (NDVI).
-   **AI Analyst Chatbot:** An integrated intelligent assistant that explains *why* a region is at risk, provides safety recommendations, and breaks down complex environmental data into natural language.
-   **Timeline Forecasting:** 12-month risk projection using seasonal patterns.

### 🌐 Interactive 3D Visualization
-   **Global 3D Globe:** Built with `react-globe.gl` and `three.js` for a stunning, immersive experience.
-   **Real-time Data:** Visualizes active fires from **NASA FIRMS** satellite feeds.
-   **Smart Mapping:** Features global state/province borders with intelligent, clutter-free labeling (targeted detail for India/USA).
-   **Performance Optimized:** Utilizing geometry merging for silky smooth 60fps rendering even on mobile devices.

### 🛡️ Modern Risk Dashboard
-   **Glassmorphism UI:** A sleek, "Deep Space" aesthetic designed for clarity and focus.
-   **Secure Authentication:** User registration and login system.
-   **Auto-Geolocation:** Automatically detects user location upon login to provide instant local risk analysis.
-   **Responsive Design:** Fully optimized experience across Desktop, Tablets, and Mobile phones.

---

## 🛠️ Tech Stack

-   **Frontend:** React, TypeScript, Tailwind CSS, Vite
-   **Visualization:** React Globe GL, Three.js, Recharts
-   **Backend:** Python, FastAPI, scikit-learn, XGBoost, Pandas
-   **Data Sources:** NASA FIRMS, Open-Meteo, Natural Earth

---

## 🚀 Getting Started

### Prerequisites
-   Node.js (v18+)
-   Python (3.9+)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/anvesh2257/wildfire.git
    cd wildfire
    ```

2.  **Frontend Setup**
    ```bash
    npm install
    # Create .env file with your NASA Key if needed
    npm run dev
    ```

3.  **Backend Setup**
    ```bash
    # Open a new terminal
    pip install -r requirements.txt
    python backend/main.py
    ```

4.  **Access the App**
    Open `http://localhost:3000` in your browser.

---

## 📸 Screenshots

| Dashboard | AI Chatbot |
|:---:|:---:|
| *(Add your screenshot here)* | *(Add your screenshot here)* |

| Mobile View | Login Screen |
|:---:|:---:|
| *(Add your screenshot here)* | *(Add your screenshot here)* |

---

## 🔒 Security Note
This project uses a lightweight JSON-based user store (`users.json`) for prototyping purposes. For production, please integrate a robust database (PostgreSQL/MongoDB) and proper password hashing.

---

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License
This project is licensed under the MIT License.
