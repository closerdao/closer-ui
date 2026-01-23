CLOSER v4
Extended Product Specification
Part II: Technical Architecture & User Flows
January 2026
10. Passport System Architecture
The Passport is the portable identity layer that travels with individuals across the Closer network. It serves as proof of membership, reputation carrier, and access credential.
10.1 Passport Data Model
{
  "passport_id": "uuid-v4",
  "holder": {
    "display_name": "string",
    "avatar_url": "string",
    "verified_email": "boolean",
    "kyc_level": "none | basic | full"
  },
  "issuer": {
    "network_id": "string",
    "network_name": "string",
    "issued_at": "ISO-8601",
    "valid_until": "ISO-8601 | null"
  },
  "credentials": [
    {
      "type": "membership | skill | attestation",
      "name": "string",
      "issued_by": "network_id",
      "issued_at": "ISO-8601",
      "proof": "signature | zk-proof"
    }
  ],
  "presence_history": [
    {
      "space_id": "string",
      "check_in": "ISO-8601",
      "check_out": "ISO-8601",
      "proof_of_presence": "hash"
    }
  ],
  "sweat_equity": {
    "total_hours": "number",
    "skills_contributed": ["string"],
    "reputation_score": "number"
  }
}
10.2 Passport Issuance Flow
Trust networks issue passports to their members through the following process:
	•	User applies to join a trust network (e.g., Nomad Farm, ReFi Collective)
	•	Network curator reviews application based on network-specific criteria
	•	Upon approval, network issues passport with initial credentials
	•	Passport is stored in user's Closer wallet (non-custodial)
	•	User can present passport at any Closer-enabled space
	•	Space verifies passport signature and checks network agreements
	•	Benefits (discounts, reduced onboarding) applied automatically
10.3 Multi-Network Passports
A single user can hold passports from multiple trust networks. The Closer wallet aggregates all passports and presents the most beneficial one automatically based on context:
	•	Wallet stores multiple passport credentials
	•	At check-in, system evaluates all valid passports against space agreements
	•	Best available rate/benefit is applied automatically
	•	User can manually select preferred passport if desired
	•	Spaces see aggregated reputation across all networks

11. Network-Space Agreement System
Agreements between trust networks and physical spaces form the economic backbone of Closer. These are formalized contracts that define terms of exchange.
11.1 Agreement Types
Type
Description
Key Terms
Booking Rate
Discounted accommodation for network members
Discount %, min stay, blackout dates
Referral
Revenue share for referred bookings
Fee %, tracking window, payment terms
Event Hosting
Network hosts events at space venue
Revenue split, capacity, services included
Resource Share
Shared purchasing or equipment
Cost allocation, usage rights, maintenance
Onboarding Bypass
Reduced vetting for verified members
Steps bypassed, liability terms
11.2 Agreement Data Model
{
  "agreement_id": "uuid-v4",
  "type": "booking_rate | referral | event_hosting | resource_share",
  "parties": {
    "network": {
      "id": "string",
      "name": "string",
      "signatory": "user_id"
    },
    "space": {
      "id": "string", 
      "name": "string",
      "signatory": "user_id"
    }
  },
  "terms": {
    "discount_percentage": "number | null",
    "referral_fee_percentage": "number | null",
    "minimum_booking_value": "number | null",
    "event_revenue_share": "number | null",
    "onboarding_bypass": ["step_id"]
  },
  "validity": {
    "start_date": "ISO-8601",
    "end_date": "ISO-8601 | null",
    "auto_renew": "boolean"
  },
  "governance": {
    "requires_vote": "boolean",
    "approved_by": ["user_id"],
    "proposal_id": "string | null"
  },
  "on_chain": {
    "deployed": "boolean",
    "contract_address": "string | null",
    "chain_id": "number"
  }
}
11.3 Agreement Creation Flow
For Network Initiating Agreement
	•	Network admin navigates to Partner Spaces in dashboard
	•	Selects target space from Closer directory
	•	Proposes agreement terms (discount %, referral fee, etc.)
	•	System generates agreement draft with smart contract template
	•	If network governance requires, proposal goes to member vote
	•	Upon network approval, agreement sent to space for review
For Space Receiving Agreement
	•	Space admin receives agreement proposal notification
	•	Reviews terms and network reputation/size
	•	Can accept, reject, or counter-propose modified terms
	•	If space governance requires, proposal goes to citizen vote
	•	Upon space approval, agreement activates
	•	Optional: deploy terms as smart contract on Celo

