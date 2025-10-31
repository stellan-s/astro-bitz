# Google AdSense Setup Guide

This game includes Google AdSense integration with discreet ad placements that comply with Google's policies.

## Ad Placement Strategy

The ads are positioned to be visible but non-intrusive:

1. **Top Banner** - Horizontal banner at the top of the page (50-90px height)
2. **Bottom Banner** - Horizontal banner at the bottom of the page (50-90px height)
3. **Left Sidebar** - Vertical ad (160px width, desktop only)
4. **Right Sidebar** - Vertical ad (160px width, desktop only)

### Mobile Optimization
- Sidebar ads are hidden on screens < 1200px width
- Banner heights are reduced on mobile (< 768px) for better UX
- All ads use responsive units that adapt to screen size

## Setup Instructions

### Step 1: Create Google AdSense Account

1. Go to https://www.google.com/adsense/
2. Sign up or sign in with your Google account
3. Add your website URL
4. Wait for approval (can take 24-48 hours)

### Step 2: Get Your Publisher ID and Ad Slots

Once approved:

1. In AdSense dashboard, go to **Ads** → **Overview**
2. Copy your publisher ID (format: `ca-pub-XXXXXXXXXXXXXXXX`)
3. Create 4 ad units:
   - **Top Banner** - Display ads, Responsive, Horizontal
   - **Bottom Banner** - Display ads, Responsive, Horizontal
   - **Left Sidebar** - Display ads, Responsive, Vertical
   - **Right Sidebar** - Display ads, Responsive, Vertical
4. Copy each ad slot ID (10-digit number)

### Step 3: Update the Code

Edit `index.html` and replace all placeholder IDs:

```html
<!-- Replace THIS publisher ID (appears 5 times) -->
ca-pub-XXXXXXXXXXXXXXXX

<!-- Replace ad slot IDs with your actual slot IDs: -->
data-ad-slot="1234567890"  <!-- Top banner -->
data-ad-slot="0987654321"  <!-- Left sidebar -->
data-ad-slot="1122334455"  <!-- Right sidebar -->
data-ad-slot="5544332211"  <!-- Bottom banner -->
```

### Step 4: Deploy to Production

**IMPORTANT:** AdSense ads will NOT work on localhost. You must:

1. Deploy your game to a public domain
2. Add the domain to your AdSense account
3. Wait for Google to verify and approve the site
4. Test ads in production environment

### Step 5: Verify Ads Are Working

1. Open your deployed site
2. Open browser DevTools → Console
3. Check for AdSense initialization messages
4. You may see placeholder ads initially
5. Real ads appear after Google's crawler verifies your site (24-48 hours)

## Google AdSense Policies

To stay compliant with Google's policies:

### ✅ DO:
- Keep ads clearly distinguishable from game content
- Ensure ads don't interfere with gameplay
- Use appropriate ad placements (not blocking content)
- Have sufficient original content on your site
- Follow Google's webmaster quality guidelines

### ❌ DON'T:
- Click your own ads
- Encourage users to click ads
- Place ads over game content
- Use misleading ad labels
- Refresh ads too frequently (auto-refresh)
- Place too many ads (current setup is optimal)

## Testing Without AdSense

Before getting AdSense approval, you can test the layout:

1. The ad containers will show as semi-transparent dark boxes
2. This lets you verify the layout doesn't break
3. The game remains fully playable with ad spaces

## Customization

### Adjust Ad Visibility During Gameplay

In your game code, you can use the AdManager:

```typescript
import { AdManager } from './game/AdManager';

const adManager = AdManager.getInstance();

// Dim ads during intense gameplay
adManager.setAdsVisibility(false);

// Restore ads when paused/game over
adManager.setAdsVisibility(true);
```

### Change Ad Styling

Edit `src/style.css`:

```css
/* Make ad containers more/less visible */
.ad-container {
  background-color: rgba(0, 0, 0, 0.3); /* Adjust opacity */
}

/* Adjust banner heights */
.ad-top, .ad-bottom {
  min-height: 50px;
  max-height: 90px;
}

/* Adjust sidebar widths */
.ad-sidebar {
  width: 160px; /* Standard IAB size */
}
```

### Change Breakpoints

Adjust when sidebar ads appear:

```css
/* Show sidebar ads on larger screens */
@media (min-width: 1200px) {
  .ad-sidebar {
    display: flex;
  }
}
```

## Revenue Optimization Tips

1. **Content Quality**: High-quality games attract better ads and higher CPM
2. **Traffic**: More unique visitors = more ad impressions
3. **Placement**: The current setup balances UX and revenue
4. **Ad Formats**: Responsive ads adapt to best-paying formats
5. **Viewability**: Ads are always visible but non-intrusive

## Troubleshooting

### Ads Not Showing

1. **Check Console Errors**: Open DevTools and look for AdSense errors
2. **Verify IDs**: Ensure publisher ID and slot IDs are correct
3. **Check Domain**: AdSense must approve your domain
4. **Wait for Approval**: New sites need 24-48 hours after setup
5. **Ad Blockers**: Disable ad blockers during testing

### Layout Issues

1. **Canvas Sizing**: The game canvas adapts to available space
2. **Mobile**: Test on actual mobile devices, not just browser resize
3. **Overflow**: Check that body `overflow: hidden` is working

### Policy Violations

If you receive a policy violation notice:

1. Review the specific policy mentioned
2. Check ad placement doesn't violate guidelines
3. Ensure content meets quality standards
4. Remove any prohibited content
5. Request review after fixing issues

## Performance Considerations

The current implementation:

- Loads AdSense script asynchronously (no blocking)
- Initializes ads after game loads
- Uses CSS transitions for smooth visibility changes
- Minimal JavaScript overhead

## Support

- AdSense Help: https://support.google.com/adsense
- AdSense Policies: https://support.google.com/adsense/answer/48182
- Publisher Support: https://support.google.com/adsense/gethelp

---

**Note**: This setup is compliant with Google AdSense policies as of 2025. Always check current policies as they may change.
