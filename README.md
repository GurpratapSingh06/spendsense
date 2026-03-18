# SpendSense 

**The ultimate Student Finance OS.** 
SpendSense is a modern, gamified, and AI-powered financial tracking web application built specifically for college students. It helps students track expenses, respect monthly budgets, save for goals, and build good financial habits through AI-driven reality checks and gamification.

---

## 🚀 Features

### 🧠 AI-Powered Insights (powered by Groq)
- **Think Twice (Reality Check):** Impulse buying? The "Think Twice" feature acts as a blunt financial coach. Tell it what you want to buy and how much it costs, and the AI will compare it to your weekly budget, study hours, or tangible items (like home-cooked meals) to give you a reality check.
- **Daily Insights:** Receive exactly one actionable, context-aware financial tip every day based on your current budget, remaining allowance, and spending habits so far this month.

### 🎮 Gamification & Habit Building
- **Streaks:** Maintain a daily expense logging streak to build financial discipline. Reach a 3-day streak to ignite the 🔥 flame!
- **Virtual Plant:** Watch your financial habits bloom. Your virtual plant grows from a Seed (🌰) to a mature Tree (🌳) the longer you maintain your logging streak.

### 📊 Comprehensive Financial Tracking
- **Dashboard:** A unified command center. View recent expenses, unpaid fixed costs, budget warnings, and widget overviews all in one place.
- **Safe to Spend Widget:** Calculates exactly how much you can safely spend *today* by subtracting fixed costs and dividing your remaining budget by the days left in the month.
- **Budgeting Engine:** Set a total monthly allowance, log fixed costs (like rent or subscriptions), and allocate percentage-based limits to specific categories (Food, Transport, Study, Entertainment, Health, Other).
- **Savings Goals:** Set target amounts for specific goals (e.g., "New Laptop") and add savings to them over time.
- **Deep Analytics:** Visualize your spending patterns with line charts (daily trends), doughnut charts (category breakdown), and bar charts (budget vs. actual). **Export your analytics report to PDF** with a single click.

### 🔐 Secure & Modern
- **Authentication:** Powered by Supabase Auth for secure registration, login, and session management.
- **Database:** Fully integrated with Supabase PostgreSQL for high-performance data operations.

---

## 🛠 Tech Stack

**Frontend:**
- [React](https://reactjs.org/) (via Vite)
- [Tailwind CSS](https://tailwindcss.com/) (Styling & Design System)
- [React Router](https://reactrouter.com/) (Routing)
- [Chart.js](https://www.chartjs.org/) (Analytics Visualizations)
- [Lucide React](https://lucide.dev/) (SVG Iconography)
- [html2canvas] & [jsPDF] (PDF Report Generation)

**Backend:**
- [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)
- [Supabase](https://supabase.com/) (PostgreSQL Database & Authentication)
- [Groq SDK](https://groq.com/) (Fast AI Inference API)
- [Express Rate Limit](https://www.npmjs.com/package/express-rate-limit) (API Protection)

---

## ⚙️ Local Development & Setup

### Prerequisites
- Node.js (v18+)
- npm or yarn
- A Supabase Project (Database & Auth)
- A Groq API Key (for AI features)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/spendsense.git
cd spendsense
```

### 2. Backend Setup
1. Navigate to the server folder:
   ```bash
   cd server
   npm install
   ```
2. Create a `.env` file in the `server` directory and configure the following:
   ```env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_KEY=your_supabase_service_role_key
   GROQ_API_KEY=your_groq_api_key
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:5173
   ```
3. **Database Schema:** Open your Supabase Dashboard, go to the SQL Editor, and execute the SQL schema creation scripts required for SpendSense (Users, Expenses, Budgets, Goals, Streaks).
4. **Seed Database (Optional but recommended):**
   ```bash
   npm run seed
   ```
5. Start the backend development server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. Navigate to the client folder (in a new terminal):
   ```bash
   cd client
   npm install
   ```
2. Create a `.env` file in the `client` directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_API_URL=http://localhost:5000/api
   ```
3. Start the frontend development server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:5173` in your browser. If you seeded the database, you can log in with:
   - **Email:** `demo@spendsense.in`
   - **Password:** `demo1234`

---

## 🎨 Design System

SpendSense uses a carefully crafted Tailwind configuration to maintain a modern, clean fintech aesthetic:
- **Primary Text:** `#111827` (Deep Gray)
- **Secondary Text:** `#6B7280` (Muted Gray)
- **Accent Color:** `#F97316` (Vibrant Orange)
- **Background:** `#F9FAFB`
- **Surface:** `#FFFFFF` (with soft shadows for elevation)

## 🤝 Contributing

Contributions are welcome! If you'd like to improve SpendSense:
1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

*Built for students, to make cents of their spending.*
