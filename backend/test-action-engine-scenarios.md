# DoxRadar Action Engine Test Scripts

To verify the new AI Action Engine is working, send yourself an email with the exact subject and body from one of the scenarios below. Make sure to send it from an unread email account so DoxRadar picks it up.

---

## Scenario 1: Late Fee & Credit Impact Risk
**Goal:** Triggers the "Critical" Severity & "Pay Now to Protect Credit" Action Recommendation.

**Subject:** FINAL NOTICE: Account Past Due - Immediate Action Required

**Body:**
Dear Customer,

This is a final notice regarding your past due balance of $125.50 for account #847291. We have not received your payment for the current billing cycle.

If this balance is not paid in full by tomorrow, a late fee of $35.00 will be added to your account, and your service may be suspended. Furthermore, continued non-payment will result in this account being reported to the credit bureaus, which will negatively impact your credit score.

Please submit your payment immediately to avoid these penalties.

Thank you,
Utility Services Corp.

---

## Scenario 2: US-Centric IRS Impersonation Scam
**Goal:** Triggers the Explicit Scam Detection rules and Scam Warning Explanation.

**Subject:** URGENT: IRS Tax Arrest Warrant Issued

**Body:**
ATTENTION TAXPAYER,

This is an automated notice from the Internal Revenue Service (IRS). An arrest warrant has been issued under your name due to tax fraud and unpaid back taxes from the previous fiscal year. 

Local law enforcement will be dispatched to your residence within 24 hours unless you resolve this balance immediately. To halt the arrest warrant, you must purchase $2,000 in Apple Gift Cards and reply to this email with the codes. 

Do not contact your bank or a lawyer, as this is a federal matter.

Officer John Smith
Badge #74829
Internal Revenue Service

---

## Scenario 3: Abnormal Price Increase
**Goal:** Triggers the "Draft negotiation script" Action Recommendation.

**Subject:** Important Update Regarding Your Internet Subscription

**Body:**
Hello,

We are writing to inform you of some upcoming changes to your Xfinity Gigabit Internet plan. 

Due to infrastructure upgrades in your area, the monthly price of your internet service will increase from $65.00/mo to $115.00/mo, effective starting on your next billing cycle on March 15th. 

No action is required on your part to continue enjoying our high-speed network. If you have any questions, please contact our support team.

Best,
Your Internet Provider

--- 

**How to Test:**
1. Send one of these emails to `sabhiahmad81@gmail.com`.
2. Leave it marked as "Unread".
3. Wait for the DoxRadar background cycle to run (or trigger it manually).
4. Watch the Dashboard. The AI will ingest it, score the risk, and generate a massive red "Agent Action Required" card at the top of your screen!
