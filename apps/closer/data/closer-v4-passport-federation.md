CLOSER v4
Web2 Passport & Federation Protocol
Part III: Cross-Network Identity & Coordination
January 2026
21. Web2 Passport System
The Web2 Passport provides a privacy-preserving, federated identity layer that enables users to carry credentials across Closer-powered communities without requiring blockchain integration. This serves as the foundational identity system for v4, with on-chain passports as a future upgrade path.
21.1 Core Principles
	•	Privacy-first: Email addresses are hashed (SHA-256) before any cross-server queries
	•	User consent: Data sharing between servers is opt-in only
	•	Federated architecture: api.closer.earth serves as first coordination node, but any community server can act as a federation node
	•	Portable credentials: Users carry reputation and membership across communities
	•	Graceful degradation: System works even if federation node is unavailable
21.2 Architecture Overview
┌─────────────────────────────────────────────────────────────────────────┐
│                    CLOSER FEDERATION NETWORK                            │
│                                                                         │
│    ┌─────────────────┐                      ┌─────────────────┐        │
│    │  TDF Server     │                      │  Nomad Farm     │        │
│    │  api.tdf.pt     │◀────────────────────▶│  api.nomadfarm  │        │
│    └────────┬────────┘                      └────────┬────────┘        │
│             │                                        │                  │
│             │         ┌─────────────────┐           │                  │
│             └────────▶│ api.closer.earth│◀──────────┘                  │
│                       │ (Federation Hub)│                               │
│                       └────────┬────────┘                               │
│                                │                                        │
│             ┌──────────────────┼──────────────────┐                    │
│             ▼                  ▼                  ▼                    │
│    ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐        │
│    │  Village X      │ │  ReFi Hub       │ │  Future Node    │        │
│    │  api.villagex   │ │  api.refihub    │ │  api.*.earth    │        │
│    └─────────────────┘ └─────────────────┘ └─────────────────┘        │
└─────────────────────────────────────────────────────────────────────────┘

Data Flow:
1. User logs into TDF with email
2. TDF queries api.closer.earth with hash(email)
3. Federation returns passport credentials (if user opted in)
4. User sees unified profile with cross-community reputation

22. Passport Credential Model
The passport stores portable credentials that travel with the user across communities. This model extends the existing Closer user model with federation-specific fields.
22.1 Passport Schema (MongoDB)
// models/passport.js
const fields = [
  {
    name: 'emailHash',
    public: false,
    required: true,
    editable: false,
    type: String,
    unique: true,
    // SHA-256 hash of lowercase email
    // Example: hash("sam@tdf.pt") → "a3f2b8c9d4e5..."
  },
  {
    name: 'displayName',
    public: true,
    editable: true,
    type: String,
    // Optional: user-chosen public name
  },
  {
    name: 'avatar',
    public: true,
    editable: true,
    type: String,
    // URL to avatar image
  },
  {
    name: 'homeServer',
    public: true,
    required: true,
    editable: false,
    type: String,
    // The server where user first registered
    // Example: "api.traditionaldreamfactory.com"
  },
  {
    name: 'federationConsent',
    public: false,
    required: true,
    editable: true,
    type: {
      shareProfile: { type: Boolean, default: false },
      shareCredentials: { type: Boolean, default: false },
      sharePresenceHistory: { type: Boolean, default: false },
      shareReputation: { type: Boolean, default: false },
      consentedAt: Date,
      consentVersion: String
    },
    default: {
      shareProfile: false,
      shareCredentials: false,
      sharePresenceHistory: false,
      shareReputation: false
    }
  },
  {
    name: 'credentials',
    public: true,
    editable: false,
    type: [{
      type: { type: String, enum: ['membership', 'citizenship', 'skill', 'attestation', 'event'] },
      issuer: String,        // Server that issued credential
      issuerId: String,      // ObjectId on issuing server  
      name: String,          // Human-readable name
      issuedAt: Date,
      expiresAt: Date,       // null = never expires
      metadata: {
        tokenCount: Number,  // For citizenship credentials
        role: String,        // For membership credentials
        skillLevel: String,  // For skill credentials
        eventId: String      // For event attendance
      }
    }],
    default: []
  },
  {
    name: 'presenceHistory',
    public: true,           // Only if user consents
    editable: false,
    type: [{
      serverId: String,      // Server slug
      serverName: String,    // Human-readable name
      checkIn: Date,
      checkOut: Date,
      verified: Boolean,     // Proof of Presence verified
      nights: Number
    }],
    default: []
  },
  {
    name: 'reputation',
    public: true,           // Only if user consents
    editable: false,
    type: {
      totalNights: { type: Number, default: 0 },
      communitiesVisited: { type: Number, default: 0 },
      eventsAttended: { type: Number, default: 0 },
      contributionHours: { type: Number, default: 0 },
      vouchesReceived: { type: Number, default: 0 },
      vouchesGiven: { type: Number, default: 0 }
    },
    default: {}
  },
  {
    name: 'linkedServers',
    public: false,
    editable: true,
    type: [{
      serverId: String,
      serverName: String,
      apiUrl: String,
      linkedAt: Date,
      userId: String,        // User's ID on that server
      syncEnabled: Boolean
    }],
    default: []
  }
];
22.2 Credential Types
Type
Description
Issued When
citizenship
Token holder in a community
User acquires min. tokens (e.g., 30 $TDF)
membership
Member of a trust network
Approved by network curator
skill
Verified skill or expertise
Completed training or peer attestation
attestation
Vouch from another user
Another passport holder vouches
event
Attended an event
Checked in at registered event

