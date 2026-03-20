# Data Seeding Strategy — Google Maps & Public Sources

## The Idea

Solve the cold-start problem by pre-populating the platform with professionals and their public reputations from Google Maps and similar sources.

## What's Available on Google Maps

For each business listing:
- Business name
- Category (electrician, plumber, etc.)
- Address / service area
- Phone number
- Website
- Rating (1-5 stars)
- Number of reviews
- Individual review text, author, date, rating
- Photos (exterior, work photos)
- Business hours
- Google Place ID (unique identifier)

## How to Get the Data

### Option A: Google Places API (Official — Recommended to Start)

- **Places API (New)** allows searching by category + location and retrieving details.
- **Pros:** Legal, reliable, structured data, includes reviews.
- **Cons:** Costs money at scale (~$17 per 1,000 detail requests), rate-limited, only returns up to 5 reviews per place via API.
- **Best for:** Initial seeding of a specific city + category. Very manageable cost for MVP.
- **Estimated cost:** ~1,000 electricians in São Paulo = ~$17 in API calls.

### Option B: Web Scraping (Google Maps Directly)

- Use headless browser (Playwright/Puppeteer) to search Google Maps and extract listings.
- **Pros:** Free, can get all reviews (not just 5), more data.
- **Cons:** Violates Google ToS, IP can get blocked, brittle (layout changes break scraper), legal risk.
- **Not recommended for production** but useful for research/prototyping.

### Option C: Third-Party Data Providers

- Services like Outscraper, SerpAPI, or Bright Data provide Google Maps data as a service.
- **Pros:** Reliable, they handle the scraping, structured output.
- **Cons:** Cost varies, still a ToS gray area but the liability is on them.
- **Good middle ground** for getting bulk data without building scraping infra.

## Recommended Approach

### Phase 1: Validate with Google Places API
1. Pick one category (e.g., electricians) in one city (e.g., São Paulo).
2. Use Places API Nearby Search to find all businesses in that category.
3. For each business, fetch details including the 5 most recent reviews.
4. Store in our database with a flag: `source: "google_maps"`, `claimed: false`.

### Phase 2: Enrich with Third-Party Provider
- Use Outscraper or similar to pull ALL reviews for the businesses we found.
- This gives us deeper review history for the initial trust layer.

### Phase 3: Professional Claiming
- When a professional signs up, they can "claim" their existing profile.
- Verification: call the phone number on file, or verify via Google Business ownership.
- Once claimed, the professional controls the profile and can enrich it.

## Legal Considerations

- **Google reviews are user-generated content.** Displaying them requires attribution and compliance with Google's terms.
- **Safest approach:** Use the official API, display with proper attribution ("Reviews from Google"), and let professionals opt out.
- **Don't present Google reviews as your own.** Always show the source.
- **When a professional claims their profile**, give them the option to import or not import their Google reviews.
- **Privacy:** Phone numbers and addresses from Google are already public, but follow LGPD guidelines for how you store and use them.

## Database Schema Considerations

```
professionals:
  - id
  - name
  - google_place_id (nullable)
  - source (google_maps | manual | claimed)
  - claimed (boolean)
  - claimed_by_user_id (nullable)
  - category
  - location (lat/lng)
  - address
  - phone
  - website
  - google_rating
  - google_review_count
  - platform_rating (nullable, calculated from platform reviews)
  - created_at
  - updated_at

reviews_imported:
  - id
  - professional_id
  - source (google_maps)
  - author_name
  - rating
  - text
  - date
  - source_id (Google review ID if available)

reviews_platform:
  - id
  - professional_id
  - client_id
  - job_id
  - rating
  - text
  - photos
  - created_at
```

## Implementation Priority

1. **Google Places API integration** — search + details for one category/city
2. **Import pipeline** — structured ETL into our database
3. **Display layer** — show imported professionals with Google attribution
4. **Claim flow** — let professionals claim and enrich their profiles
5. **Review enrichment** — pull full review history via third-party provider
