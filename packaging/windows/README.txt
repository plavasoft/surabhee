Andhra Thota agents
=====================

This folder runs both agents on your Windows computer.

Order Agent.exe
  Reads WhatsApp text (Telugu or English), WhatsApp voice (Telugu, English, or Hindi), and SMS.
  A vegetable order is saved once the message has a name, house address, district, and PIN code.

Group Agent.exe
  Business advertisements are allowed only on Thursday.
  The same advertisement cannot be posted again that day.
  Abusive, obscene, and pornographic messages are refused.

Stop Agents.exe
  Stops both agents. Your orders stay in the data folder.

How to start
------------
1. Unzip this folder somewhere you can keep, such as Documents\Andhra Thota.
   Do not run the programs from inside the zip.
2. Double-click "Install shortcuts.bat" if you want icons on the desktop.
3. Double-click Order Agent.exe or Group Agent.exe.
4. If Windows SmartScreen says it protected your PC, choose More info, then Run anyway.
   These files are not signed by a software publisher.
5. The browser opens the desk. The password is rythu-thota.

Your vegetables, orders, and UPI ID are stored in the data folder next to these programs.
Set the farm UPI ID on the Admin page before taking a real payment.

Live WhatsApp, SMS, and voice
-----------------------------
The desks work without an account. To connect your own number, copy andhra-thota.env.example
to andhra-thota.env and fill in the keys, then start the agent again.

WhatsApp must be able to reach this computer. A tunnel such as Cloudflare Tunnel can
publish http://127.0.0.1:43123. Put that public https address in PUBLIC_BASE_URL.
The WhatsApp callback is /api/whatsapp. The SMS callback is /api/sms.

A blocked group message still has to be deleted by a person who is a group admin
in the WhatsApp app. This program cannot delete another member's message.
