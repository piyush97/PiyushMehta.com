# Weekly metrics review

Goal: replace the "Unknown" baselines in `2026-09-content-and-career-plan.md` with aggregate numbers. Time box: 20 minutes, same weekday each week.

Rules:
- Record aggregates only. Keep raw exports, names, emails, and message text out of this public repo.
- Use the same window each week: last complete 7 days (UTC), plus the 7 days before for comparison.
- Page views, clicks, and inquiries are separate counts. They do not form a funnel.
- Leave a cell blank when a source has no data. Never estimate.

## Checklist

1. **Search Console** (Performance, Search results). Needs `GOOGLE_SITE_VERIFICATION` set at build time and the property verified.
   - Note total clicks and impressions.
   - Note top 5 queries and top 5 pages by clicks.
2. **Cloudflare Web Analytics** (bots excluded, same dates). The beacon is configured outside this repo.
   - Note visits and page views.
   - Note top pages, including `/resume`, `/projects`, `/contact-me`, and blog posts.
   - Note top referrers.
3. **`/stats`** (private, HTTP Basic, password is `STATS_PASSWORD`). Reads Upstash Redis counters from `src/pages/api/conversions.ts` and `src/utils/conversions.ts`.
   - Window is the last 28 UTC days versus the 28 before, not 7. Record the 28-day figure and label it so.
   - Events: `contact_sent` and `chat_question` (server-counted), `resume_download` and `reading_path_click` (browser `sendBeacon` from `[data-conversion]` clicks).
   - Per-post views via `post_view`, once per post per browser session.
   - Counters are anonymous daily totals, expire after 60 days, and are best effort. If `/stats` returns 503, the password is unset or shorter than 32 characters. If counters are empty, check Upstash bindings first.
4. **Newsletter signups.** Read the size of the Upstash Redis set `newsletter:subscribers` (count only; do not copy addresses). Record confirmed signups added since last week.
5. **Manual inquiries.** Count messages received through the contact form and direct email this week. Classify each as relevant role, other, or not relevant. Ask new contacts what brought them here and record the answer as a category.
6. **Notes.** One line per observation. Name what changed (post published, link shared, UTM campaign) next to the number it may explain.

## Weekly log

Copy one row per week. Leave blank until measured.

| Week starting (UTC) | GSC clicks | GSC impressions | GSC top queries | CF visits | CF top pages | CF top referrers | `resume_download` (28d) | `contact_sent` (28d) | `chat_question` (28d) | `reading_path_click` (28d) | Newsletter signups | Inquiries (relevant / total) | Notes |
| ------------------- | ---------- | --------------- | --------------- | --------- | ------------ | ---------------- | ----------------------- | -------------------- | --------------------- | -------------------------- | ------------------ | ---------------------------- | ----- |
|                     |            |                 |                 |           |              |                  |                         |                      |                       |                            |                    |                              |       |
|                     |            |                 |                 |           |              |                  |                         |                      |                       |                            |                    |                              |       |
|                     |            |                 |                 |           |              |                  |                         |                      |                       |                            |                    |                              |       |
|                     |            |                 |                 |           |              |                  |                         |                      |                       |                            |                    |                              |       |
