# Chamei — Pilot Plan

The platform is live and seeded with Google Maps professionals. This pilot
exists to validate whether the matching loop — client request → curated
1-3 matches → booked job — converts at a rate that justifies expanding
beyond the seed city/category.

## Objective

Get **10 paid jobs completed end-to-end** through Chamei, with both
client and professional active on the platform (not just facilitated via
WhatsApp side-channel).

A "completed job" means: client submitted a request, was matched, the
matched professional accepted, the work was done, and the platform has
a record of the outcome (paid, satisfaction signal captured).

## Why this objective

Ten jobs is the smallest sample that lets us see the matching funnel work
multiple times without leaning on a single anecdote. It forces us to face
every failure mode — bad matches, ghosted leads, professionals who never
respond, clients who churn — in numbers small enough to debug each one
individually.

If 10 jobs land cleanly, the next milestone is 50 and the scaling
questions become real (paid acquisition, expanded categories, second
city). If 10 jobs are hard, the matching model itself needs rethinking
before any growth spend.

## Main Blocker

**Demand-side acquisition.** The platform has supply (seeded
professionals) but no organic client flow. Without a steady trickle of
real client requests, the matching loop can't be tested.

Secondary blockers, in priority order:

1. **Professional activation.** Seeded pros have a profile but no reason
   to check Chamei. When a lead lands, they need to be reachable in a
   channel they already use (WhatsApp) and motivated to respond.
2. **Outcome capture.** No mechanism today to confirm a job was actually
   completed and paid. Without that, the funnel data is fiction.
3. **Trust signals on the client side.** A first-time visitor has no
   reason to choose Chamei over GetNinjas or a WhatsApp group. The
   landing page and matching UX must telegraph "this is different"
   inside the first 30 seconds.

## Immediate Next Move

Run a **single-category, single-neighborhood concierge pilot** for the
next two weeks:

1. Pick one category × one Florianópolis neighborhood where we have ≥20
   seeded professionals (likely electricians or AC technicians).
2. Drive ~50 client requests via paid Instagram/Meta ads targeted at
   that neighborhood. Budget: R$500 cap.
3. Match each request manually (founder-as-algorithm). Notify the
   matched professional via WhatsApp directly, with the client brief and
   a one-tap "Aceitar / Recusar" link.
4. Follow up with both sides after 72h to confirm contact, scheduling,
   completion, and payment. Log every drop-off reason.
5. After 10 completed jobs (or 14 days, whichever first), write the
   retrospective.

Manual matching is intentional. Until we've seen the patterns by hand,
we can't write a matching algorithm worth running.

## Success Signals

Pilot succeeds if, by end of two weeks:

- ≥10 jobs reach "completed + paid" status.
- ≥40% of matched professionals accept the lead within 4h.
- ≥60% of clients who got a match report contact happened.
- At least 3 professionals ask "when can I get more leads like this?"
  unprompted — the strongest demand-side signal we can hope for at this
  stage.

Pilot fails (or pivots) if:

- <5 completed jobs after 14 days at the planned ad spend.
- Professional acceptance rate <20% — means the supply side is not
  really there, despite seeding.
- Client-side feedback indicates the matching quality felt random or
  worse than a Google search.

## What This Pilot Is NOT Trying to Prove

- That the product can scale. It can't, yet — there's a human in the
  loop.
- That paid acquisition is the long-term channel. R$500 is a test
  budget, not a strategy.
- That the current UI is final. UX iteration happens after we know the
  loop converts at all.

## Operational Cadence

- **Daily:** Review new requests, do manual matches, ping pros via
  WhatsApp.
- **Every 3 days:** Update the dashboard `chamei` row — completed jobs,
  acceptance rate, current blocker.
- **End of week 1:** Decide if the pilot is on track or needs an
  intervention.
- **End of week 2:** Retrospective + decision (scale / iterate / pause).
