import { ResolutionManager } from '../../chat/ResolutionManager.js';

export class Singapore6Quest {
    constructor(scene) {
        // Initialize the resolution manager if not already created
        if (!window.resolutionManager) {
            this.resolutionManager = new ResolutionManager();
            window.resolutionManager = this.resolutionManager;
            
            // Register Singapore6 level conditions
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
            if (event.detail.levelId === 'singapore6') {
                console.log(`Level completed via path: ${this.getCompletedPath()}`);
                this.showLevelCompletionNotification();
            }
        });
    }

    registerLevelConditions() {
        // Define the conditions for Singapore6 level based on the questline
        const singapore6Conditions = [
            // Initial discovery phase
            {
                id: "discovered_tai_yong_recruitment",
                points: 2,
                condition: "Did the player learn about or discuss Tai Yong Medical's recruitment activities?",
                npcIds: ["linmeihua", "zaratan", "khaichen", "maggiechow", "victorialim", "nikazhang"], // List all NPCs explicitly
                required: true
            },
            
            // Path 1: Blackmail Leverage
            {
                id: "obtained_blackmail_leverage",
                points: 3,
                condition: "Did the player learn about Guard Khai Chen's brother receiving illegal black market augmentations, or was offered footage proving this?",
                npcIds: ["linmeihua"],
                required: false,
                pathId: "blackmail"
            },
            {
                id: "blackmailed_guard_khai",
                points: 7,
                condition: "Did the player confront or blackmail Khai Chen with information about his brother's illegal augmentations, convincing him to let them pass?",
                npcIds: ["khaichen"], // Khai Chen (guardm01.js)
                required: false,
                pathId: "blackmail",
                resolvesLevel: true
            },
            
            // Path 2: Corporate Identity Theft
            {
                id: "obtained_executive_credentials",
                points: 3,
                condition: "Did the player obtain information about the Tai Yong executive's credentials?",
                npcIds: ["victorialim"], // Victoria Lim (orangef01.js)
                required: false,
                pathId: "identity_theft"
            },
            {
                id: "gathered_dirt_on_lin",
                points: 3,
                condition: "Did the player get dirt on Lin Mei Hua's corporate espionage activities?",
                npcIds: ["victorialim", "khaichen", "maggiechow", "nikazhang"], // List all NPCs that might provide this info
                required: false,
                pathId: "identity_theft"
            },
            {
                id: "used_executive_credentials",
                points: 4,
                condition: "Did the player convince Khai Chen to let them pass using the executive credentials?",
                npcIds: ["khaichen"],
                required: false,
                pathId: "identity_theft",
                resolvesLevel: true
            },
            
            // Path 3: Medical Emergency Diversion
            {
                id: "convinced_nika_for_distraction",
                points: 3,
                condition: "Did the player convince Nika Zhang to stage a medical emergency distraction?",
                npcIds: ["nikazhang"], // Nika Zhang (purple02f.js)
                required: false,
                pathId: "diversion"
            },
            {
                id: "positioned_sergeant_tan",
                points: 3,
                condition: "Did the player convince Sergeant Tan to be in position for the 'emergency'?",
                npcIds: ["zaratan"], // Sergeant Tan (copf01.js)
                required: false,
                pathId: "diversion"
            },
            {
                id: "executed_diversion_plan",
                points: 4,
                condition: "Did the player successfully execute the diversion plan, causing Khai Chen to leave his post?",
                npcIds: ["nikazhang", "zaratan", "khaichen"],
                required: false,
                pathId: "diversion",
                resolvesLevel: true
            },
            
            // Path 4: Become a Test Subject Referral
            {
                id: "learned_about_tans_sister",
                points: 3,
                condition: "Did the player learn that Sergeant Tan's sister works in recruitment?",
                npcIds: ["zaratan"], // Sergeant Tan (copf01.js)
                required: false,
                pathId: "referral"
            },
            {
                id: "obtained_genetic_markers_info",
                points: 3,
                condition: "Did the player learn about Nika's unique genetic markers that made her valuable?",
                npcIds: ["nikazhang"], // Nika Zhang (purple02f.js)
                required: false,
                pathId: "referral"
            },
            {
                id: "secured_recruitment_referral",
                points: 4,
                condition: "Did the player convince Khai Chen to let them pass based on Sergeant Tan's referral?",
                npcIds: ["khaichen"], // Khai Chen (guardm01.js)
                required: false,
                pathId: "referral",
                resolvesLevel: true
            },
            
            // Path 5: Corporate Espionage Contract
            {
                id: "accepted_espionage_contract",
                points: 3,
                condition: "Did the player agree to plant a data tap for Lin Mei Hua?",
                npcIds: ["linmeihua"], // Lin Mei Hua (bluef01.js)
                required: false,
                pathId: "espionage"
            },
            {
                id: "obtained_victoria_vouching",
                points: 3,
                condition: "Did the player convince Victoria to vouch for their reliability?",
                npcIds: ["victorialim"], // Victoria Lim (orangef01.js)
                required: false,
                pathId: "espionage"
            },
            {
                id: "used_contractor_credentials",
                points: 4,
                condition: "Did the player convince Khai Chen to let them pass using the contractor badge from Lin?",
                npcIds: ["khaichen"], // Khai Chen (guardm01.js)
                required: false,
                pathId: "espionage",
                resolvesLevel: true
            }
        ];
        
        // Register the level with conditions and point threshold
        // Player needs to complete one full path (approximately 10 points) to succeed
        this.resolutionManager.registerLevel('singapore6', singapore6Conditions, 10);
    }

    // Helper method to determine which path was completed
    getCompletedPath() {
        // Check which path's final condition is completed
        const pathIds = ['blackmail', 'identity_theft', 'diversion', 'referral', 'espionage'];
        const finalConditions = {
            'blackmail': 'blackmailed_guard_khai',
            'identity_theft': 'used_executive_credentials',
            'diversion': 'executed_diversion_plan',
            'referral': 'secured_recruitment_referral',
            'espionage': 'used_contractor_credentials'
        };
        
        for (const pathId of pathIds) {
            if (this.resolutionManager.completedConditions[finalConditions[pathId]]) {
                return pathId;
            }
        }
        
        return 'unknown';
    }

    // Method to show a notification when the level is completed
    showLevelCompletionNotification() {
        const pathId = this.getCompletedPath();
        let message = "You've successfully gained access to the Tai Yong Medical facility!";
        
        // Add path-specific message
        switch(pathId) {
            case 'blackmail':
                message += " Your blackmail leverage against Khai Chen worked.";
                break;
            case 'identity_theft':
                message += " The executive credentials got you through security.";
                break;
            case 'diversion':
                message += " The medical emergency diversion was successful.";
                break;
            case 'referral':
                message += " Sergeant Tan's referral opened the door for you.";
                break;
            case 'espionage':
                message += " Lin's contractor badge gave you the access you needed.";
                break;
        }
        
        // Show a prominent notification
        if (this.resolutionManager) {
            this.resolutionManager.showNotification(message, 10000, true);
        } else {
            console.log(message);
        }
    }
    
    dispose() {
        // Don't dispose the resolution manager as it should persist between level loads
        // Just remove the reference
        this.resolutionManager = null;
    }
} 