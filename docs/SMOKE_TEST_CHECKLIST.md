# SafeWord manual smoke test (about 5 minutes)

Run this on a real Android device with a dev client build (Expo Go doesn't
support push, so this needs `eas build --profile development` or similar).
Use two accounts/devices if you can — a "coordinator" and one "family
member" — since several checks need someone on the other end.

1. **Sign in and set up.** Sign in with Google, set your name, add one
   family member, and set a safe word. You should land on Home once the
   member accepts the invite and the word is set.
2. **Home screen.** Confirm you see a readiness card for the family member
   you added, and that it's calm (no red) until something actually needs
   attention.
3. **Change the safe word.** Go to Home → the safe word action → change
   it to a different word, save. This should succeed (previously, changing
   an already-set word always failed with a database error — confirm it
   no longer does). After saving, confirm the "Print a card" option
   appears and produces a share sheet with a PDF.
4. **Mark as told / rotation.** Back on Home, the family member's card
   should now show "needs to be told" (since changing the word resets
   that). Tap "Mark as told" — it should flip to a confirmed state with
   today's date.
5. **Send a practice run.** Tap "Send a practice run" for the family
   member. On the family member's device, a notification should arrive
   within a few seconds. Tap it — it should open the rehearsal screen, not
   the family circle screen.
6. **Notification preferences.** On the family member's device, go to
   Settings → Notification preferences and turn off "Family requests".
   Send another practice run from the coordinator's device — it should
   NOT arrive this time. Turn the preference back on.
7. **Verify script + emergency numbers.** From Home, open "If a call
   feels wrong" and confirm the steps read clearly. Tap through to
   emergency numbers and confirm a number is shown for your country, and
   tapping it opens your phone's dialer.
8. **Call risk alert.** If you have a second Android device with the call-
   screening role granted (Settings → Call protection), place a test call
   to it from an unknown/spoofed-looking number and confirm the risk
   notification appears, and that tapping "alert family" actually results
   in a push arriving on the coordinator's device (previously it only
   logged silently and nothing arrived).

If everything above works, the app is in a shippable state for these
changes. Anything that fails is worth a bug report before shipping wider.
