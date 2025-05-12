import { ResolutionManager } from '../../quest/ResolutionManager.js';

export class NightClubQuest {
    constructor(scene) {
        // Initialize the resolution manager if not already created
        this.resolutionManager = window.resolutionManager || new ResolutionManager();
        window.resolutionManager = this.resolutionManager;
        
        // Always register conditions for this level
        this.registerLevelConditions();
        
        // Add debug listener for NPC IDs
        window.addEventListener('npcInteraction', (event) => {
            console.log(`DEBUG: NPC interaction with ID: ${event.detail.npcId}`);
        });
        
        // Add a listener to the levelExitUnlocked event
        window.addEventListener('levelExitUnlocked', (event) => {
            if (event.detail.levelId === 'nightclub') {
                console.log(`Level completed!`);
                this.showLevelCompletionNotification();
            }
        });
    }

    registerLevelConditions() {
        // Define the conditions for NightClub level based on the questline
        const nightClubConditions = [
            // Initial encounter with Tong
            {
                id: "Met_Tong_Si_Hung",
                points: 2,
                condition: "Did the player meet and have an initial conversation with Tong Si Hung?",
                npcIds: ["tong"],
                required: true
            },
            
            // Optional discussion about Tai Yong's true purpose
            {
                id: "Discussed_Tai_Yong_True_Purpose",
                points: 3,
                condition: "Did Tong and the player discuss what Tai Yong Medical actually does with its subjects beyond 'medical research'?",
                npcIds: ["tong"],
                required: false
            },
            
            // Accept the package retrieval job
            {
                id: "Accepted_Initial_Job",
                points: 5,
                condition: "Did the player agree to retrieve a package from a Belltower security checkpoint for Tong?",
                npcIds: ["tong"],
                required: true
            },
            
            // Optional discussion about recovery timeline
            {
                id: "Shared_Recovery_Timeline",
                points: 3,
                condition: "Did the player share information about their augmentation surgery recovery timeline with Tong?",
                npcIds: ["tong"],
                required: false
            },
            
            // Optional discussion about augmentation politics
            {
                id: "Discussed_Augmentation_Politics",
                points: 4,
                condition: "Did the player and Tong discuss political aspects of augmentation technology, including Tong's views on NUPOZ control?",
                npcIds: ["tong"],
                required: false
            },
            
            // Final resolution - getting hired by Tong
            {
                id: "Hired_By_Tong",
                points: 8,
                condition: "Did Tong give the player a credstick as payment and confirm he'll have future work for them after their augmentation surgery?",
                npcIds: ["tong"],
                required: true,
                resolvesLevel: true
            }
        ];
        
        // Register the level with conditions and point threshold
        // Player needs to complete the main questline (15 points) to succeed
        this.resolutionManager.registerLevel('nightclub', nightClubConditions, 15);
    }

    // Method to show a notification when the level is completed
    showLevelCompletionNotification() {
        let message = "You've successfully been hired by Tong Si Hung. Press 'P' to see the credits.";
        
        // Show a prominent notification
        if (this.resolutionManager) {
            this.resolutionManager.showNotification(message, 10000, true);
        } else {
            console.log(message);
        }
    }
    
    // Helper method to check progress through level
    getProgressSummary() {
        const levelId = 'nightclub';
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