# 🛡️ Personal Information Vault: Hackathon Pitch Script

**Duration:** 90 Seconds  
**Goal:** Stand out with adversarial thinking and novel PII protection features.

---

## 🎙️ The Script

### 1. The Hook (0:00 - 0:15)
"Most of us use password managers for Netflix or Wi-Fi. But your Aadhaar, your PAN, your medical history—they aren't just strings. They are your **identity**.  
When a password leaks, you reset it. When your identity leaks, there is no reset button. We built the **PiiVault Guard** to move beyond 'safe storage' and into **adversarial defense**."

### 2. Feature 1: Crypto-Shred Auto-Expiry (0:15 - 0:30)
"First: **Crypto-Shred Auto-Expiry**. Most systems 'delete' data by removing a pointer. We delete the **encryption keys**.  
If you share your Aadhaar for a hotel check-in, set it to expire in 2 days. The moment it hits that deadline, the keys are shredded. Even if our server is breached an hour later, your data is mathematically unrecoverable. **Privacy by design... and by deletion.**"

### 3. Feature 2: PII Reveal Risk Score (0:30 - 0:45)
"Second: **PII Reveal Risk Score**. Decryption is the moment of maximum risk.  
Our vault calculates a live 'Sensitivity + Usage' score. If you've revealed your PAN card five times this week, the app flashes a **Red Risk Warning**. It forces you to pause and ask: *'Wait, why am I sharing this again?'* We visualize the threat before you reveal the truth."

### 4. Feature 3: Zero-Trust Retrieval Pipeline (0:45 - 1:00)
"Third: **Zero-Trust Retrieval Pipeline**. Data is never stored in plaintext.  
Even when you view it, the decryption happens in volatile memory. We use AES-256-GCM authenticated encryption, ensuring that every time you access a record, its integrity is verified. If a single bit has been tampered with, the system locks down."

### 5. Feature 4: Encrypted Relationship Graph (1:00 - 1:15)
"Finally: **Encrypted Relationship Graph**. We don't just list your data; we map it.  
This graph visualizes your 'Digital Blast Radius'—grouping your Aadhaar, PAN, and Tax records into clusters. It identifies 'Data Hoarding' zones where one leak could expose your entire persona. We visualize the threat surface without ever touching the plaintext."

### 6. The Close (1:15 - 1:30)
"Judges, we aren't just storing values; we are managing **threat models**.  
This is the first vault that bridges the gap between academic crypto and real-world threats like coercion and data hoarding.  
**Secure your identity, don't just store it.**"

---

## 📽️ Bonus: Demo Moments

### 🚀 Demo 1: The "Risk Alert" Reveal
*   **Action:** Go to the PII Vault. Click the 'Reveal' button on an Aadhaar or PAN record that has a high access count.
*   **Visual Proof:** The table now shows a **"High Risk"** badge (Red). It visually proves the system tracks how often your most sensitive data is exposed.
*   **Key Phrase:** *"Look at the 'Reveal Risk' column—it's not just a table; it's a security advisor."*

### 🎭 Demo 2: The "Zero-Trust" Animation
*   **Action:** Go to the Login page and click the "How it Works? (Demo)" button.
*   **Visual Proof:** A step-by-step modal showing how data flows through our pipeline.
*   **Key Phrase:** *"Our users don't need to trust us blindly. They can see the 'Zero-Trust Pipeline' in action right from the login screen."*

---

## 🛠️ Code Support (Already Implemented for you!)
1.  **Risk Score Logic:** I've updated `Vault.tsx` to include a **Reveal Risk** column that dynamically changes color (Green/Yellow/Red) based on how many times you've decrypted a record.
2.  **Zero-Trust Demo:** I've integrated a real-time security walkthrough modal on the login page to build visual trust.
