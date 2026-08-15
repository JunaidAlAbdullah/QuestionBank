# Question Bank — Beginner's Guide (Start Here)

This guide assumes you have **never run a project like this before**. It explains
what everything is, why you need it, and exactly what to click/type, step by step,
on Windows, using your project folder `D:\question-bank`.

Take it slow — you only have to do this setup once. After that, running the
project every day takes 30 seconds.

---

## 1. What is this project, really?

Question Bank is a website. Like every website that has logins and lets people
upload things, it's actually **three separate pieces working together**:

| Piece | What it is | Where it lives in your folder |
|---|---|---|
| 1. **Database** | Where all the data is stored (users, questions, courses...) | Not a folder — it's a program called MySQL running on your PC |
| 2. **Backend** | The "engine." Handles logins, saves questions, talks to the database | `D:\question-bank\backend` |
| 3. **Frontend** | The actual website you see and click around in, in your browser | `D:\question-bank\frontend` |

**You need all three running at the same time** for the website to work. Think of
it like a car: the database is the fuel tank, the backend is the engine, and the
frontend is the dashboard you actually interact with.

You will end up with **2 black command windows open** while you use/test the
site — one running the engine (backend), one running the website files
(frontend). That's normal. Don't close them while you're working on it.

---

## 2. Install the tools you need (one-time setup)

You need two programs installed on your computer. If you already have them,
skip to the version-check step.

### 2.1 Install Node.js

Node.js is what runs the backend (the "engine").

1. Go to **https://nodejs.org**
2. Download the **LTS** version (the button that says "Recommended for most users").
3. Run the installer, click Next through everything (defaults are fine), finish.
4. Restart your computer if it asks you to.

**Check it worked:** Open **Command Prompt** (press `Win` key, type `cmd`, hit Enter),
then type:
```
node -v
npm -v
```
You should see version numbers like `v20.11.0` and `10.2.4`. If you see
"not recognized", Node didn't install correctly — reinstall it.

### 2.2 Install MySQL

MySQL is the database (where data is stored).

1. Go to **https://dev.mysql.com/downloads/installer/**
2. Download **"MySQL Installer for Windows"** (the bigger one, not the "web" one, so it works offline).
3. Run it. Choose **"Developer Default"** setup type. Click Next/Execute through the installs.
4. When it asks you to set a **root password**, type a password you'll remember
   (e.g. `mypassword123`) and **write it down somewhere**. You'll need it in Step 3.
5. Keep clicking Next/Finish until it's done. It also installs **MySQL Workbench**,
   a program with a visual interface — you'll use it in a moment.

---

## 3. Set up the database

This creates the actual tables (users, questions, courses, etc.) inside MySQL.

1. Open **MySQL Workbench** (search for it in the Start menu).
2. It should show a connection called "Local instance MySQL..." — double-click it.
3. Type the root password you set in Step 2.2 and connect.
4. You'll see a big empty text area (the "query editor"). This is where you run SQL commands.
5. Click **File → Open SQL Script...**, and open this file:
   ```
   D:\question-bank\backend\db\schema.sql
   ```
6. Once it's loaded into the editor, click the **lightning bolt icon ⚡** (or press `Ctrl+Shift+Enter`) to run the whole script.
   You should see "Action Output" at the bottom with green checkmarks — this means the tables were created.
7. Repeat the same thing for the sample data (optional but recommended so the site isn't empty):
   **File → Open SQL Script...** → open
   ```
   D:\question-bank\backend\db\seed.sql
   ```
   and run it the same way (⚡ icon).

That's it — your database now exists and has a few sample courses/faculties in it.

---

## 4. Configure the backend's secret settings

The backend needs to know your MySQL password and a few other settings. These
live in a file called `.env` (this file is intentionally **not** included by
default, so you have to create it).

1. Open the folder `D:\question-bank\backend` in File Explorer.
2. Find the file named `.env.example`.
3. **Copy** it and **paste** it in the same folder, then **rename the copy** to exactly:
   ```
   .env
   ```
   (If Windows hides file extensions and won't let you remove `.txt`, turn on
   "File name extensions" under the View tab in File Explorer first.)
4. Open `.env` with Notepad (right-click → Open with → Notepad).
5. Find this line:
   ```
   DB_PASSWORD=your_mysql_password
   ```
   Replace `your_mysql_password` with the actual MySQL root password you set in Step 2.2.
6. Also set a random secret on this line (any long random text works, mash your keyboard):
   ```
   JWT_SECRET=replace_this_with_a_long_random_string
   ```
7. Save the file (Ctrl+S) and close Notepad.

You only have to do this once — you won't need to touch `.env` again unless
your MySQL password changes.

---

## 5. Run the backend (the "engine")

1. Open **Command Prompt**.
2. Navigate into the backend folder by typing:
   ```
   cd /d D:\question-bank\backend
   ```
3. The first time only, install the backend's dependencies (this downloads
   the code libraries it needs — takes a minute):
   ```
   npm install
   ```
