# Workflows

## Booking & Payment Flow

The core business workflow from client discovery to completed appointment.

```mermaid
sequenceDiagram
    participant Customer
    participant BookingModal
    participant API as /api/create-payment-intent
    participant Stripe
    participant Webhook as /api/webhook
    participant DB as Supabase DB

    Customer->>BookingModal: Select service
    BookingModal->>DB: Fetch barber availability
    BookingModal->>DB: Fetch existing appointments
    BookingModal-->>Customer: Show available time slots

    Customer->>BookingModal: Select date & time
    BookingModal->>API: POST {amount, barberId, serviceId, ...}
    API->>DB: Fetch barber's stripe_account_id
    API->>Stripe: Create PaymentIntent (destination charge)
    Stripe-->>API: clientSecret
    API-->>BookingModal: clientSecret

    Customer->>BookingModal: Enter card details
    BookingModal->>Stripe: confirmCardPayment(clientSecret)
    Stripe-->>BookingModal: Payment succeeded

    par Client-side appointment creation
        BookingModal->>API: POST /api/create-appointment
        API->>DB: INSERT into appointments
    and Webhook backup
        Stripe->>Webhook: payment_intent.succeeded
        Webhook->>DB: INSERT into appointments (dedup check)
    end

    BookingModal-->>Customer: Redirect to /payment-success
```

## User Registration Flow

```mermaid
flowchart TD
    A[User visits /signup] --> B[Enter email + password + role]
    B --> C[Supabase signUp]
    C --> D{Email confirmed?}
    D -->|Auto-confirm| E[Redirect to /complete-profile]
    D -->|Needs confirmation| F[Check email]
    F --> E
    E --> G[Enter username, bio, location, profile picture]
    G --> H[Save to profiles table]
    H --> I[Redirect to home]
```

## Barber Onboarding Flow

```mermaid
flowchart TD
    A[Barber signs up with role=barber] --> B[Complete profile]
    B --> C[Account page]
    C --> D[Set up services]
    C --> E[Set availability]
    C --> F[Click 'Set up Stripe']

    F --> G[POST /api/stripe-connect/onboard]
    G --> H[Stripe creates connected account]
    H --> I[stripe_account_id saved to profiles]
    I --> J[Redirect to Stripe hosted onboarding]
    J --> K[Barber completes Stripe KYC]
    K --> L[Redirect to /stripe/return]
    L --> M[Barber can now accept payments]

    D --> N[Barber portfolio ready]
    E --> N
    M --> N
```

## Time Slot Calculation

```mermaid
flowchart TD
    A[Customer selects date] --> B[Get day_of_week from date]
    B --> C[Query barber's availability for that day]
    C --> D{Availability exists?}
    D -->|No| E[No slots available]
    D -->|Yes| F[Get start_time and end_time]
    F --> G[Generate slots at service duration intervals]
    G --> H[Fetch existing appointments for that date]
    H --> I[Filter out occupied slots]
    I --> J[Filter out past times if date is today]
    J --> K[Display available slots]
```

## Portfolio Upload Flow

```mermaid
sequenceDiagram
    participant Barber
    participant PortfolioUpload
    participant Storage as Supabase Storage
    participant DB as Supabase DB

    Barber->>PortfolioUpload: Select files (photos/videos)
    PortfolioUpload->>Storage: Upload to portfolio bucket
    Storage-->>PortfolioUpload: Public URL(s)
    PortfolioUpload->>DB: INSERT into posts (images JSONB array)
    DB-->>PortfolioUpload: Success
    PortfolioUpload-->>Barber: Show in portfolio grid
```

## Password Reset Flow

```mermaid
sequenceDiagram
    participant User
    participant ResetPage as /reset-password
    participant Supabase
    participant Email
    participant UpdatePage as /update-password
    participant Callback as /auth/callback

    User->>ResetPage: Enter email
    ResetPage->>Supabase: resetPasswordForEmail(email, redirectTo)
    Supabase->>Email: Send reset link
    User->>Email: Click link
    Email->>Callback: GET /auth/callback?code=...&next=/update-password
    Callback->>Supabase: exchangeCodeForSession
    Callback-->>UpdatePage: Redirect
    User->>UpdatePage: Enter new password
    UpdatePage->>Supabase: updateUser({password})
    Supabase-->>UpdatePage: Success
    UpdatePage-->>User: Redirect to login
```
