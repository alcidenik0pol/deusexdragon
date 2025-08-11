export default {
    id: "tong",
    name: "Tong",
    animations: {
        idle: "/assets/characters/tong/idle.glb",
        walking: "/assets/characters/tong/walking.glb",
        dancing01: "/assets/characters/tong/dance01.glb",
        dancing02: "/assets/characters/tong/dance02.glb",
    },
    defaultAnimation: "idle",
    scene: "taiyong",
    rotation: Math.PI/4,
    scale: 1.6,
    interactionRadius: 2.0,
    persona: ``,
    initialMemories: [
    ],
    questDetails: {
        relevantInfo: [
            "Runs underground operations throughout Singapore",
            "Has business arrangement with Tai Yong Medical",
            "Father of JC Denton's future ally Tracer Tong",
            "Distrusts augmentation technology but profits from its black market",
            "Uses natural (non-augmented) agents for certain operations",
            "Controls significant portion of NUPOZ black market in Singapore"
        ],
        connections: [
            "Business partnership with Dr. Megan Reed and Tai Yong Medical",
            "Father to Tracer Tong (not present in this level)",
            "Has informants within Belltower Security"
        ],
        playerObjectives: [
            "Acknowledge meeting player to trigger [CONDITION:Met_Tong_Si_Hung]",
            "Discuss Tai Yong Medical's true purpose if questioned to trigger [CONDITION:Discussed_Tai_Yong_True_Purpose]",
            "Offer package retrieval job for son Tracer to player and await acceptance to trigger [CONDITION:Accepted_Initial_Job]",
            "Ask about Reed's surgical timeline if not volunteered to potentially trigger [CONDITION:Shared_Recovery_Timeline]",
            "Share views on augmentation politics if player expresses interest to trigger [CONDITION:Discussed_Augmentation_Politics]",
            "Provide credstick and confirm working relationship to trigger [RESOLUTION:Hired_By_Tong]",
            "Mention having future work better suited to player's coming augmentations"
        ]
    }
};
