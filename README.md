This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Start the web app and API:

```bash
npm run dev:all
```

The web app is available at [http://localhost:3000](http://localhost:3000). To open it from another device on the same Wi-Fi, find this computer's local IP address and visit `http://<IP-KOMPUTER>:3000` on that device. API requests are proxied by Next.js, so no IP address needs to be added to `.env`.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
## Login session

Each account can have only one active login session. A new login is rejected while the account is in use on another device; the existing session is not replaced. Dashboard activity refreshes the session, and it expires automatically after 10 minutes without activity. Logging out, changing a password, or an administrator resetting access also invalidates the affected session. The API adds session-tracking columns to an existing `operators` table at startup.