23. Closer Login Flow
The Closer Login enables users to authenticate at any community server while retrieving their cross-network credentials from the federation layer.
23.1 Login Sequence Diagram
User          Community Server       api.closer.earth        Home Server
  │               (Village X)          (Federation)            (TDF)
  │                    │                    │                    │
  │  1. Enter email    │                    │                    │
  │───────────────────▶│                    │                    │
  │                    │                    │                    │
  │                    │ 2. hash(email)     │                    │
  │                    │───────────────────▶│                    │
  │                    │                    │                    │
  │                    │ 3. Return passport │                    │
  │                    │    (if consented)  │                    │
  │                    │◀───────────────────│                    │
  │                    │                    │                    │
  │                    │ 4. (Optional) Verify with home server   │
  │                    │────────────────────────────────────────▶│
  │                    │                    │                    │
  │                    │ 5. Confirmation    │                    │
  │                    │◀────────────────────────────────────────│
  │                    │                    │                    │
  │  6. Show unified   │                    │                    │
  │     profile +      │                    │                    │
  │     credentials    │                    │                    │
  │◀───────────────────│                    │                    │
  │                    │                    │                    │
  │  7. Apply benefits │                    │                    │
  │     (discounts,    │                    │                    │
  │     reduced        │                    │                    │
  │     onboarding)    │                    │                    │
  │◀───────────────────│                    │                    │
23.2 API Endpoints
Federation Query (api.closer.earth)
GET /api/v4/passport/lookup?emailHash={sha256_hash}

Headers:
  X-Requesting-Server: api.villagex.com
  X-API-Key: {server_api_key}

Response (200 OK - user found and consented):
{
  "found": true,
  "passport": {
    "displayName": "Sam",
    "avatar": "https://...",
    "homeServer": "api.traditionaldreamfactory.com",
    "credentials": [
      {
        "type": "citizenship",
        "issuer": "api.traditionaldreamfactory.com",
        "name": "TDF Citizen",
        "issuedAt": "2024-03-15T00:00:00Z",
        "metadata": { "tokenCount": 45 }
      },
      {
        "type": "membership",
        "issuer": "api.nomadfarm.co",
        "name": "Nomad Farm Member",
        "issuedAt": "2025-06-01T00:00:00Z",
        "metadata": { "role": "participant" }
      }
    ],
    "reputation": {
      "totalNights": 127,
      "communitiesVisited": 4,
      "eventsAttended": 12,
      "vouchesReceived": 8
    }
  }
}

