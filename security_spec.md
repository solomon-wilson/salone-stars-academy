# Security Specification & Threat Model-Driven Testing: Salone Stars Academy

## 1. Data Invariants

1. **Role Separation & Ownership**:
   - A `Teacher` document can only be registered if the authenticated user (`request.auth.uid`) matches the document ID.
   - A `Pupil` record can only be read, created, or updated by their respective teacher or by the unified pupil themselves.
   
2. **Subscription Tier Enforcement**:
   - Access to team configuration, team sharing, and school owner operations requires `subscriptionPlan == "team"`.
   - Access to custom curriculum uploads requires either `subscriptionPlan == "individual"` or `subscriptionPlan == "team"`. Free tier teachers are restricted to standard preloaded curriculum content.
   
3. **Temporal Integrity**:
   - Every transaction write MUST register actual server time via `request.time`. Unverified, client-clock-biased payloads are rejected.

4. **Safety from Mutability Leaks**:
   - `stripeCustomerId` and `subscriptionPlan` can ONLY be modified by administrative channels or system tasks. Normal client update payloads containing these fields are blocked.

---

## 2. The "Dirty Dozen" Invalidation Spec

We define 12 malicious payload patterns that MUST be rejected by the security boundaries of the datastore.

1. **Self-Service Premium (Integrity Violation)**:
   - *Payload*: `update /users/hackerUser { subscriptionPlan: "team" }`
   - *Result*: PERMISSION_DENIED.

2. **Curriculum Ransomware (Identity Spoofing)**:
   - *Payload*: `create /curriculums/malicious_schema { teacherId: "legitTeacher" }` by user `unauthenticatedHacker`
   - *Result*: PERMISSION_DENIED.

3. **Orphan Pupil Spill (Identity Poisoning)**:
   - *Payload*: `create /pupils/junk_id { name: "A", class_level: "Class 1", teacherId: "hacker" }` using a 10MB string as the document ID.
   - *Result*: PERMISSION_DENIED.

4. **Leaderboard Spoofing (Competition Integrity)**:
   - *Payload*: `update /pupils/targetStudent { points: 99999 }` by an unlinked user.
   - *Result*: PERMISSION_DENIED.

5. **Stripe Billing Hijack (Financial Sabotage)**:
   - *Payload*: `update /users/legitTeacher { stripeCustomerId: "hacker_customer_id" }`
   - *Result*: PERMISSION_DENIED.

6. **State Backtracking (Chronology Attack)**:
   - *Payload*: `update /pupils/studentA { last_active_date: "2010-01-01" }` with an ancient client date.
   - *Result*: PERMISSION_DENIED.

7. **Anonymous Curriculum Creation**:
   - *Payload*: `create /curriculums/curricul_1` without a valid Firebase Auth authentication token.
   - *Result*: PERMISSION_DENIED.

8. **Overwriting System Metadata on Quests**:
   - *Payload*: `update /quests/quest_123 { source: "default" }` trying to convert generated content into protected systemic quests.
   - *Result*: PERMISSION_DENIED.

9. **Double-Badge Award Escalation**:
   - *Payload*: `update /pupils/studentA { badges_earned: ["Bai Bureh Brave", "Bai Bureh Brave"] }` trying to stack multiple duplicate badges.
   - *Result*: PERMISSION_DENIED.

10. **Foreign Pupil Listing (Privacy Leak)**:
    - *Payload*: `list /pupils` listing kids without a `where("teacherId", "==", request.auth.uid)` filter.
    - *Result*: PERMISSION_DENIED.

11. **Quest Destruction**:
    - *Payload*: `delete /quests/any_quest` by non-admin or unauthenticated accounts.
    - *Result*: PERMISSION_DENIED.

12. **Tampering with Registration Chronology**:
    - *Payload*: `update /users/teacher123 { createdAt: "2020-01-01" }`
    - *Result*: PERMISSION_DENIED.