12. Cross-Community Revenue Flows
Closer v4 enables automated revenue sharing between communities through referral bridges and settlement systems.
12.1 Referral Revenue Model
When Space A refers a booking to Space B, the following flow occurs:

  ┌─────────────┐                    ┌─────────────┐
  │   SPACE A   │───── Referral ────▶│   SPACE B   │
  │   (TDF)     │      Link          │  (Village X)│
  └─────────────┘                    └─────────────┘
         ▲                                  │
         │                                  │
         │    ┌──────────────────────┐     │
         │    │ Guest books €500     │     │
         └────│ 10% referral = €50   │◀────┘
              │ Settled daily/weekly │
              └──────────────────────┘
12.2 Settlement Mechanisms
	•	Daily batch settlements: Accumulated referral fees settled every 24 hours
	•	Instant settlements: For amounts over threshold (e.g., €500), immediate transfer
	•	Token settlements: Option to receive in $CLOSER network token
	•	Fiat settlements: EUR via Monerium integration for spaces preferring traditional currency
	•	Netting: Bi-directional referrals netted before settlement to reduce transactions
12.3 Revenue Dashboard
Each space dashboard displays:
	•	Incoming referral revenue (from traffic we sent to partners)
	•	Outgoing referral payments (fees owed to referring spaces)
	•	Net position with each partner space
	•	Historical trends and projections
	•	Top referring partners ranked by value
	•	Conversion rates by referral source

