# Media Booth Sign-Up: Setup

Students sign up to run the media booth at home basketball games. They pick a shift on a GitHub Pages site, and the Google Sheet keeps the list.

## How it fits together

- **The Sheet and its script** ([Code.gs](Code.gs)). Three tabs:
  - **Shifts**: one row per shift, already filled in with the 2026-27 home games from the ICA calendar. A day with three games has two shifts: Shift 1 covers the first two games and Shift 2 the last one. Days with one or two games have a single "All Games" shift.
  - **Sign-Ups**: one row per sign-up. The script writes these.
  - **Settings**: coordinator, arrive time, allowed email endings, grades, test mode.
- **The sign-up page** ([index.html](index.html)) at <https://davidluttrull.github.io/media-booth/>. No sign-in. Students type their name, pick a grade and give their school email.
- **Emails** come from the account that deploys the script:
  - a confirmation when a student signs up, with Add to Google Calendar and a cancel link
  - a reminder at about 3 PM the day before
  - a "game cancelled" notice if you set a shift's Status to Cancelled (sent at the next 3 PM run, or right away from the menu)
  - an email to the coordinator if a student cancels within 24 hours of the shift (change or clear this on Settings)

## 1. Create the Sheet

1. Sign in as the account that should own the list and send the emails.
2. Create a blank Google Sheet named **Media Booth Sign-Up**.
3. Open **Extensions > Apps Script** and rename the project **Media Booth Sign-Up**.
4. Delete what's in `Code.gs` and paste in all of [Code.gs](Code.gs).
5. Open **Project Settings** (the gear) and check that **Time zone** is Eastern Time. Shift times and the 3 PM reminders use it.
6. Click the save icon.

## 2. Run setup once

1. Pick **setup** in the function dropdown and click **Run**.
2. Approve the permissions. At "Google hasn't verified this app", click **Advanced > Go to Media Booth Sign-Up (unsafe) > Allow**. The script asks to edit the Sheet, send email as you and run on a timer.
3. Back in the Sheet, you'll see the **Shifts**, **Sign-Ups** and **Settings** tabs, with 33 shifts on Shifts.

## 3. Fill in Settings

- **Coordinator name**: whoever students should contact. It shows at the bottom of the page and in the emails.
- **Coordinator email**: replies to the emails go here. Setup filled in your address.
- **Allowed email endings**: `indianachristianacademy.org`. An address at a subdomain (like `@students.indianachristianacademy.org`) also passes. If students use a different domain, add it, separated by a comma.
- **Grades**: `7, 8, 9, 10, 11, 12`. These become the grade buttons.
- **Test mode: send all email to**: has your address, so every email goes to you while you test, marked with who it was for. **Clear it to go live.**

## 4. Deploy the script

1. Click **Deploy > New deployment**, the gear next to "Select type", then **Web app**.
2. **Execute as**: Me. **Who has access**: Anyone.
3. Click **Deploy** and copy the **Web app URL** (it ends in `/exec`).
4. Open that URL in a browser. You should see `{"app":"Media Booth Sign-Up","status":"ok"}`.

After any later change to `Code.gs`: **Deploy > Manage deployments > pencil > Version: New version > Deploy**. The URL stays the same.

## 5. Connect the page and publish it

1. Near the bottom of [index.html](index.html), find `const API_URL = '';` and put the `/exec` URL between the quotes.
2. Push this folder to a GitHub repository named **media-booth** and turn on GitHub Pages for the main branch.
3. The page is at <https://davidluttrull.github.io/media-booth/>. If you use a different repository name, change **Sign-up page link** on Settings to match, or the cancel links in emails will point to the wrong place.

## 6. Try it, then go live

1. Sign up for a shift with your own school email. The confirmation comes to you (test mode).
2. Check that the Shifts tab shows your name in the Students column and the page shows the shift as yours.
3. Use the email's **cancel my shift** link to take yourself off.
4. Clear **Test mode** on Settings. Share the page link with students.

## Coordinator portal

The portal is at <https://davidluttrull.github.io/media-booth/admin/>. Most of what's below can be done there instead of in the Sheet.

- **Sign in** with the coordinator code. Get it from the Sheet's **Media Booth > Show Coordinator Code** menu (reload the Sheet once after pasting a new Code.gs so the menu item shows up). The phone or computer remembers the code until you tap **Sign Out**. Eight wrong codes in 15 minutes lock the portal for 15 minutes.
- **Change the code**: in Apps Script, open **Project Settings > Script Properties**, delete `ADMIN_CODE`, then run **Show Coordinator Code** again for a new one. Every signed-in device has to sign in again.
- **Shifts**: every game with each student's full name, grade and email. **Add Student**, **Move** (to an open shift, or **Swap** with the student on a full one), **Remove**, and **Edit** (date, time, games, spots, status, notes). **Add Shift** adds a new one, such as a tournament game once its time is set.
- **Email**: one message to everyone on upcoming shifts, everyone who has signed up this season, or one shift's crew. Each student gets their own copy.
- **Settings**: the same rows as the Settings tab.

Students get an email when you add, move, swap or remove them, cancel their game, or change its date or time. Untick the box in the dialog to skip it for that change. Cancelling a game takes everyone off it either way, so the 3 PM run won't email them later.

## Running it during the season

- **Change a time or opponent**: edit the Shifts row. Use AM or PM in Start (like `5:30 PM`). A time with no AM/PM from 1 to 7 counts as PM.
- **Add a shift** (for example tournament games once times are set): add a row with Date, Opponent, Shift, Games, Start, Spots 1, Status Open. Leave Shift ID blank; the script fills it in. Separate games with a semicolon: `JH Girls 4:30 PM; Varsity Girls 5:45 PM`.
- **Tournaments**: Whirlwind (Nov 20 and 21), the MS Girls Tournament (Jan 16) and the JV Boys Tournament (Jan 30) start as one "Times TBA" shift per day, because the calendar has no game times. Fill in Start and Games once you know them, or split a day into more rows.
- **Cancelled game**: set Status to **Cancelled**. The page shows it crossed out, and anyone signed up gets an email at 3 PM (or use **Media Booth > Send Today's Emails Now**).
- **Hide a shift**: set Status to **Hidden**.
- **Two students on one shift**: set Spots to 2.
- **Put a student on a shift yourself**: have them sign up on the page so they get the emails, or add a Sign-Ups row by hand with Status `Signed Up`, then run **Media Booth > Refresh Students Column**.
- **Take a student off**: change their Sign-Ups row Status to `Cancelled`, then **Refresh Students Column**.

Past shifts drop off the page on their own. Students can sign up for a shift until its first game starts.
