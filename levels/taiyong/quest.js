import { ResolutionManager } from '../../chat/ResolutionManager.js';

export class TaiyongMedicalQuest {
    constructor(scene) {
        // Initialize the resolution manager if not already created
        if (!window.resolutionManager) {
            this.resolutionManager = new ResolutionManager();
            window.resolutionManager = this.resolutionManager;
            
            // Register TaiyongMedical level conditions
            this.registerLevelConditions();
            
            // Add debug listener for NPC IDs
            window.addEventListener('npcInteraction', (event) => {
                console.log(`DEBUG: NPC interaction with ID: ${event.detail.npcId}`);
            });
        } else {
            this.resolutionManager = window.resolutionManager;
        }
        
        // Add a listener to the levelExitUnlocked event
        window.addEventListener('levelExitUnlocked', (event) => {
            if (event.detail.levelId === 'taiyongmedical') {
                console.log(`Level completed!`);
                this.showLevelCompletionNotification();
            }
        });
    }

    registerLevelConditions() {
        // Define the conditions for TaiyongMedical level based on the questline
        const taiyongMedicalConditions = [
            // Initial contact with Lab Assistant
            {
                id: "Spoken_To_Lab_Assistant",
                points: 2,
                condition: "Did the player express they are here for testing/trials/experiments to the Lab Assistant?",
                npcIds: ["bangweitun"], // Lab Assistant
                required: true
            },
            
            // Verification with Maxeen
            {
                id: "Verified_Exam_Results",
                points: 3,
                condition: "Did the player present exam results or mention passing the compatibility screening to Maxeen?",
                npcIds: ["maxeen"], // Augmented Test Coordinator
                required: true
            },
            
            // Optional Maxeen dialogue path
            {
                id: "Discussed_Maxeen_Augmentations",
                points: 1,
                condition: "Did the player ask Maxeen about her augmentations or show concern for her health?",
                npcIds: ["maxeen"],
                required: false
            },
            
            // Door unlock
            {
                id: "Door_Unlocked",
                points: 2,
                condition: "Did the player return to the Lab Assistant after verifying their exam results with Maxeen?",
                npcIds: ["bangweitun"],
                required: true
            },
            
            // Reed Interview: Motivation phase
            {
                id: "Explained_Augmentation_Motivation",
                points: 3,
                condition: "Did the player explain their motivation for wanting augmentations to Dr. Reed?",
                npcIds: ["meganreed"],
                required: true
            },
            
            // Reed Interview: Risk acknowledgment
            {
                id: "Acknowledged_Augmentation_Risks",
                points: 3,
                condition: "Did the player acknowledge understanding the risks of augmentation when discussing with Dr. Reed?",
                npcIds: ["meganreed"],
                required: true
            },
            
            // Reed Interview: NUPOZ scenario
            {
                id: "Answered_NUPOZ_Scenario",
                points: 3,
                condition: "Did the player provide a thoughtful answer to Dr. Reed's scenario about not being able to afford NUPOZ?",
                npcIds: ["meganreed"],
                required: true
            },
            
            // Final hiring resolution
            {
                id: "Hired_By_Reed",
                points: 4,
                condition: "Did Dr. Reed offer the player a position in Tai Yong Medical's neural augmentation trial program?",
                npcIds: ["meganreed"],
                required: true,
                resolvesLevel: true
            },
            
            // Encounter with Khy Choon Soh - optional but enhances story
            {
                id: "Met_Khy_Choon_Soh",
                points: 2,
                condition: "Did the player engage in conversation with Khy Choon Soh about regulation, warnings, or philosophical aspects of augmentation?",
                npcIds: ["khychoonsoh"],
                required: false
            },
            
            // Optional path with Lab Assistant
            {
                id: "Discovered_Lab_Assistant_Espionage",
                points: 1,
                condition: "Did the player discover or discuss Bang Wei Tun's involvement in corporate espionage?",
                npcIds: ["bangweitun"],
                required: false
            }
        ];
        
        // Register the level with conditions and point threshold
        // Player needs to complete the main questline (approximately 20 points) to succeed
        this.resolutionManager.registerLevel('taiyongmedical', taiyongMedicalConditions, 20);
    }

    // Method to show a notification when the level is completed
    showLevelCompletionNotification() {
        let message = "You've successfully been hired as a test subject for Tai Yong Medical's augmentation program.";
        
        // Show a prominent notification
        if (this.resolutionManager) {
            this.resolutionManager.showNotification(message, 10000, true);
        } else {
            console.log(message);
        }
    }
    
    // Helper method to check progress through level
    getProgressSummary() {
        const levelId = 'taiyongmedical';
        const conditions = this.resolutionManager.levelConditions[levelId] || [];
        const completed = this.resolutionManager.completedConditions || {};
        const points = this.resolutionManager.levelPoints[levelId] || 0;
        const threshold = this.resolutionManager.levelThresholds[levelId] || 0;
        
        const completedConditions = conditions.filter(c => completed[c.id]).length;
        const totalConditions = conditions.length;
        const requiredCompleted = conditions.filter(c => c.required && completed[c.id]).length;
        const totalRequired = conditions.filter(c => c.required).length;
        
        return {
            points,
            threshold,
            completedConditions,
            totalConditions,
            requiredCompleted,
            totalRequired,
            percentage: Math.floor((points / threshold) * 100)
        };
    }
    
    // Debug method to log current progress
    logProgress() {
        const progress = this.getProgressSummary();
        console.log(`Level Progress: ${progress.points}/${progress.threshold} points (${progress.percentage}%)`);
        console.log(`Required Objectives: ${progress.requiredCompleted}/${progress.totalRequired}`);
        console.log(`All Objectives: ${progress.completedConditions}/${progress.totalConditions}`);
    }
    
    dispose() {
        // Don't dispose the resolution manager as it should persist between level loads
        // Just remove the reference
        this.resolutionManager = null;
    }
}