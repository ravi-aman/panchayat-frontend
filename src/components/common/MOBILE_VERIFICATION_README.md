# Mobile Verification System

A comprehensive mobile verification system with beautiful UI/UX that ensures all users have verified phone numbers.

## Features

- **Automatic Detection**: Automatically detects users without verified phone numbers
- **Beautiful Modal**: Professional popup with step-by-step verification process
- **Location Integration**: Optionally captures user location after phone verification
- **WhatsApp OTP**: Sends verification codes via WhatsApp using Bailey's
- **Multiple UI Variants**: Banner, card, and inline notification options
- **Real-time Validation**: Phone number availability checking
- **Responsive Design**: Works perfectly on all screen sizes

## Components

### 1. MobileVerificationModal
The main verification popup that guides users through the verification process.

**Steps:**
1. **Phone Entry**: User enters phone number with country code
2. **Location** (Optional): Requests browser location permission
3. **OTP Verification**: 6-digit code sent via WhatsApp
4. **Success**: Confirmation and profile update

### 2. MobileVerificationCard
Compact notification cards that can be placed anywhere in the app.

**Variants:**
- `banner` - Full-width banner at top of page
- `card` - Standalone card component
- `inline` - Compact inline notification

### 3. MobileVerificationWrapper
Automatically shows the modal when users don't have verified phone numbers.

## Implementation

### 1. Basic Setup
The system is automatically active once added to your app. The `MobileVerificationWrapper` in `App.tsx` handles automatic detection.

### 2. Manual Verification Cards
Add verification cards to specific pages:

```tsx
import MobileVerificationCard from './components/common/MobileVerificationCard';

// Banner at top of dashboard
<MobileVerificationCard 
  variant="banner" 
  showDismiss={false}
/>

// Card in feed
<MobileVerificationCard 
  variant="card" 
  showDismiss={true}
  className="mb-6"
/>

// Inline notification
<MobileVerificationCard 
  variant="inline" 
  showDismiss={true}
/>
```

### 3. Programmatic Control
Use the hook for custom implementations:

```tsx
import { useMobileVerification } from '../hooks/useMobileVerification';

const MyComponent = () => {
  const { 
    isPhoneVerified, 
    showVerificationModal,
    verificationStatus 
  } = useMobileVerification();

  if (!isPhoneVerified) {
    return (
      <button onClick={showVerificationModal}>
        Verify Phone Number
      </button>
    );
  }

  return <div>Phone verified! ✓</div>;
};
```

## API Endpoints

The system uses the following backend endpoints:

- `POST /api/v2/mobile-verification/check-availability` - Check if phone number is available
- `POST /api/v2/mobile-verification/send-otp` - Send OTP via WhatsApp
- `POST /api/v2/mobile-verification/verify-otp` - Verify OTP code
- `GET /api/v2/mobile-verification/status` - Get current verification status
- `POST /api/v1/user/edit/{userId}` - Update user profile with phone and location

## User Experience

### For New Users (Google Signup)
1. User signs up with Google
2. After successful signup, modal automatically appears
3. User adds phone number and verifies
4. Location permission requested (optional)
5. Profile updated with verified phone and location

### For Existing Users
1. Verification cards shown in dashboard/feed
2. User can dismiss temporarily or verify immediately
3. Modal appears when user clicks verify
4. Same verification flow as new users

### Security Features
- Phone number availability checking prevents duplicates
- OTP verification via WhatsApp ensures ownership
- Location data helps with security and fraud prevention
- All API calls are authenticated with user tokens

## Customization

### Styling
All components use Tailwind CSS and follow the app's design system:
- Blue/purple gradients for primary actions
- Orange theme for verification prompts
- Consistent spacing and typography
- Smooth animations with Framer Motion

### Behavior
- Modal cannot be closed during success step
- OTP has 60-second resend timer
- Location is optional and can be skipped
- Dismissible cards remember user preference

## Best Practices

1. **Automatic Flow**: Let the wrapper handle most cases automatically
2. **Strategic Placement**: Use cards in high-traffic areas like dashboard
3. **Clear Communication**: Explain why phone verification is needed
4. **Optional Location**: Don't force location sharing
5. **Error Handling**: Provide clear error messages and retry options

This system ensures a smooth, professional verification experience that encourages users to complete their profiles while maintaining excellent UX.