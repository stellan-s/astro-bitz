# Astro Blitz - Ad Monetization Setup

## Overview
Astro Blitz now has tasteful, non-intrusive ad placements that match the game's aesthetic. All ads are styled with neon cyan glows and semi-transparent backgrounds to blend with the space shooter theme.

## Ad Placements

### 1. Landing Page (landing.html)
- **Top Banner**: Full-width horizontal ad above the main content
- **Left Sidebar**: Vertical ad (desktop only, hidden on mobile)
- **Right Sidebar**: Vertical ad (desktop only, hidden on mobile)
- **In-Content**: Rectangular ad between features and controls
- **Bottom Banner**: Full-width horizontal ad at page bottom

### 2. Gameplay (index.html)
- **Top Banner**: Small horizontal banner above the game canvas
- **Left Sidebar**: Vertical ad (desktop only, visible on screens wider than 1200px)
- **Right Sidebar**: Vertical ad (desktop only, visible on screens wider than 1200px)
- **Bottom Banner**: Horizontal banner below the game canvas

### 3. Game Over Screen
- **Overlay Ad**: Horizontal banner ad that appears at the bottom when the game ends
- Styled with cyan glow border matching the game aesthetic
- Positioned to not interfere with score display

## Design Philosophy

All ads follow these principles:
- **Non-intrusive**: Positioned around gameplay, not blocking it
- **Aesthetic match**: Styled with game colors (cyan/magenta glows)
- **Responsive**: Sidebar ads hidden on mobile, banners adapt to screen size
- **Compliant**: Follows Google AdSense policies for size and placement

## Setup Instructions

### Step 1: Get Google AdSense Publisher ID
1. Sign up at https://www.google.com/adsense
2. Add your website domain
3. Wait for approval (usually 1-2 days)
4. Get your publisher ID (format: ca-pub-XXXXXXXXXXXXXXXX)

### Step 2: Replace Placeholder IDs
Replace all instances of `ca-pub-XXXXXXXXXXXXXXXX` with your actual publisher ID in:
- `landing.html` (line 16 and all ad units)
- `index.html` (line 18 and all ad units)
- `src/game/Game.ts` (line 821)

### Step 3: Create Ad Units in AdSense
Create the following ad units in your AdSense dashboard:

**For landing.html:**
1. Top Banner (horizontal, responsive)
2. Left Sidebar (vertical, 160x600)
3. Right Sidebar (vertical, 160x600)
4. In-Content (rectangle, 300x250 or responsive)
5. Bottom Banner (horizontal, responsive)

**For index.html:**
1. Game Top Banner (horizontal, 728x90 or responsive)
2. Game Left Sidebar (vertical, 160x600)
3. Game Right Sidebar (vertical, 160x600)
4. Game Bottom Banner (horizontal, 728x90 or responsive)
5. Game Over Ad (horizontal, 728x90 or responsive)

### Step 4: Update Ad Slot IDs
Replace the placeholder slot IDs in each file with your actual ad unit IDs:
- `data-ad-slot="1234567890"` - replace with actual slot ID
- Each ad unit needs its unique slot ID from AdSense

## Revenue Expectations

Based on typical web game metrics:
- **CPM**: 1-5 USD per 1000 impressions (varies by region)
- **Expected monthly revenue**: 50-500 USD depending on traffic
- **Factors**: Location of players, ad engagement, traffic volume

To maximize revenue:
1. Focus on getting quality traffic
2. Share the game on social media, game forums
3. Consider SEO optimization for the landing page
4. Monitor AdSense performance and adjust placements if needed

## Removed Features

As requested, all emoji icons have been removed from the game:
- Missile counter now shows "Missiles: X" instead of rocket emoji
- Mobile fire button shows "FIRE" text instead of emoji
- High score message shows "NEW HIGH SCORE!" without trophy emoji

## File Changes Summary

Modified files:
- `landing.html` - Created with full ad integration
- `index.html` - Added AdSense initialization script
- `src/style.css` - Styled all ads with game aesthetic
- `src/game/Game.ts` - Added game-over ad, removed emojis

## Next Steps

1. Get AdSense approval
2. Replace all placeholder IDs
3. Test ads in production
4. Monitor performance in AdSense dashboard
5. Adjust placements based on performance data

## Notes

- Ads follow AdSense policies (no ads too close together, proper labeling)
- Mobile experience prioritized (sidebar ads hidden on small screens)
- Game-over ad uses fixed positioning to overlay on game canvas
- All ads use responsive sizing for better mobile experience
