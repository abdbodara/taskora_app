# taskora_app

Taskora is a React Native application designed for field technicians to manage tasks assigned by the admin. It supports full offline capability — allowing users to change task statuses and add comments while offline, with auto-sync when back online.


## 🚀 Features

- ✅ View all tasks assigned from the admin.
- 🔁 Update task status (`Pending`, `In Progress`, `Completed`).
- 💬 Add comments to tasks.
- 📴 Full offline support — all actions stored locally and synced when connected.
- 🔐 Secure login for technicians.
- 📆 Sorted task list with due date and priority.
- 🔄 Manual and auto-syncing of offline data.


## 📦 Installation

1. Clone the repository
git clone https://github.com/abdbodara/taskora_app.git
cd taskora_app

2. Install dependencies
npm install

3. Run the app
For Android: npx react-native run-android
For iOS: npx react-native run-ios


## 🔧 Configuration

Update the API base URL according to your actual backend server in:
const BASE_URL = 'https://your-api-url.com'


## 🧪 Testing Offline Mode
- Run the app and login.
- Disable internet.
- Try updating a task status or add comments.
- Enable internet again.
- Observe automatic sync with the server.