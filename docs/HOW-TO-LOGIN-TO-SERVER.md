# How to log in to your server (beginner guide)

You need to **open a terminal** on your PC and run one command. Your server is at **45.76.31.105**.

---

## Step 1: Get your server password from Vultr

1. Go to **[vultr.com](https://www.vultr.com)** and log in.
2. Click **Products** (or **Servers**) and open your server (the one with Ubuntu).
3. On the server page, find **“Password”** or **“Root password”**.
   - Click **Copy** or **Show** and copy it.
   - If you don’t see it: try **Settings** → **Reset root password**. Vultr will show or email a new password.
4. Keep that password somewhere safe (e.g. a Notepad file). You’ll paste it in the next step.

---

## Step 2: Open a terminal on your PC

**On Windows:**

- Press the **Windows key**, type **PowerShell**, then press Enter.  
  Or type **cmd** and open **Command Prompt** (both work).

You’ll see a window with a blinking cursor.

---

## Step 3: Run the login command

Type this **exactly** (or copy and paste it) and press **Enter**:

```
ssh root@45.76.31.105
```

- The first time you connect, it may ask: **“Are you sure you want to continue connecting (yes/no)?”**  
  Type **yes** and press Enter.

- Then it will ask: **“root@45.76.31.105’s password:”**  
  **Paste** your password (right‑click or Ctrl+V). You won’t see any characters—that’s normal. Press Enter.

---

## Step 4: You’re in

When it works, the line will change to something like:

```
root@your-server-name:~#
```

You’re now **logged in to the server**. Any command you type runs on the server, not on your PC.

- To **log out**, type `exit` and press Enter.

---

## If something goes wrong

| Problem | What to do |
|--------|------------|
| “Connection timed out” or “Could not resolve host” | Check your internet. Check that the IP is correct: `45.76.31.105`. |
| “Permission denied (password)” | Wrong password. Get the password again from Vultr (or reset it) and try again. |
| “Permission denied (publickey)” | The server is set to use an SSH key. Use the same PC where you set up the key, or add your key in Vultr (see Vultr’s SSH key docs). |
| “ssh” is not recognized | On Windows, you can use **Windows Terminal** or enable OpenSSH: Settings → Apps → Optional features → Add “OpenSSH Client”. |

---

**Summary:** Open PowerShell, run `ssh root@45.76.31.105`, type `yes` if asked, then paste your Vultr password when asked.