13. AI Community Agent Specification
The AI agent serves as the conversational interface and institutional memory for each community. It is powered by Claude and customized per deployment.
13.1 Agent Architecture
┌─────────────────────────────────────────────────────────────────┐
│                    CLOSER AI AGENT                              │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │              Conversation Engine (Claude)                 │ │
│  │         Context Management + Intent Classification        │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              │                                  │
│     ┌────────────────────────┼────────────────────────┐        │
│     ▼                        ▼                        ▼        │
│  ┌──────────┐         ┌──────────────┐         ┌────────────┐ │
│  │Knowledge │◀───────▶│   Platform   │◀───────▶│   Social   │ │
│  │  Base    │         │ Integrations │         │   Layer    │ │
│  └──────────┘         └──────────────┘         └────────────┘ │
│       │                      │                        │        │
│       ▼                      ▼                        ▼        │
│  ┌──────────┐         ┌──────────────┐         ┌────────────┐ │
│  │Documents │         │ Closer API   │         │  X/Twitter │ │
│  │Transcripts│        │ Bookings     │         │  Telegram  │ │
│  │Whitepapers│        │ Events       │         │  Discord   │ │
│  └──────────┘         └──────────────┘         └────────────┘ │
└─────────────────────────────────────────────────────────────────┘
13.2 Knowledge Base Ingestion
Each community agent ingests and maintains knowledge from multiple sources:
Source
Content Type
Update Frequency
Documents
Whitepapers, governance docs, policies
On upload
Transcripts
Meeting recordings, calls, discussions
Daily ingestion
Platform Data
Token prices, availability, events
Real-time via API
Collective Memory
Aggregated insights from conversations
Continuous learning
External Sources
Web content, partner data
Periodic refresh
13.3 Intent Classification
The agent classifies incoming messages into intent categories for appropriate routing:
Intent
Example Query
Action
TOKEN_PRICE
"What's the $TDF price?"
Fetch from blockchain
BOOKING_INQUIRY
"Any rooms available next week?"
Query availability API
GOVERNANCE_INFO
"How do I become a citizen?"
Retrieve from knowledge base
EVENT_SEARCH
"What events are coming up?"
Query events API
HUMAN_ESCALATION
"I need to speak to someone"
Flag for human review
GENERAL_CHAT
"Tell me about regenerative living"
Conversational response
13.4 Collective Memory System
The agent maintains a collective memory that aggregates insights from all user interactions while respecting privacy:
	•	Anonymized pattern extraction from conversations
	•	Trending topics and emerging community concerns
	•	FAQ generation from repeated questions
	•	Sentiment tracking over time
	•	Knowledge gaps identification (questions agent couldn't answer)
	•	Cross-user context ("Many community members have asked about X")
Privacy Boundaries
	•	Individual conversation content never shared between users
	•	Only aggregated, anonymized patterns stored in collective memory
	•	Users can opt out of contributing to collective memory
	•	Stewards can review and curate collective memory contents
	•	GDPR-compliant data handling with right to deletion

14. Application Marketplace
Each community has access to an App Store where they can enable applications suited to their local context. Communities govern which apps run in their environment.
14.1 Application Categories
Category
Applications
Status
Core
Booking, Events, Members, Payments
Included
Intelligence
AI Agent, CRM, Analytics
Q2 2026
Governance
Proposals, Voting, Treasury
Q3 2026
Communication
Social Automation, Newsletters
Q2 2026
Finance
Accounting, Reporting, Settlements
Q3 2026
Third-Party
Developer-built applications
Q4 2026
14.2 App Installation Flow
	•	Community admin browses App Store from dashboard
	•	Selects application and reviews permissions required
	•	If governance requires, creates proposal for community vote
	•	Upon approval, app is activated in community environment
	•	App receives API credentials scoped to that community
	•	App appears in community dashboard and member interfaces
	•	Community can configure app settings and access controls
	•	Usage and performance tracked in analytics
14.3 App Permission Scopes
{
  "app_permissions": {
    "read": {
      "members": "List community members",
      "bookings": "View booking data",
      "events": "View event listings",
      "governance": "View proposals and votes",
      "financials": "View revenue data"
    },
    "write": {
      "notifications": "Send notifications to members",
      "bookings": "Create/modify bookings",
      "events": "Create/modify events",
      "content": "Post to community feeds"
    },
    "sensitive": {
      "payments": "Process payments",
      "governance": "Create proposals",
      "member_data": "Access detailed member profiles"
    }
  }
}
14.4 Third-Party Developer Program
External developers can build applications for the Closer ecosystem:
	•	Developer registration and API key provisioning
	•	Sandbox environment for testing
	•	App submission and security review process
	•	Revenue sharing model (70% developer / 30% platform)
	•	App analytics and usage dashboards
	•	Documentation and SDK access

15. Governance System Deep Dive
15.1 Proposal Types
Type
Scope
Quorum
Policy Change
Update community rules or guidelines
20% of token supply
Treasury Spend
Allocate funds from community treasury
30% of token supply
App Enablement
Activate new application in environment
15% of token supply
Agreement Approval
Ratify partnership with network/space
25% of token supply
Role Assignment
Appoint steward or revoke access
30% of token supply
Protocol Upgrade
Network-wide technical changes
50% of communities
15.2 Voting Mechanisms
	•	Token-weighted voting: Votes proportional to token holdings
	•	Quadratic voting: Square root of tokens to reduce plutocracy
	•	Conviction voting: Vote strength increases with time committed
	•	One-person-one-vote: For identity-verified decisions
	•	Delegation: Members can delegate votes to trusted representatives
15.3 Proposal Lifecycle
Draft → Discussion → Voting → Execution/Rejection

┌─────────┐     ┌────────────┐     ┌─────────┐     ┌───────────┐
│  DRAFT  │────▶│ DISCUSSION │────▶│ VOTING  │────▶│ EXECUTION │
└─────────┘     └────────────┘     └─────────┘     └───────────┘
     │               │                  │                │
     │  Min 24hrs    │  3-7 days        │  24-72 hrs     │
     │               │                  │                │
     ▼               ▼                  ▼                ▼
  Author         Community          Quorum           Smart
  creates        provides           required         contract
  proposal       feedback           to pass          executes
15.4 Network-Level Governance
Decisions affecting the entire Closer network require coordination across communities:
	•	Protocol upgrades require supermajority (67%) of active communities
	•	Each community gets one vote regardless of size (prevents large community dominance)
	•	Council of elected representatives from each community handles routine decisions
	•	Emergency procedures for critical security issues
	•	Treasury allocation decided by combined community voting power

16. Booking & Event System
16.1 Accommodation Types
Type
Description
Typical Rate
Shared Dorm
Bed in shared room (4-8 people)
€15-30/night
Private Room
Single room in shared building
€40-80/night
Suite
Private room with bathroom
€60-120/night
Tiny Home
Independent small dwelling
€50-100/night
Camping
Tent or vehicle spot
€10-20/night
Long-term
Monthly residence (discounted)
€400-1200/month
16.2 Pricing Engine
Dynamic pricing based on multiple factors:
	•	Base rate set by space
	•	Seasonal adjustments (high/low season multipliers)
	•	Network discounts applied from passport agreements
	•	Token holder benefits (citizenship discounts)
	•	Length of stay discounts
	•	Early bird / last minute adjustments
	•	Occupancy-based dynamic pricing (optional)
16.3 Event Hosting Flow
For trust networks hosting events at partner spaces:
	•	Network admin selects partner space and date range
	•	Submits event proposal with participant estimate and requirements
	•	Space reviews and confirms availability and terms
	•	Agreement generated with revenue split and logistics
	•	Network opens registration to their members
	•	Closer handles booking, payments, and attendee management
	•	Post-event: revenue settled per agreement, feedback collected
16.4 Channel Sync (Roadmap)
Integration with external booking platforms:
	•	Airbnb: Two-way calendar sync, rate parity management
	•	Booking.com: Availability push, reservation pull
	•	Google Calendar: Manual blocking sync
	•	iCal feeds: Universal calendar export
	•	Channel manager integration for properties on multiple platforms

17. Onboarding Flows
17.1 New Space Onboarding
	•	Space submits application via Closer website
	•	Closer team reviews for alignment with regenerative values
	•	Onboarding call to understand needs and configure platform
	•	Space admin account created with initial settings
	•	Import existing data (members, bookings, events)
	•	Configure accommodations, pricing, and policies
	•	Enable desired applications from marketplace
	•	Training session for space team
	•	Soft launch with existing community
	•	Public listing in Closer network directory
17.2 New Network Onboarding
	•	Network leader registers organization
	•	Configures membership criteria and application process
	•	Designs passport credentials and benefits
	•	Invites founding members to join
	•	Establishes governance structure and decision processes
	•	Reaches out to spaces for partnership agreements
	•	Members begin using passports at partner locations
	•	Network listed in Closer directory for growth
17.3 Individual User Onboarding
	•	User discovers Closer through a space or network
	•	Creates account with email or social login
	•	Completes basic profile (name, location, interests)
	•	Optional: applies to join one or more trust networks
	•	Optional: purchases tokens to become space citizen
	•	Receives passport credentials upon network approval
	•	Can book stays, attend events, participate in governance
	•	Builds reputation through Proof of Presence and contributions

18. API Specification
18.1 Core Endpoints
Endpoint
Method
Description
/api/v4/spaces
GET, POST
List/create spaces
/api/v4/networks
GET, POST
List/create networks
/api/v4/passports
GET, POST, PUT
Passport CRUD
/api/v4/agreements
GET, POST, PUT
Agreement management
/api/v4/bookings
GET, POST, PUT, DELETE
Booking operations
/api/v4/events
GET, POST, PUT, DELETE
Event operations
/api/v4/proposals
GET, POST, PUT
Governance proposals
/api/v4/chat
POST
AI agent conversation
/api/v4/token/price
GET
Current token price
18.2 Authentication
// API Key Authentication
Headers:
  X-API-Key: {CLOSER_API_KEY}
  X-Community-ID: {community_slug}

// OAuth 2.0 for user actions
Authorization: Bearer {access_token}

// Webhook signatures
X-Closer-Signature: {HMAC-SHA256(payload, secret)}
18.3 Webhooks
Real-time event notifications for integrations:
	•	booking.created / booking.updated / booking.cancelled
	•	event.created / event.published / event.completed
	•	member.joined / member.left / member.role_changed
	•	payment.received / payment.refunded
	•	proposal.created / proposal.passed / proposal.rejected
	•	agreement.proposed / agreement.activated / agreement.expired

19. Security & Privacy
19.1 Data Protection
	•	GDPR compliant data handling and storage
	•	Data residency in EU (Portugal/Germany data centers)
	•	Encryption at rest (AES-256) and in transit (TLS 1.3)
	•	Regular security audits and penetration testing
	•	Bug bounty program for responsible disclosure
	•	SOC 2 Type II certification (roadmap)
19.2 Access Controls
	•	Role-based access control (RBAC) for all operations
	•	Multi-factor authentication for admin accounts
	•	API rate limiting and abuse detection
	•	Audit logs for all sensitive operations
	•	IP allowlisting for API access (optional)
	•	Session management with configurable timeouts
19.3 Privacy-Preserving Features (Roadmap)
	•	ZK-proofs for passport verification without revealing details
	•	Selective disclosure: prove membership without revealing identity
	•	Encrypted storage for sensitive user data
	•	Decentralized identity with user-controlled keys
	•	Right to be forgotten with complete data deletion

20. Appendices
Appendix A: Glossary
Term
Definition
Space
A physical location running Closer (village, co-living, venue)
Network
A trust community issuing passports to members
Passport
Portable credential proving network membership
Citizen
Token holder with governance rights in a space
Steward
Active governance participant with elevated permissions
Agreement
Formal contract between network and space
Proof of Presence
Verified record of physical stay at a space
Proof of Sweat
Verified record of work contribution
Collective Memory
Aggregated insights from AI agent interactions
Appendix B: Token Economics
Each space can issue its own token (e.g., $TDF for Traditional Dream Factory). Network-level coordination uses the $CLOSER token.
	•	Space tokens: Governance rights + booking benefits within that space
	•	$CLOSER token: Network governance + cross-community benefits
	•	Token bridges: Convert between space tokens and $CLOSER
	•	Staking: Lock tokens for enhanced voting power or revenue share
	•	Utility: Pay for bookings, events, and application fees
Appendix C: Migration from v3
Existing Closer deployments will be migrated to v4 with the following approach:
	•	Data export from existing MongoDB collections
	•	Schema migration to v4 data models
	•	User accounts preserved with new passport credentials
	•	Booking history maintained and linked to new structure
	•	Parallel running period (v3 and v4) for validation
	•	Cutover with minimal downtime
	•	Post-migration verification and cleanup
— End of Extended Specification —
