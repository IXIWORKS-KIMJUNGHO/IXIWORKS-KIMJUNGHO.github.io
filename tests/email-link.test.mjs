import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { bindEmailAction } from "../assets/email-action.js";

test("the homepage Email link opens an email draft", async () => {
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
    /\bhref=["']mailto:[^"']+["']/i,
    "Expected the Email anchor to use an actionable mailto: URL",
  );
  assert.match(
    emailLink[1],
    /\bdata-email-action\b/i,
    "Expected the Email anchor to opt into visible click feedback",
  );
});

test("clicking Email copies the address without blocking mailto", async () => {
  let clickHandler;
  let copiedText;
  let resetFeedback;
  const label = { textContent: "Email" };
  const status = { textContent: "" };
  const link = {
    dataset: {
      email: "jungho10050@gmail.com",
    },
    addEventListener(type, handler) {
      assert.equal(type, "click");
      clickHandler = handler;
    },
    querySelector(selector) {
      assert.equal(selector, "[data-email-label]");
      return label;
    },
  };

  bindEmailAction(link, {
    status,
    writeText: async (value) => {
      copiedText = value;
    },
    schedule: (callback) => {
      resetFeedback = callback;
      return 1;
    },
    cancelSchedule: () => {},
  });

  const event = {
    defaultPrevented: false,
    preventDefault() {
      this.defaultPrevented = true;
    },
  };
  clickHandler(event);
  await Promise.resolve();
  await Promise.resolve();

  assert.equal(copiedText, "jungho10050@gmail.com");
  assert.equal(event.defaultPrevented, false);
  assert.equal(link.dataset.copyState, "copied");
  assert.equal(label.textContent, "Email copied");
  assert.equal(
    status.textContent,
    "jungho10050@gmail.com copied to clipboard.",
  );

  resetFeedback();
  assert.equal(link.dataset.copyState, undefined);
  assert.equal(label.textContent, "Email");
  assert.equal(status.textContent, "");
});