4. Start the backend:
   ```
   npm start
   ```
5. You should see something like:
   ```
   [server] Question Bank API listening on port 5000
   [db] Connected to MySQL database: question_bank
   ```
   If you see `[db] Connected to MySQL database`, everything is working. 🎉

**Leave this Command Prompt window open.** If you close it, the backend stops
and the website will stop working. Minimize it instead.

> If instead you see `[db] Failed to connect to MySQL`, your password in `.env`
> is probably wrong — go back to Step 4 and double check it, then re-run `npm start`.

---

## 6. Run the frontend (the actual website)

This needs its **own separate** Command Prompt window (keep the backend one running).

1. Open a **new** Command Prompt window (don't close the first one).
2. Navigate into the frontend folder:
   ```
   cd /d D:\question-bank\frontend
   ```
3. Run this command to start a simple web server for the website files:
   ```
   npx serve -l 8080 .
   ```
   The first time, it may ask "Ok to proceed? (y)" — type `y` and press Enter.
4. You should see something like:
   ```
   ┌───────────────────────────────────────┐
   │   Serving!                             │
   │   Local: http://localhost:8080         │
   └───────────────────────────────────────┘
   ```

**Leave this window open too.** Now both pieces are running.

---

## 7. Open the website

Open your browser (Chrome, Edge, etc.) and go to:

```
http://localhost:8080
```

You should see the Question Bank homepage. Try it out:

1. Click **Register**, create an account (student ID must look like `2024-3-60-082`).
2. Click **Upload**, add a sample question.
3. Click **Browse**, search for it.
4. Click on it to see the details page, try bookmarking it or sending a "blessing."

If all of that works, your full setup is working correctly end to end.

---

## 8. Every time you want to work on it again (after today)

You don't need to repeat Steps 2–4 again — those were one-time installs. Each time you sit down to use the project:

1. Open Command Prompt → `cd /d D:\question-bank\backend` → `npm start`
2. Open a second Command Prompt → `cd /d D:\question-bank\frontend` → `npx serve -l 8080 .`
3. Go to `http://localhost:8080` in your browser.

To stop everything, just close both Command Prompt windows (or press `Ctrl+C` in each, then confirm).

---

## 9. Common problems

**"npm is not recognized as an internal or external command"**
Node.js isn't installed correctly, or you need to restart your computer after installing it. Redo Step 2.1.

**"[db] Failed to connect to MySQL"**
- Make sure MySQL is actually running (search "Services" in the Start menu, look for a service called `MySQL80` or similar, make sure it says "Running").
- Double-check the password in `backend\.env` matches your MySQL root password exactly.

**The browser shows "Could not reach the server" when you try to register/login**
- Make sure the backend Command Prompt window (Step 5) is still open and says "listening on port 5000."
- Make sure you're visiting `http://localhost:8080` and not some other port.

**Port already in use / "address already in use :::5000"**
Something else is already using that port, or the backend is already running in another window. Close the extra window, or restart your computer if it's stuck.

**I closed one of the Command Prompt windows by accident**
No damage done — just redo the relevant step from Section 8 to start it again.

---

## 10. Where things are, in plain terms

```
D:\question-bank\
├── backend\          ← the "engine" (Node.js + Express + MySQL code)
│   ├── .env           ← your private passwords/settings (you created this)
│   ├── .env.example    ← a template/example of the settings file above
│   └── db\
│       ├── schema.sql   ← creates the database tables (Step 3)
│       └── seed.sql      ← adds sample courses/faculties (Step 3, optional)
└── frontend\         ← the actual website (HTML/CSS/JavaScript files)
```

For a more technical rundown of the API, folder structure, and deployment
instructions (for when you're ready to put this on the internet instead of
just running it on your own PC), see `DEVELOPER_NOTES.md` in this same folder.