Response (200 OK - user found but no consent):
{
  "found": true,
  "passport": null,
  "reason": "user_no_consent"
}

Response (404 - user not in federation):
{
  "found": false
}
Consent Management (any server)
PATCH /api/v4/user/me/federation-consent

Headers:
  Authorization: Bearer {user_jwt}

Body:
{
  "shareProfile": true,
  "shareCredentials": true,
  "sharePresenceHistory": true,
  "shareReputation": true
}

Response (200 OK):
{
  "federationConsent": {
    "shareProfile": true,
    "shareCredentials": true,
    "sharePresenceHistory": true,
    "shareReputation": true,
    "consentedAt": "2026-01-08T12:00:00Z",
    "consentVersion": "1.0"
  },
  "message": "Federation consent updated. Your passport is now visible to other Closer communities."
}

24. Data Sync Protocol
When users opt-in, their credentials and activity sync from their home server to the federation hub, making them available across all communities.
24.1 Sync Events
Event
Trigger
Data Synced
credential.issued
User earns new credential
Credential object
credential.revoked
Credential removed/expired
Credential ID + revocation reason
presence.checkout
User completes stay
Check-in/out dates, nights, verified
reputation.updated
Reputation metrics change
Updated reputation object
consent.changed
User updates sharing prefs
New consent settings
passport.deleted
User requests deletion
emailHash only (for removal)
24.2 Webhook Payload Examples
Credential Issued
POST https://api.closer.earth/api/v4/federation/sync

Headers:
  X-Origin-Server: api.traditionaldreamfactory.com
  X-Webhook-Secret: {hmac_signature}

Body:
{
  "event": "credential.issued",
  "timestamp": "2026-01-08T14:30:00Z",
  "emailHash": "a3f2b8c9d4e5...",
  "payload": {
    "credential": {
      "type": "citizenship",
      "name": "TDF Citizen",
      "issuedAt": "2026-01-08T14:30:00Z",
      "metadata": { "tokenCount": 30 }
    }
  }
}
Stay Completed
{
  "event": "presence.checkout",
  "timestamp": "2026-01-08T10:00:00Z",
  "emailHash": "a3f2b8c9d4e5...",
  "payload": {
    "presence": {
      "checkIn": "2026-01-01T15:00:00Z",
      "checkOut": "2026-01-08T10:00:00Z",
      "nights": 7,
      "verified": true
    }
  }
}
24.3 Conflict Resolution
	•	Home server is authoritative: User's home server is the source of truth for their core profile
	•	Credentials are additive: Credentials from multiple servers are merged, not overwritten
	•	Timestamps win: For conflicting data, most recent timestamp takes precedence
	•	User can reset: User can trigger full re-sync from home server at any time
	•	Revocations propagate: When a credential is revoked, revocation syncs immediately

25. Integration with Existing Models
The passport system integrates with the existing LandProject and ProjectApi models to enable cross-community benefits.
25.1 LandProject Integration
// Extended land-project.js fields for passport integration

