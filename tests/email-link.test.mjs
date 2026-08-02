import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("the homepage Email link opens a pre-addressed Gmail draft", async () => {
  const homepage = await readFile(
    new URL("../index.html", import.meta.url),
    "utf8",
  );

  const emailLink = [...homepage.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].find(
    ([, , contents]) =>
      contents
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .startsWith("Email"),
  );

  assert.ok(emailLink, "Expected an Email anchor on the homepage");
  assert.match(
    emailLink[1],
    /\bhref=["']https:\/\/mail\.google\.com\/mail\/\?view=cm&amp;fs=1&amp;to=jungho10050%40gmail\.com["']/i,
    "Expected the Email anchor to open a pre-addressed Gmail draft",
  );
  assert.match(
    emailLink[1],
    /\btarget=["']_blank["']/i,
    "Expected the Gmail draft to open in a new tab",
  );
  assert.match(
    emailLink[1],
    /\brel=["'][^"']*noopener[^"']*["']/i,
    "Expected the new-tab link to isolate the opener",
  );
  assert.match(
    emailLink[2],
    /<span\b[^>]*class=["'][^"']*profile-email-address[^"']*["'][^>]*>\s*jungho10050@gmail\.com\s*<\/span>/i,
    "Expected the email address to remain visibly written below the label",
  );
});
