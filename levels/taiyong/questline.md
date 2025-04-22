# Taiyong Medical Building - Level 2 Questline

## Initial Phase: Building Entry
Player arrives at Taiyong Medical Building after completing Level 1. The sleek, corporate medical facility contrasts with the gritty streets outside. Security scanners and corporate logos dominate the sterile environment.

## Quest Structure

### Stage 1: Lab Assistant Verification
**Key NPC:** Bang Wei Tun (Lab Assistant)

**Initial Dialogue:**
- "Welcome to Taiyong Medical. Do you have an appointment?"
- "I don't see your name in our system. What brings you here today?"

[CONDITION: Player must mention they're here for testing/trials/experiments]
- "Ah, you're interested in our current augmentation compatibility program? You'll need to complete two steps before meeting Dr. Reed."
- "First, speak with Maxeen in the testing room down the hall. She'll verify your genetic compatibility results."
- "After that, return to me for final verification before I can grant you access to Dr. Reed's office."

[RESOLUTION: Spoken_To_Lab_Assistant]

### Stage 2: Implant Exam Verification
**Key NPC:** Maxeen (Augmented Test Coordinator)

**Initial Dialogue:**
- "Another candidate? Let me guess - you're here for the credits, not the 'evolutionary advancement' they keep advertising."
- "I've been through the process. The enhancements are real, but so are the side effects they don't mention in the brochures."

[CONDITION: Player must present exam results / mention passing the compatibility screening]
- "Let me check your genetic profile... Interesting. Your markers show exceptional compatibility with neural interfaces."
- "Your rejection risk is remarkably low. Dr. Reed will definitely want to see you."
- "I've uploaded your results to the system. Head back to Wei Tun for clearance to see Reed."

[OPTIONAL CONDITION: Player asks about Maxeen's augmentations]
- "Mine? Neural reflexes, optical enhancements, and muscle fiber reinforcement. The implants work great, but the NUPOZ dependency is the real cost."
- "I'm on double the recommended dosage now. Tai Yong provides it as part of my 'compensation package'. Just read the contract carefully if you proceed."

[RESOLUTION: Verified_Exam_Results]

### Stage 3: Access Authorization
**Return to Bang Wei Tun**

[CONDITION: Must have Spoken_To_Lab_Assistant AND Verified_Exam_Results]
- "I see Maxeen has confirmed your compatibility profile. Very impressive results."
- "Dr. Reed has been looking for candidates with your specific markers. I'll unlock her office for you now."
- "Remember, this is still an interview. Dr. Reed makes the final decisions on all test subjects."

[RESOLUTION: Door_Unlocked]

### Stage 4: The Interview
**Key NPC:** Dr. Megan Reed (Tai Yong Research Director)

**Initial Dialogue:**
- "Please, take a seat. I've been reviewing your genetic profile with great interest."
- "Your compatibility markers are in the top percentile of candidates we've screened in Singapore. But technical suitability is only one factor in my selection process."
- "I need to understand your motivations. Why are you willing to modify your body with our experimental augmentations?"

**The Interview Tree:**

#### Motivation Questioning
[CONDITION: Player must explain why they want augmentations]

**Option Paths:**
1. **Financial Need Path**
   - Reed: "So you're primarily motivated by the compensation? That's refreshingly honest."
   - Reed: "Many candidates try to convince me they're passionate about 'human advancement' when they clearly just need the credits."
   - Reed: "But I need to know you understand the commitment. These aren't temporary modifications we're talking about."
   
   [CONDITION: Player must acknowledge understanding of permanent changes]
   - "Good. I appreciate candidates who approach this pragmatically."

2. **Enhancement Belief Path**
   - Reed: "You believe augmentation represents the next step in human evolution? That's a perspective I share."
   - Reed: "However, many who romanticize augmentation technology haven't considered its societal implications."
   
   [CONDITION: Player must discuss societal impact of augmentations]
   - "Thoughtful analysis. The augmentation divide is already reshaping society faster than our ethical frameworks can adapt."

3. **Personal Improvement Path**
   - Reed: "You see this as a way to overcome your natural limitations? To become more than what genetics dictated?"
   - Reed: "That drive for self-improvement is exactly what we look for in candidates."
   
   [CONDITION: Player must specify what limitations they want to overcome]
   - "Your ambition is admirable. Our implants could certainly help you achieve those goals."

#### Risk Assessment Phase
Reed: "Let me be direct. Our neural interface augmentations carry risks that our competitors don't adequately disclose to their subjects."

[CONDITION: Player must ask about or acknowledge risks]

Reed: "Besides the obvious rejection risk, which your genetic profile suggests is minimal, there's the neuroplasticity adjustment period."

Reed: "Some subjects experience personality shifts, memory fragmentation, or sensory processing disruptions during integration."

Reed: "And of course, all augmentations require NUPOZ to prevent rejection. It's a lifetime commitment to medication that some find... challenging to maintain."

[CONDITION: Player must demonstrate willingness to accept these risks]

#### Final Decision Criteria

Reed: "Before making my decision, there's one more scenario I present to all candidates."

Reed: "Your augmentations function perfectly, but six months later, you can no longer afford NUPOZ. What would you do?"

**Option Paths:**
1. **Pragmatic Solution Path**
   - Player suggests practical solutions (contracts, payment plans, alternative work)
   - Reed: "A realistic approach. Many subjects don't consider the long-term economics."

2. **Desperate Measures Path**
   - Player suggests black market or questionable means
   - Reed: "Candid, if concerning. At least you've thought through the worst-case scenarios."

3. **Idealistic Solution Path**
   - Player suggests societal changes or support systems
   - Reed: "Optimistic. I admire that, even if reality rarely matches our ideals."

[CONDITION: Player must provide a thoughtful answer to the NUPOZ scenario]

**Final Decision:**
Reed: "I believe you understand what you're signing up for. Not just the enhancements, but the commitment that follows."

Reed: "Tai Yong Medical would like to offer you a position in our neural augmentation trial program. The compensation package includes 15,000 credits upfront, with performance bonuses for successful integration milestones."

Reed: "Initial procedures will begin next week. I suggest you use this time to prepare your affairs. Integration recovery typically requires 2-3 weeks of limited activity."

Reed: "My assistant will provide the contract details. Welcome to the program, Mr. Denton."

[RESOLUTION: Hired_By_Reed]

### Stage 5: Unexpected Encounter
**As player leaves Reed's office**

**Key NPC:** Khy Choon Soh (Government Regulator)

**Initial Dialogue:**
- "Another recruit for Reed's experiments? You have the same look they all do - desperate hope mixed with poorly disguised fear."
- "My name is Khy Choon Soh. I observe Tai Yong's operations for the Ministry of Human Potential."

**Conversation Branches:**

1. **Regulatory Oversight**
   - "The government maintains strict oversight of augmentation development. At least, that's what my reports say."
   - "The reality? Companies like Tai Yong operate in gray areas faster than legislation can define them."
   - "My job is to ensure their experimentation doesn't cross certain lines. The challenge is determining where those lines should be."

2. **Personal Warning**
   - "I've seen hundreds like you pass through these doors. The fortunate ones leave with functioning augmentations."
   - "The unfortunate ones? They don't technically die. They just lose pieces of themselves until what remains hardly qualifies as the person who walked in."
   - "Reed's brilliant, but her brilliance serves corporate interests, not your wellbeing."

3. **Philosophical Reflection**
   - "Humanity stands at a threshold that, once crossed, cannot be uncrossed."
   - "These augmentations you seek - they aren't simply tools. They redefine what it means to be human."
   - "Some believe this is evolution. Others call it extinction by transformation. I'm still deciding which view I hold."

4. **Cryptic Foreshadowing**
   - "Paul Denton... that name will carry weight someday, though not for reasons you might expect."
   - "There are patterns in your genetic markers that interest more parties than just Tai Yong Medical."
   - "When they approach you - and they will - remember that every offer has hidden costs."

[No resolution required - this is exposition/world-building dialogue]



## Success Criteria
For the player to complete the level successfully, they must:

1. [CONDITION: Spoken_To_Lab_Assistant]
2. [CONDITION: Verified_Exam_Results]
3. [CONDITION: Door_Unlocked]
4. During Interview with Dr. Reed:
   - [CONDITION: Explain motivation for augmentation]
   - [CONDITION: Acknowledge understanding of risks]
   - [CONDITION: Provide answer to NUPOZ scenario]
5. [RESOLUTION: Hired_By_Reed]

