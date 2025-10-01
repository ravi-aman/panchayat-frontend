# Location Feature for Posts

This feature allows users to add location information to their posts, making them more contextual and engaging.

## Features Implemented

### 1. LocationService
- **Current Location Detection**: Uses browser's geolocation API to get user's current location
- **Reverse Geocoding**: Converts coordinates to human-readable location names
- **Location Search**: Basic location search functionality
- **Permission Handling**: Properly manages location permissions

### 2. LocationPicker Component
- **Search Interface**: Users can search for locations by typing
- **Current Location Button**: One-click to use current GPS location
- **Autocomplete**: Shows search suggestions as user types
- **Permission Handling**: Gracefully handles location permission states

### 3. Post Creation Integration
- **Seamless Integration**: Location picker is integrated into the post creation modal
- **Visual Feedback**: Shows selected location with option to remove
- **API Integration**: Location data is sent with post creation requests

### 4. Post Display
- **Location Display**: Posts with location show a location icon and name
- **Clean Formatting**: Locations are displayed in a user-friendly format
- **Responsive Design**: Works well on mobile and desktop

## How to Use

### For Users:

1. **Creating a Post with Location:**
   - Open the post creation modal
   - Use the location picker below the text area
   - Either search for a location or click "Use current location"
   - The selected location will be displayed in blue
   - Create your post and the location will be included

2. **Viewing Posts with Location:**
   - Posts with location will show a map pin icon and location name
   - Location appears below the post content

### For Developers:

1. **LocationService API:**
```typescript
// Get current location
const location = await LocationService.getCurrentLocationWithDetails();

// Search for locations
const results = await LocationService.searchLocations("New York");

// Check if geolocation is available
const isAvailable = LocationService.isGeolocationAvailable();
```

2. **Using LocationPicker:**
```tsx
<LocationPicker
  selectedLocation={selectedLocation}
  onLocationSelect={setSelectedLocation}
  placeholder="Add location..."
  showCurrentLocationButton={true}
/>
```

3. **Post Data Structure:**
Posts with location include this data structure:
```typescript
{
  // ... other post fields
  location: {
    name: "New York City",
    coordinates: [-74.006, 40.7128], // [longitude, latitude]
    address?: "New York, NY, USA",
    city?: "New York",
    state?: "New York",
    country?: "United States"
  }
}
```

## Technical Implementation

### Backend Support
The backend already supports location data through the PostService API:
- Standard posts: `/api/v2/posts/standard`
- Poll posts: `/api/v2/posts/poll`
- Event posts: `/api/v2/posts/event`

All accept a `location` field in the request body.

### Frontend Components
- `LocationService.ts`: Core location functionality
- `LocationPicker.tsx`: Location selection component
- `locationUtils.ts`: Utility functions for formatting
- Updated `createNewPost.tsx`: Integrated location picker
- Updated `standardPost.tsx`: Display locations on posts

### Privacy Considerations
- Location permission is requested explicitly
- Users can choose to search for locations instead of using GPS
- Location data is optional for all posts
- Clear visual indicators when location is being used

## Example Usage

```typescript
// Example location data that gets sent to backend
const postData = {
  content: "Great coffee here!",
  author: "user_id",
  privacy: "public",
  location: {
    name: "Central Park",
    coordinates: [-73.9712, 40.7831],
    city: "New York",
    state: "New York",
    country: "United States"
  }
};
```

## Error Handling

The implementation includes proper error handling for:
- Location permission denied
- GPS unavailable
- Network errors during location search
- Invalid coordinate data
- Geocoding service failures

## Future Enhancements

Potential improvements that could be added:
1. **Google Places Integration**: For better location search results
2. **Location History**: Remember recently used locations
3. **Location-based Feed**: Filter posts by location
4. **Interactive Maps**: Click on locations to view on map
5. **Location Verification**: Verify user is actually at the location
6. **Privacy Controls**: More granular location sharing settings

## Testing

To test the location feature:
1. Create a new post
2. Try the "Use current location" button (grant permission when asked)
3. Try searching for locations by typing in the location picker
4. Create the post and verify location appears
5. View the post to see location display

The feature works both with GPS location and manual location search, providing flexibility for different user preferences and scenarios.