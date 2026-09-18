# Telegram Task Reminder Bot

A production-ready Telegram bot that helps you track tasks performed for apps/websites and reminds you after a selected amount of time. Built for Vercel serverless deployment.

## Features

- Task creation with app/website name, country, completion time
- Automatic reminder scheduling
- Snooze, complete, or cancel reminders
- Task history and statistics
- Timezone support (50+ timezones)
- Country selector with 50 countries
- Custom time parsing (18:30, 6:30 PM, etc.)
- Custom reminder duration parsing
- Notes on tasks
- Settings (timezone, time format, notifications)
- Admin panel with broadcast, stats, user management
- Webhook-based architecture (no polling)
- Idempotent update processing
- Serverless-compatible reminder engine
- User data isolation
- Comprehensive error handling

## Architecture

```
Telegram
  ↓
Webhook (/api/telegram/webhook)
  ↓
Vercel Serverless Function
  ↓
Bot Router → Handlers → Services → Database
  ↓
Cron (/api/cron/reminders) → Process Due Reminders → Send Notifications
```

## Folder Structure

```
├── api/
│   ├── telegram/
│   │   └── webhook.ts          # Telegram webhook endpoint
│   ├── cron/
│   │   └── reminders.ts        # Cron job for processing reminders
│   ├── health.ts               # Health check endpoint
│   ├── status.ts               # Bot status endpoint (admin)
│   └── setup/
│       └── webhook.ts          # Webhook registration endpoint
│
├── src/
│   ├── config.ts               # Central configuration (credentials)
│   ├── types.ts                # TypeScript interfaces
│   ├── bot/
│   │   ├── router.ts           # Update routing
│   │   ├── handlers/
│   │   │   ├── commandHandler.ts   # /command handling
│   │   │   ├── callbackHandler.ts  # Inline keyboard callbacks
│   │   │   └── messageHandler.ts   # Text message handling
│   │   ├── keyboards.ts        # Inline keyboard builders
│   │   └── messages.ts         # Message templates
│   │
│   ├── services/
│   │   ├── taskService.ts      # Task CRUD and business logic
│   │   └── reminderService.ts  # Reminder processing
│   │
│   ├── database/
│   │   ├── client.ts           # Database connection
│   │   ├── schema.ts           # Database schema
│   │   └── repositories/
│   │       ├── userRepository.ts
│   │       ├── taskRepository.ts
│   │       ├── reminderRepository.ts
│   │       ├── conversationRepository.ts
│   │       └── processedUpdateRepository.ts
│   │
│   ├── lib/
│   │   ├── telegram.ts         # Telegram API client
│   │   ├── time.ts             # Time/date utilities
│   │   ├── validation.ts       # Input validation
│   │   └── logger.ts           # Structured logging
│   │
│   └── data/
│       └── countries.ts        # Country dataset
│
├── vercel.json                 # Vercel configuration + cron
├── package.json
├── tsconfig.json
└── README.md
```

## Database Setup

### Option 1: Neon (Recommended - Free Tier)

