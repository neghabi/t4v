import pg from "pg";
import { setTimeout as delay } from "node:timers/promises";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  options: "-c timezone=UTC",
  max: 2,
});
let running = true;
process.on("SIGINT", () => {
  running = false;
});
process.on("SIGTERM", () => {
  running = false;
});
let lastCleanup = 0;
while (running) {
  try {
    await pool.query(`WITH picked AS (
      SELECT * FROM click_events WHERE available_at <= NOW() ORDER BY available_at LIMIT 100 FOR UPDATE SKIP LOCKED
    ), inserted AS (
      INSERT INTO link_clicks (link_code, clicked_at, referer, user_agent, ip_hash, event_id)
      SELECT link_code, clicked_at, referer, user_agent, ip_hash, id FROM picked
      ON CONFLICT (event_id) DO NOTHING RETURNING link_code
    ), counts AS (SELECT link_code, COUNT(*)::int AS n FROM inserted GROUP BY link_code), bumped AS (
      UPDATE short_links s SET click_count=s.click_count+counts.n FROM counts WHERE s.code=counts.link_code RETURNING s.code
    ) DELETE FROM click_events WHERE id IN (SELECT id FROM picked)`);
    if (Date.now() - lastCleanup > 3_600_000) {
      await pool.query(
        "DELETE FROM rate_limits WHERE reset_at < NOW() - interval '1 day'",
      );
      await pool.query(
        "DELETE FROM auth_action_tokens WHERE expires_at < NOW()",
      );
      await pool.query(
        "DELETE FROM link_clicks WHERE clicked_at < NOW() - interval '90 days'",
      );
      lastCleanup = Date.now();
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        service: "analytics-worker",
        message: error.message,
      }),
    );
    await delay(4000);
  }
  if (running) await delay(500);
}
await pool.end();
