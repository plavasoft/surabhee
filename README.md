# Andhra Thota

A stall for organically grown vegetables in Andhra Pradesh. Shoppers see each vegetable in Telugu, the spoken name, and English, leave a mobile number and delivery address, and pay the farm with UPI. The admin desk updates price, quantity, and the list.

## Run it

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123).

The admin desk is at [http://127.0.0.1:43123/admin](http://127.0.0.1:43123/admin). The starter password is `rythu-thota`.

## Take a real UPI payment

1. Sign in to the admin desk.
2. Save the farm’s own UPI ID (the one from GPay, PhonePe, Paytm, or the bank app) and the name that should appear in the payer’s app.
3. A shopper places an order with their name, mobile number, address, district, and PIN code.
4. The pay screen shows a UPI QR, the UPI ID, and the exact amount. They pay in their own app. This site never asks for a UPI PIN.
5. They paste the 12-digit UPI reference. You match that credit in your UPI app, then mark the order confirmed.

Set these before anyone else can open the desk:

- `ADMIN_PASSWORD` — replaces `rythu-thota`
- `ADMIN_SECRET` — signs the admin session cookie

Prices, stock, orders, and the UPI ID are stored in `data/store.json` on the server. That folder is created the first time the stall is opened.

## What is on the stall

| Spoken name | Telugu | English | Sold as |
| --- | --- | --- | --- |
| Benda kaya | బెండకాయ | Okra | kg |
| Donda kaya | దొండకాయ | Ivy gourd | kg |
| Vankaya | వంకాయ | Brinjal | kg |
| Chikkudu kaya | చిక్కుడుకాయ | Broad beans | kg |
| Kothi mera | కొత్తిమీర | Coriander | bunch |
| Thota kura | తోటకూర | Amaranth | bunch |
| Gongura | గోంగూర | Roselle leaves | bunch |
| Mirapa kayalu | మిరపకాయలు | Green chillies | kg |
| Sora kaya | సొరకాయ | Bottle gourd | kg |
| Potla kaya | పొట్లకాయ | Snake gourd | kg |
| Beera kaya | బీరకాయ | Ridge gourd | kg |

Sample prices and quantities are a starting board. Change them from the admin desk. Add or remove vegetables there too. Kilograms sell in half-kilo steps. Bunches sell whole.

## Message agent

The message desk is at [http://127.0.0.1:43123/inbox](http://127.0.0.1:43123/inbox). It uses the same farm-desk password. Paste a WhatsApp text, a voice transcript, or an SMS. Telugu and English text, and Telugu, English, or Hindi speech, are read for vegetable orders.

A message becomes an order when it names a stall vegetable and a quantity, plus the person’s name, house address, Andhra Pradesh district, and PIN code. Until those are all present, the phone number keeps a draft and the reply asks for what is missing. The order then shows on the admin desk as WhatsApp or SMS, with stock held the same way as a stall checkout. The reply includes the UPI link.

Try the sample buttons on the desk. A price question such as “gongura entha” answers with the price and does not open an order.

Live WhatsApp (Cloud API) and SMS (Twilio) call these routes. Leave the secrets empty to use the desk on its own.

- `WHATSAPP_TOKEN` — send replies and download voice notes
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_VERIFY_TOKEN` — must match the hub verify token; the check URL is `/api/whatsapp`
- `WHATSAPP_APP_SECRET` — when set, webhook posts must carry `X-Hub-Signature-256`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` — send SMS replies
- `PUBLIC_BASE_URL` — public `https` origin Twilio signs, for example `https://farm.example`
- `SMS_SHARED_SECRET` — required header `x-andhra-secret` on JSON posts to `/api/sms` once you set it
- `OPENAI_API_KEY` — transcribe voice notes and read messy orders the stall list did not match. Without it, paste the voice transcript on the desk, or ask the sender to type
- `OPENAI_MODEL` — optional, defaults to `gpt-4o-mini`
- `OPENAI_TRANSCRIBE_MODEL` — optional, defaults to `whisper-1`

Point the WhatsApp callback at `/api/whatsapp` and the Twilio messaging webhook at `/api/sms`.

## Install both agents on Windows

`AndhraThota-Agents-Windows.zip` is a folder you can unzip and run. It contains:

- `Order Agent.exe` — WhatsApp and SMS vegetable orders
- `Group Agent.exe` — Thursday advertisements, no same-day repeat, no abusive messages
- `Stop Agents.exe` — stops both
- `Install shortcuts.bat` — puts the two agents on the desktop

Unzip it under Documents (not inside the zip window), then double-click an agent. The desk password is `rythu-thota`. Orders are kept in the `data` folder next to the programs. If Windows SmartScreen appears, choose More info, then Run anyway.

To build that zip from this repo, on a machine with Node and Go:

```bash
bash packaging/build-release.sh
```

The zip is written to `release/` and, in this environment, also copied out as a downloadable file. Copy `andhra-thota.env.example` to `andhra-thota.env` before connecting a real WhatsApp number or SMS account.

## Group agent

The group desk is at [http://127.0.0.1:43123/group](http://127.0.0.1:43123/group). It judges each message in Asia/Kolkata:

1. Business advertisements are allowed only on Thursday.
2. The same advertisement, or a second advertisement from the same member, cannot go up again that day.
3. Abusive, obscene, and pornographic text is refused on every day.

Ordinary chat gets no reply. A broken rule produces a warning you can send back. WhatsApp does not let a business number delete another member’s group message, so a person with group admin rights in the WhatsApp app still has to remove a blocked post. The desk says that plainly. Thursday can be rehearsed from the checkbox; a rehearsal is kept apart from the live day’s advertisement list.

`GROUP_WEBHOOK_SECRET` lets another system post to `/api/group` with the header `x-andhra-secret`. Without that secret, the desk sign-in is required. If a WhatsApp payload includes `group_id`, `/api/whatsapp` judges it with these same rules and, when a token is set, sends the warning to the sender.
