# 💡📊 FinSight  
**Intelligent Financial Modelling Platform**  
*Turning everyday financial data into clear, actionable insights.*

---

## 🚀 Overview  
**FinSight** is a full-stack finance platform that combines expense tracking, AI-driven insights, and Monte Carlo simulations to help users understand and project their financial future.

---

## ✨ Key Features  
- 💳 **Expense Tracking** — manage income, expenses & accounts  
- 📊 **Monte Carlo Simulation** — 10,000-run wealth projections (P10 / P50 / P90)  
- 🤖 **AI Advisor** — rule-based insights on spending, savings & risk  
- 🎯 **Goal Planning** — evaluate life events (car, home, etc.)  
- 📋 **Budgeting** — category limits with real-time feedback  
- 📄 **PDF Reports** — export financial summaries  

---

## 🛠️ Tech Stack  
**Backend:** Java, Spring Boot, Spring Security, JPA, MySQL  
**Frontend:** React, Tailwind CSS, Recharts, Zustand  
**Other:** JWT Auth, Framer Motion, jsPDF  

---

## 🧠 Core Systems  
- **Monte Carlo Engine:** 10,000 parallel simulations  
- **AI Rule Engine:** 15+ modular financial rules  
- **Projection System:** inflation-adjusted forecasting  

---

## 📂 Project Structure  
```text
finsight/
├── finsight-backend/
│   ├── controller/        # REST APIs
│   ├── service/           # Business logic & simulation
│   ├── advisor/           # AI rule engine (15+ rules)
│   ├── model/             # Entities & DTOs
│   ├── repository/        # JPA repositories
│   └── security/          # JWT authentication
│
└── finsight-ui/
    ├── src/
    │   ├── pages/         # Dashboard, Simulation, Advisor
    │   ├── components/    # UI components
    │   ├── api/           # Axios services
    │   └── store/         # Zustand state

```
---

## ⚙️ Getting Started  

```bash
git clone https://github.com/your-username/finsight.git
cd finsight
```

## Backend
```bash
cd finsight-backend
./mvnw spring-boot:run
```

## Frontend
```bash
cd finsight-ui
npm install
npm run dev
```

---

## 🎯 Goal
To provide a powerful yet simple platform for financial tracking, analysis, and future planning.

---

## 👨‍💻 Author
Abdullah Aamir | CS Student | Full-Stack Dev

---

## 📄 License
This project is licensed under the MIT License.
