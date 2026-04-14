# PlanIt

PlanIt is a sleek, minimalist plan tracking application designed for personal productivity. It helps you stay focused on your goals by organizing tasks into short, medium, and long-term horizons within a clean, distraction-free environment.

## 🚀 Key Features

- **Strategic Planning**: Categorize your productivity into three distinct scopes:
  - **Short-term**: Instant tasks and daily goals.
  - **Medium-term**: Weekly or monthly projects.
  - **Long-term**: Big-picture vision and life goals.
- **Secure Code-Based Access**: No complex registration required. Access your personal data using a unique 8-character "Security Code".
- **Real-time Persistence**: Built on FastAPI and Redis for lightning-fast data retrieval and reliable storage.
- **Responsive UI**: A modern interface that works perfectly across desktops, tablets, and smartphones.
- **Privacy First**: Self-hosted architecture ensures you remain in full control of your planning data.

## 📝 How to Use

1. **Access the App**: Navigate to [https://zhdxlz.top/planit](https://zhdxlz.top/planit) in your browser.
2. **First Time Setup**:
   - Leave the "Code" field blank and click **Login/Create**.
   - The system will generate a unique 8-character security code for you.
   - **Important**: Save this code! It is your only key to retrieve your data across different devices.
3. **Manage Plans**:
   - Select the **Term** (Short, Medium, or Long).
   - Enter your plan name and details.
   - Set start/end times to track your timeline.
4. **Track Progress**:
   - View your dashboard categorized by terms.
   - Mark tasks as completed or add reviews to finished plans to reflect on your progress.

## ⚙️ Configuration

To set up your own instance:

1. **Install Dependencies**: `pip install -r requirements.txt`
2. **Redis Config**: Modify `redis_conf.json` according to your own redis configuration.
3. **Start Server**: `python main.py` (Uses Redis DB index 9 by default).