{
  name: 'passportBenefits',
  public: true,
  editable: true,
  type: [{
    credentialType: { 
      type: String, 
      enum: ['citizenship', 'membership', 'skill', 'attestation'] 
    },
    issuerFilter: String,       // null = any issuer, or specific server
    benefit: {
      type: { type: String, enum: ['discount', 'onboarding_skip', 'priority_booking'] },
      value: Number,            // Percentage for discounts
      skipSteps: [String]       // For onboarding_skip
    },
    description: String
  }],
  default: []
},
{
  name: 'minimumReputation',
  public: true,
  editable: true,
  type: {
    totalNights: Number,
    communitiesVisited: Number,
    vouchesReceived: Number
  },
  default: null
  // If set, users must meet these thresholds for certain benefits
}
Example: TDF Passport Benefits Configuration
{
  "name": "Traditional Dream Factory",
  "passportBenefits": [
    {
      "credentialType": "citizenship",
      "issuerFilter": null,
      "benefit": {
        "type": "discount",
        "value": 15
      },
      "description": "15% discount for citizens of any Closer community"
    },
    {
      "credentialType": "membership",
      "issuerFilter": "api.nomadfarm.co",
      "benefit": {
        "type": "discount",
        "value": 20
      },
      "description": "20% discount for Nomad Farm members"
    },
    {
      "credentialType": "attestation",
      "issuerFilter": null,
      "benefit": {
        "type": "onboarding_skip",
        "skipSteps": ["identity_verification", "video_call"]
      },
      "description": "Skip onboarding for vouched members"
    }
  ],
  "minimumReputation": {
    "totalNights": 14,
    "vouchesReceived": 2
  }
}
25.2 ProjectApi Integration
// Extended project-api.js fields for federation

{
  name: 'federation',
  public: true,
  editable: true,
  type: {
    enabled: { type: Boolean, default: false },
    federationHub: { 
      type: String, 
      default: 'https://api.closer.earth' 
    },
    syncWebhookUrl: String,
    syncApiKey: String,
    trustedServers: [{
      apiUrl: String,
      name: String,
      addedAt: Date,
      trustLevel: { type: String, enum: ['full', 'limited', 'none'] }
    }],
    outboundSync: {
      credentials: { type: Boolean, default: true },
      presence: { type: Boolean, default: true },
      reputation: { type: Boolean, default: true }
    }
  },
  default: {
    enabled: false,
    federationHub: 'https://api.closer.earth',
    trustedServers: [],
    outboundSync: {
      credentials: true,
      presence: true,
      reputation: true
    }
  }
}

26. Benefit Application Logic
When a user with a passport books at a community, the system automatically evaluates and applies the best available benefits.
26.1 Benefit Evaluation Algorithm
async function evaluatePassportBenefits(passport, landProject) {
  const applicableBenefits = [];
  
  for (const benefit of landProject.passportBenefits) {
    // Check if user has matching credential
    const matchingCredential = passport.credentials.find(cred => {
      // Match credential type
      if (cred.type !== benefit.credentialType) return false;
      
      // Match issuer filter (if specified)
      if (benefit.issuerFilter && cred.issuer !== benefit.issuerFilter) return false;
      
      // Check credential not expired
      if (cred.expiresAt && new Date(cred.expiresAt) < new Date()) return false;
      
      return true;
    });
    
    if (matchingCredential) {
      applicableBenefits.push({
        ...benefit,
        matchedCredential: matchingCredential
      });
    }
  }
  
  // Check minimum reputation requirements
  if (landProject.minimumReputation) {
    const meetsReputation = 
      (!landProject.minimumReputation.totalNights || 
        passport.reputation.totalNights >= landProject.minimumReputation.totalNights) &&
      (!landProject.minimumReputation.communitiesVisited || 
        passport.reputation.communitiesVisited >= landProject.minimumReputation.communitiesVisited) &&
      (!landProject.minimumReputation.vouchesReceived || 
        passport.reputation.vouchesReceived >= landProject.minimumReputation.vouchesReceived);
    
    if (!meetsReputation) {
      // Filter out benefits that require reputation
      return applicableBenefits.filter(b => !b.requiresMinReputation);
    }
  }
  
  // Sort benefits by value (best discount first)
  return applicableBenefits.sort((a, b) => {
    if (a.benefit.type === 'discount' && b.benefit.type === 'discount') {
      return b.benefit.value - a.benefit.value;
    }
    return 0;
  });
}
26.2 Booking Flow with Passport
	•	User initiates booking at Village X
	•	System queries federation for user's passport (using emailHash)
	•	Passport credentials returned (if user consented)
	•	evaluatePassportBenefits() calculates applicable benefits
	•	Best discount applied to booking total
	•	Onboarding steps marked as skipped based on credentials
	•	Booking confirmation shows applied benefits and their source
	•	Post-booking: stay syncs back to federation as presence history