1. Go to [neon.tech](https://neon.tech)
2. Create a free account
3. Create a new project
4. Copy the connection string
5. Open `src/config.ts` and replace `DATABASE_URL`

### Option 2: Any PostgreSQL Provider

The bot uses standard PostgreSQL. Any compatible provider works:
- Supabase
- Vercel Postgres
- Railway
- Aiven
- etc.

### Database Tables

The bot creates these tables automatically on first run:
- `users` - Bot users
- `tasks` - User tasks
- `reminders` - Scheduled reminders
- `broadcast_logs` - Admin broadcast history
- `processed_updates` - Webhook idempotency
- `conversation_states` - Conversation state persistence

## Telegram Setup

### 1. Create Bot with BotFather

1. Open Telegram and search for `@BotFather`
2. Send `/newbot`
3. Choose a name (e.g., "Task Reminder Bot")
4. Choose a username (e.g., `my_task_reminder_bot`)
5. Copy the bot token

### 2. Configure the Bot

Open `src/config.ts` and replace:

```typescript
TELEGRAM_BOT_TOKEN: "PASTE_YOUR_BOT_TOKEN_HERE",
```

with your actual token:

```typescript
TELEGRAM_BOT_TOKEN: "123456789:ABCdefGHIjklMNOpqrSTUvwxYZ",
```

### 3. Get Your Admin Telegram ID

1. Search for `@userinfobot` on Telegram
2. Send any message
3. Copy your user ID
4. Replace in `src/config.ts`:

```typescript
ADMIN_TELEGRAM_ID: 0, // Replace with your ID
```

### 4. Set Webhook Secret

Replace `WEBHOOK_SECRET` with a random string:

```typescript
WEBHOOK_SECRET: "CHANGE_THIS_SECRET",
```

Generate one with: `openssl rand -hex 32`

## Vercel Deployment

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

### 2. Deploy

```bash
vercel --prod
```

### 3. Update Domain

After deployment, Vercel gives you a domain like:
`your-project.vercel.app`

Update `src/config.ts`:

```typescript
VERCEL_DOMAIN: "your-project.vercel.app",
```

### 4. Register Telegram Webhook

Visit:
```
https://your-project.vercel.app/api/setup/webhook?secret=YOUR_WEBHOOK_SECRET
```

Or use the Vercel CLI:
```bash
curl -X POST "https://your-project.vercel.app/api/setup/webhook" \
  -H "Authorization: Bearer YOUR_WEBHOOK_SECRET"
```

### 5. Verify Webhook

Visit:
```
https://your-project.vercel.app/api/status?secret=YOUR_WEBHOOK_SECRET
```

## Cron Setup

Vercel Cron Jobs are configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/reminders",
      "schedule": "*/3 * * * *"
    }
  ]
}
```

This runs every 3 minutes. Vercel automatically invokes this endpoint.

**Note:** Vercel Cron is available on Pro plans. On Hobby plans, reminders are checked when users interact with the bot.

## Testing

1. Open Telegram and search for your bot
2. Send `/start`
3. Tap "🚀 Add Task"
4. Enter an app name (e.g., "Google Maps")
5. Select a country
6. Choose completion time
7. Set reminder duration
8. Add optional note
9. Confirm

## Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Start the bot and show welcome message |
| `/menu` | Show main menu |
| `/add` | Add a new task |
| `/tasks` | View active tasks |
| `/reminders` | View active reminders |
| `/history` | View completed tasks |
| `/stats` | View statistics |
| `/settings` | Open settings |
| `/help` | Show help |
| `/cancel` | Cancel current action |
| `/admin` | Admin panel (admin only) |

## Security Notes

- Credentials are stored in `src/config.ts` - **keep your repository PRIVATE**
- Webhook secret validation prevents unauthorized requests
- Cron endpoint requires authentication
- User data isolation ensures users can only see their own tasks
- Admin functionality is restricted to configured admin ID
- No eval(), no shell execution, no arbitrary code execution
- Input validation on all user inputs
- Idempotent webhook processing prevents duplicate actions

## Customization

### Adding New Countries

Edit `src/data/countries.ts` and add entries to the `countries` array:

```typescript
{ name: "Country Name", code: "XX", flag: "🏳️", timezone: "Timezone/Name" }
```

### Adding New Reminder Options

Edit `src/bot/keyboards.ts` and add entries to `reminderOptions()`:

```typescript
[{ text: "⏰ 4 Hours", callback_data: "remind:240" }],
```

### Changing Default Timezone

Edit `src/config.ts` or modify the default in `userRepository.ts`.

### Changing Admin

1. Get the new admin's Telegram user ID
2. Update `ADMIN_TELEGRAM_ID` in `src/config.ts`
3. Redeploy

## Troubleshooting

### Bot not responding

1. Check webhook is set: visit `/api/status`
2. Check bot token is correct in `src/config.ts`
3. Check Vercel function logs

### Reminders not sending

1. Check cron is configured in `vercel.json`
2. Check Vercel cron logs
3. Manually test: `GET /api/cron/reminders?secret=YOUR_SECRET`

### Database errors

1. Verify `DATABASE_URL` is correct
2. Check Neon/PostgreSQL is accessible
3. Check Vercel environment has network access

### "Unauthorized" errors

1. Verify webhook secret matches
2. Check `WEBHOOK_SECRET` in `src/config.ts`

## License

MIT
