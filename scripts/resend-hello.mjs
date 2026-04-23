/**
 * One-off test: sends the Resend "Hello World" sample email.
 * Usage: npm run resend:hello
 * Requires .env.local with RESEND_API_KEY=re_your_key_here
 */
import dotenv from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Resend } from "resend";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "..", ".env.local") });

const key = process.env.RESEND_API_KEY;
if (!key) {
  console.error(
    "Missing RESEND_API_KEY. Add to .env.local:\n  RESEND_API_KEY=re_xxxxxxxxx\n(replace re_xxxxxxxxx with your key from https://resend.com/api-keys)"
  );
  process.exit(1);
}

const resend = new Resend(key);

const { data, error } = await resend.emails.send({
  from: "onboarding@resend.dev",
  to: "danemo-resend.front027@passmail.net",
  subject: "Hello World",
  html: "<p>Congrats on sending your <strong>first email</strong>!</p>",
});

if (error) {
  console.error(error);
  process.exit(1);
}

console.log("Sent:", data);