27. Privacy & Security Model
27.1 Email Hashing
// Hash function for email addresses
const crypto = require('crypto');

function hashEmail(email) {
  // Normalize: lowercase and trim
  const normalized = email.toLowerCase().trim();
  
  // SHA-256 hash
  return crypto
    .createHash('sha256')
    .update(normalized)
    .digest('hex');
}

// Example:
// hashEmail("Sam@TDF.pt") → "a3f2b8c9d4e5f6a7b8c9d0e1f2a3b4c5..."
// hashEmail("sam@tdf.pt") → "a3f2b8c9d4e5f6a7b8c9d0e1f2a3b4c5..." (same)
27.2 Consent Granularity
Consent Flag
What's Shared
Use Case
shareProfile
Display name, avatar
Basic identity at other communities
shareCredentials
Memberships, citizenships, skills
Unlock benefits and discounts
sharePresenceHistory
Past stays (dates, locations)
Build trust through track record
shareReputation
Aggregate scores (nights, vouches)
Qualify for reputation requirements
27.3 Data Minimization
	•	Federation only stores hashed emails, never plain text
	•	Servers only receive data users have explicitly consented to share
	•	Presence history only includes dates and verification status, not booking details
	•	Financial information never syncs through federation
	•	Users can delete their federation passport at any time (right to be forgotten)
27.4 Server Authentication
// Server-to-server authentication
// Each ProjectApi has a unique API key for federation calls

Headers required for all federation API calls:
  X-Requesting-Server: {server_api_url}
  X-API-Key: {project_api.technical.apiKey}
  X-Request-Timestamp: {ISO-8601}
  X-Request-Signature: {HMAC-SHA256(request_body + timestamp, webhook_secret)}

// Federation hub validates:
// 1. Server is registered in ProjectApi collection
// 2. API key matches
// 3. Signature is valid
// 4. Timestamp within 5 minutes (prevents replay attacks)

28. Federation Node Architecture
While api.closer.earth serves as the initial coordination node, the architecture supports multiple federation nodes for resilience and decentralization.
28.1 Node Types
Node Type
Description
Example
Primary Hub
Main federation coordination point
api.closer.earth
Community Server
Individual space running Closer
api.tdf.pt, api.villagex.com
Regional Hub
Federation node for geographic region
api.closer-eu.org (future)
Network Hub
Federation node for trust network
api.nomadfarm.co (future)
28.2 Multi-Node Sync
// Future: Multi-hub federation
// Each community can specify which federation hub(s) to trust

{
  "federation": {
    "enabled": true,
    "hubs": [
      {
        "url": "https://api.closer.earth",
        "priority": 1,
        "role": "primary"
      },
      {
        "url": "https://api.refi-federation.org",
        "priority": 2,
        "role": "backup"
      }
    ],
    "syncStrategy": "primary_first"  // or "broadcast_all"
  }
}

// Sync strategies:
// - primary_first: Try primary hub, fallback to backup
// - broadcast_all: Sync to all hubs simultaneously
// - consensus: Require acknowledgment from N hubs
28.3 Becoming a Federation Node
Any Closer deployment can evolve into a federation node by implementing the federation API endpoints:
	•	GET /api/v4/passport/lookup — Query passports by email hash
	•	POST /api/v4/federation/sync — Receive webhook events from community servers
	•	GET /api/v4/federation/servers — List registered community servers
	•	POST /api/v4/federation/register — Register a new community server
	•	Passport data storage with proper indexing on emailHash
	•	Webhook delivery system for outbound sync events

29. UI Components
29.1 Closer Login Button
// React component for Closer Login
import { useState } from 'react';

export function CloserLoginButton({ onSuccess, serverApiUrl }) {
  const [loading, setLoading] = useState(false);
  
  async function handleLogin() {
    setLoading(true);
    
    // 1. Get email from standard auth flow
    const { email, token } = await standardLogin();
    
    // 2. Query federation for passport
    const emailHash = await sha256(email.toLowerCase());
    const response = await fetch(
      `${serverApiUrl}/api/v4/passport/lookup?emailHash=${emailHash}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    const { found, passport } = await response.json();
    
    // 3. Merge local user with passport data
    if (found && passport) {
      await mergePassportWithLocalUser(passport);
    }
    
    setLoading(false);
    onSuccess({ email, passport });
  }
  
  return (
    <button onClick={handleLogin} disabled={loading}>
      {loading ? 'Loading...' : 'Login with Closer'}
    </button>
  );
}
29.2 Passport Display Component
// Passport card showing credentials
export function PassportCard({ passport }) {
  return (
    <div className="passport-card">
      <div className="passport-header">
        <img src={passport.avatar} alt="" />
        <h3>{passport.displayName}</h3>
        <span className="home-server">{passport.homeServer}</span>
      </div>
      
      <div className="credentials">
        <h4>Credentials ({passport.credentials.length})</h4>
        {passport.credentials.map(cred => (
          <CredentialBadge key={cred.issuerId} credential={cred} />
        ))}
      </div>
      
      <div className="reputation">
        <h4>Reputation</h4>
        <div className="stats">
          <Stat label="Nights" value={passport.reputation.totalNights} />
          <Stat label="Communities" value={passport.reputation.communitiesVisited} />
          <Stat label="Vouches" value={passport.reputation.vouchesReceived} />
        </div>
      </div>
      
      <div className="benefits-preview">
        <h4>Your Benefits Here</h4>
        <BenefitsList passport={passport} />
      </div>
    </div>
  );
}
29.3 Federation Settings Panel
// User settings for federation consent
export function FederationSettings({ user, onUpdate }) {
  const [consent, setConsent] = useState(user.federationConsent);
  
  async function handleSave() {
    await fetch('/api/v4/user/me/federation-consent', {
      method: 'PATCH',
      body: JSON.stringify(consent)
    });
    onUpdate(consent);
  }
  
  return (
    <div className="federation-settings">
      <h3>Cross-Community Sharing</h3>
      <p>Control what other Closer communities can see about you.</p>
      
      <Toggle 
        label="Share my profile (name, avatar)"
        checked={consent.shareProfile}
        onChange={v => setConsent({...consent, shareProfile: v})}
      />
      
      <Toggle 
        label="Share my credentials (memberships, citizenships)"
        checked={consent.shareCredentials}
        onChange={v => setConsent({...consent, shareCredentials: v})}
      />
      
      <Toggle 
        label="Share my stay history"
        checked={consent.sharePresenceHistory}
        onChange={v => setConsent({...consent, sharePresenceHistory: v})}
      />
      
      <Toggle 
        label="Share my reputation score"
        checked={consent.shareReputation}
        onChange={v => setConsent({...consent, shareReputation: v})}
      />
      
      <button onClick={handleSave}>Save Preferences</button>
    </div>
  );
}

30. Implementation Roadmap
Phase
Deliverables
Q1 2026
Passport schema, email hash lookup, consent management, basic sync
Q2 2026
Closer Login button, passport display UI, benefit evaluation engine
Q3 2026
Multi-credential support, presence history sync, reputation aggregation
Q4 2026
Multi-hub federation, regional nodes, backup/failover
2027+
ZK-proof integration, on-chain credential minting, full Web3 passport

30.1 Migration Path to Web3 Passport
The Web2 passport is designed to seamlessly upgrade to on-chain credentials when users are ready:
	•	Email hash serves as deterministic wallet derivation seed (optional)
	•	Credentials can be minted as soulbound tokens on Celo
	•	ZK-proofs can replace email hash for enhanced privacy
	•	Web3 passport inherits all Web2 credentials automatically
	•	Users can choose to keep Web2, upgrade to Web3, or use both
— End of Web2 Passport & Federation Specification —
