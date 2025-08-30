// Iron Turtle Challenge - Activities Database
// Digitized from the physical scoring sheet

const ACTIVITIES = {
    consumables: [
        // Drinks
        {
            id: "beer",
            name: "Beer",
            basePoints: 1,
            category: "drink",
            multiplierEligible: ["boat", "water", "leavenworth", "hottub", "towing", "usc", "deck", "latenight", "island"]
        },
        {
            id: "seltzer",
            name: "Seltzer",
            basePoints: 0.5,
            category: "drink",
            multiplierEligible: ["boat", "water", "leavenworth", "hottub", "towing", "usc", "deck", "latenight", "island"]
        },
        {
            id: "shot",
            name: "Shot",
            basePoints: 2,
            category: "drink",
            multiplierEligible: ["boat", "water", "leavenworth", "hottub", "towing", "usc", "deck", "latenight", "island"]
        },
        {
            id: "wine",
            name: "Glass of Wine",
            basePoints: 3,
            category: "drink",
            multiplierEligible: ["boat", "water", "leavenworth", "hottub", "towing", "usc", "deck", "latenight", "island"]
        },
        {
            id: "cocktail",
            name: "Cocktail/Mimosa",
            basePoints: 3,
            category: "drink",
            multiplierEligible: ["boat", "water", "leavenworth", "hottub", "towing", "usc", "deck", "latenight", "island"]
        },
        {
            id: "bloody_mary",
            name: "Bloody Mary",
            basePoints: 5,
            category: "drink",
            multiplierEligible: ["boat", "water", "leavenworth", "hottub", "towing", "usc", "deck", "latenight", "island"]
        },
        {
            id: "fourloko_voluntary",
            name: "Voluntary 4Loko",
            basePoints: 5,
            category: "drink",
            multiplierEligible: ["boat", "water", "leavenworth", "hottub", "towing", "usc", "deck", "latenight", "island"]
        },
        {
            id: "beer_shotgun",
            name: "Shotgun a Beer",
            basePoints: 5,
            category: "drink",
            multiplierEligible: ["boat", "water", "leavenworth", "hottub", "towing", "usc", "deck", "latenight", "island"]
        },
        {
            id: "beer_caveman",
            name: "Caveman a Beer",
            basePoints: 10,
            category: "drink",
            multiplierEligible: ["boat", "water", "leavenworth", "hottub", "towing", "usc", "deck", "latenight", "island"]
        },
        {
            id: "fourloko_shotgun",
            name: "Shotgun a 4Loko",
            basePoints: 20,
            category: "drink",
            multiplierEligible: ["boat", "water", "leavenworth", "hottub", "towing", "usc", "deck", "latenight", "island"]
        },

        // Food
        {
            id: "hot_dog",
            name: "Hot Dog/Sausage",
            basePoints: 5,
            category: "food",
            multiplierEligible: ["boat", "water", "leavenworth", "hottub", "towing", "usc", "deck", "latenight", "island"]
        },
        {
            id: "burger",
            name: "Burger/Sandwich",
            basePoints: 5,
            category: "food",
            multiplierEligible: ["boat", "water", "leavenworth", "hottub", "towing", "usc", "deck", "latenight", "island"]
        },
        {
            id: "milkshake",
            name: "Milkshake",
            basePoints: 5,
            category: "food",
            multiplierEligible: ["boat", "water", "leavenworth", "hottub", "towing", "usc", "deck", "latenight", "island"]
        },
        {
            id: "taco",
            name: "Taco/Quesadilla",
            basePoints: 5,
            category: "food",
            multiplierEligible: ["boat", "water", "leavenworth", "hottub", "towing", "usc", "deck", "latenight", "island"]
        },
        {
            id: "pretzel",
            name: "Soft Pretzel",
            basePoints: 5,
            category: "food",
            multiplierEligible: ["boat", "water", "leavenworth", "hottub", "towing", "usc", "deck", "latenight", "island"]
        },
        {
            id: "washington_apple",
            name: "Washington Apple",
            basePoints: 5,
            category: "food",
            multiplierEligible: ["boat", "water", "leavenworth", "hottub", "towing", "usc", "deck", "latenight", "island"]
        },
        {
            id: "smore",
            name: "S'more",
            basePoints: 5,
            category: "food",
            multiplierEligible: ["boat", "water", "leavenworth", "hottub", "towing", "usc", "deck", "latenight", "island"]
        },
        {
            id: "aplet_cotlet",
            name: "Aplet/Cotlet",
            basePoints: 5,
            category: "food",
            multiplierEligible: ["boat", "water", "leavenworth", "hottub", "towing", "usc", "deck", "latenight", "island"]
        },
        {
            id: "huckleberry_ice_cream",
            name: "Huckleberry Ice Cream",
            basePoints: 10,
            category: "food",
            multiplierEligible: ["boat", "water", "leavenworth", "hottub", "towing", "usc", "deck", "latenight", "island"]
        },
        {
            id: "gas_station_meat_stick",
            name: "Gas Station Meat Stick",
            basePoints: 15,
            category: "food",
            multiplierEligible: ["boat", "water", "leavenworth", "hottub", "towing", "usc", "deck", "latenight", "island"]
        }
    ],

    competitions: [
        {
            id: "beer_die",
            name: "Beer Die",
            winPoints: 30,
            lossPoints: 10,
            category: "competition",
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        },
        {
            id: "beer_pong",
            name: "Beer Pong",
            winPoints: 30,
            lossPoints: 10,
            category: "competition",
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        },
        {
            id: "cards",
            name: "Cards",
            winPoints: 30,
            lossPoints: 10,
            category: "competition",
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        },
        {
            id: "cornhole",
            name: "Cornhole",
            winPoints: 30,
            lossPoints: 10,
            category: "competition",
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        },
        {
            id: "spikeball",
            name: "Spikeball",
            winPoints: 30,
            lossPoints: 10,
            category: "competition",
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        },
        {
            id: "ping_pong",
            name: "Ping Pong",
            winPoints: 30,
            lossPoints: 10,
            category: "competition",
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        },
        {
            id: "basketball_3on3",
            name: "3 on 3 Basketball",
            winPoints: 30,
            lossPoints: 10,
            category: "competition",
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        },
        {
            id: "pickleball",
            name: "Pickleball",
            winPoints: 30,
            lossPoints: 10,
            category: "competition",
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        }
    ],

    tasks: [
        // Individual Sports (one time only)
        {
            id: "bb_gun_hit_near_goose",
            name: "BB Gun - Hit Near Goose",
            basePoints: 15,
            category: "task",
            oneTimeOnly: true,
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        },
        {
            id: "bb_gun_scare_goose",
            name: "BB Gun - Scare Away Goose",
            basePoints: 50,
            category: "task",
            oneTimeOnly: true,
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        },
        {
            id: "cliff_jump_natalie",
            name: "Cliff Jump - Natalie's Rock",
            basePoints: 30,
            category: "task",
            oneTimeOnly: true,
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        },
        {
            id: "cliff_jump_prom",
            name: "Cliff Jump - Prom Rock",
            basePoints: 30,
            category: "task",
            oneTimeOnly: true,
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        },
        {
            id: "hike_turtle_rock",
            name: "Hike Turtle Rock to Top",
            basePoints: 50,
            category: "task",
            oneTimeOnly: true,
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        },
        {
            id: "paddleboard_lap_island",
            name: "Paddleboard/Kayak Lap Island",
            basePoints: 50,
            category: "task",
            oneTimeOnly: true,
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        },
        {
            id: "swim_to_island",
            name: "Swim to/from Turtle Rock Island",
            basePoints: 100,
            category: "task",
            oneTimeOnly: true,
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        },

        // Boat Sports (one time only)
        {
            id: "waterski_try",
            name: "Waterski - Try",
            basePoints: 10,
            category: "task",
            oneTimeOnly: true,
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        },
        {
            id: "waterski_two_skis",
            name: "Waterski - Get Up on 2 Skis",
            basePoints: 20,
            category: "task",
            oneTimeOnly: true,
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        },
        {
            id: "waterski_slalom",
            name: "Waterski - Get Up on Slalom",
            basePoints: 30,
            category: "task",
            oneTimeOnly: true,
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        },
        {
            id: "waterski_rooster_tail",
            name: "Waterski - Overhead Rooster Tail",
            basePoints: 10,
            category: "task",
            oneTimeOnly: true,
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        },
        {
            id: "waterski_no_hands",
            name: "Waterski - No Hands",
            basePoints: 10,
            category: "task",
            oneTimeOnly: true,
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        },
        {
            id: "kneeboard_try",
            name: "Kneeboard - Try",
            basePoints: 10,
            category: "task",
            oneTimeOnly: true,
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        },
        {
            id: "kneeboard_get_up",
            name: "Kneeboard - Get Up",
            basePoints: 20,
            category: "task",
            oneTimeOnly: true,
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        },
        {
            id: "kneeboard_360",
            name: "Kneeboard - 360",
            basePoints: 20,
            category: "task",
            oneTimeOnly: true,
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        },
        {
            id: "kneeboard_jump_wake",
            name: "Kneeboard - Jump Wake",
            basePoints: 20,
            category: "task",
            oneTimeOnly: true,
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        },
        {
            id: "wakeboard_try",
            name: "Wakeboard - Try",
            basePoints: 10,
            category: "task",
            oneTimeOnly: true,
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        },
        {
            id: "wakeboard_get_up",
            name: "Wakeboard - Get Up",
            basePoints: 20,
            category: "task",
            oneTimeOnly: true,
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        },
        {
            id: "wakeboard_switch",
            name: "Wakeboard - Ride Switch",
            basePoints: 10,
            category: "task",
            oneTimeOnly: true,
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        },
        {
            id: "wakeboard_jump_wake",
            name: "Wakeboard - Jump Wake",
            basePoints: 10,
            category: "task",
            oneTimeOnly: true,
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        },
        {
            id: "wakeboard_360",
            name: "Wakeboard - 360",
            basePoints: 30,
            category: "task",
            oneTimeOnly: true,
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        },
        {
            id: "wakeboard_flip",
            name: "Wakeboard - Flip",
            basePoints: 50,
            category: "task",
            oneTimeOnly: true,
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        },
        {
            id: "wakesurf_try",
            name: "Wake Surf - Try",
            basePoints: 10,
            category: "task",
            oneTimeOnly: true,
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        },
        {
            id: "wakesurf_get_up",
            name: "Wake Surf - Get Up",
            basePoints: 20,
            category: "task",
            oneTimeOnly: true,
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        },
        {
            id: "wakesurf_drop_rope",
            name: "Wake Surf - Drop Rope",
            basePoints: 10,
            category: "task",
            oneTimeOnly: true,
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        },
        {
            id: "wakesurf_360",
            name: "Wake Surf - 360 (no rope)",
            basePoints: 20,
            category: "task",
            oneTimeOnly: true,
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        },
        {
            id: "wakesurf_switch_side",
            name: "Wake Surf - Switch Side",
            basePoints: 20,
            category: "task",
            oneTimeOnly: true,
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        },
        {
            id: "innertube_do_it",
            name: "Innertube - Do It",
            basePoints: 10,
            category: "task",
            oneTimeOnly: true,
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        },
        {
            id: "innertube_last_man",
            name: "Innertube - Win Last Man Standing",
            basePoints: 30,
            category: "task",
            oneTimeOnly: true,
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        }
    ],

    randomTasks: [
        // Random tasks (unlimited completions)
        {
            id: "cue_song",
            name: "Cue Song on Aux",
            basePoints: 1,
            category: "random",
            unlimited: true,
            multiplierEligible: ["usc", "deck", "latenight", "island"],
            hasRiskPenalty: true,
            riskPenaltyId: "bad_song_skipped",
            description: "Get +1 point, but -5 if everyone skips it"
        },
        {
            id: "catch_ball_lake_jump",
            name: "Catch Ball While Jumping in Lake",
            basePoints: 2,
            category: "random",
            unlimited: true,
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        },
        {
            id: "spot_satellite",
            name: "Spot a Satellite",
            basePoints: 3,
            category: "random",
            unlimited: true,
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        },
        {
            id: "fix_cocktail_someone",
            name: "Fix Cocktail for Someone",
            basePoints: 5,
            category: "random",
            unlimited: true,
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        },
        {
            id: "spot_shooting_star",
            name: "Spot a Shooting Star",
            basePoints: 5,
            category: "random",
            unlimited: true,
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        },
        {
            id: "make_coffee",
            name: "Make Pot of Coffee for Everyone",
            basePoints: 10,
            category: "random",
            unlimited: true,
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        },
        {
            id: "fix_cocktail_russ_linda",
            name: "Fix Cocktail for Russ/Linda",
            basePoints: 10,
            category: "random",
            unlimited: true,
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        },
        {
            id: "pick_up_daisy_poop",
            name: "Pick Up Daisy Poop",
            basePoints: 10,
            category: "random",
            unlimited: true,
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        },
        {
            id: "spot_snake",
            name: "Spot a Snake",
            basePoints: 10,
            category: "random",
            unlimited: true,
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        },
        {
            id: "spot_deer",
            name: "Spot a Deer",
            basePoints: 10,
            category: "random",
            unlimited: true,
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        },
        {
            id: "spot_bald_eagle",
            name: "Spot a Bald Eagle",
            basePoints: 20,
            category: "random",
            unlimited: true,
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        },
        {
            id: "fix_flagpole",
            name: "Fix the Broken Flagpole",
            basePoints: 1000,
            category: "random",
            unlimited: true,
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        }
    ],

    bonuses: [
        {
            id: "unique_achievement",
            name: "Complete Unique Event",
            basePoints: 20,
            category: "bonus",
            description: "Complete any event that no one else accomplished",
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        },
        {
            id: "win_challenge",
            name: "Win a Challenge",
            basePoints: 10,
            category: "bonus",
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        },
        {
            id: "linda_russ_points",
            name: "Linda/Russ Bonus Points",
            basePoints: 0,
            category: "bonus",
            description: "Arbitrary points from Linda and Russ",
            multiplierEligible: ["usc", "deck", "latenight", "island"]
        }
    ],

    penalties: [
        {
            id: "cheating",
            name: "Cheating",
            basePoints: 0,
            category: "penalty",
            description: "Negate # of points for attempted activity",
            special: "negate_activity"
        },
        {
            id: "car_stop_bathroom",
            name: "Cause Car Stop for Bathroom",
            basePoints: -10,
            category: "penalty",
            multiplierEligible: []
        },
        {
            id: "spill_own_drink",
            name: "Spill Your Own Drink",
            basePoints: -5,
            category: "penalty",
            multiplierEligible: []
        },
        {
            id: "spill_others_drink",
            name: "Spill Someone Else's Drink",
            basePoints: -10,
            category: "penalty",
            multiplierEligible: []
        },
        {
            id: "barf",
            name: "Barf",
            basePoints: -5,
            category: "penalty",
            multiplierEligible: []
        },
        {
            id: "toilet_seat_up",
            name: "Leave Toilet Seat Up",
            basePoints: -5,
            category: "penalty",
            multiplierEligible: []
        },
        {
            id: "leave_mess",
            name: "Leave a Mess",
            basePoints: -10,
            category: "penalty",
            multiplierEligible: []
        },
        {
            id: "neglect_cooking_kp",
            name: "Neglect Cooking/KP Shift",
            basePoints: -20,
            category: "penalty",
            multiplierEligible: []
        },
        {
            id: "pop_fun_island",
            name: "Pop the Fun Island",
            basePoints: -50,
            category: "penalty",
            multiplierEligible: []
        },
        {
            id: "hole_in_wall",
            name: "Put Hole in Wall/Door",
            basePoints: -50,
            category: "penalty",
            multiplierEligible: []
        },
        {
            id: "piss_bed",
            name: "Piss Bed",
            basePoints: -50,
            category: "penalty",
            multiplierEligible: []
        },
        {
            id: "damage_car_boat",
            name: "Damage Car/Boat",
            basePoints: -100,
            category: "penalty",
            multiplierEligible: []
        },
        {
            id: "break_bone_tubing",
            name: "Break Someone's Bone Tubing",
            basePoints: -200,
            category: "penalty",
            multiplierEligible: []
        },
        {
            id: "sink_boat",
            name: "Sink Boat",
            basePoints: -1000,
            category: "penalty",
            multiplierEligible: []
        },
        {
            id: "kill_goose",
            name: "Kill a Goose (Federal Offense)",
            basePoints: -100,
            category: "penalty",
            multiplierEligible: []
        },
        {
            id: "bad_song_skipped",
            name: "Bad Song Gets Skipped",
            basePoints: -5,
            category: "penalty",
            description: "When everyone is mad and skips your aux song",
            multiplierEligible: []
        }
    ]
};

const MULTIPLIERS = [
    {
        id: "boat",
        name: "On Boat",
        factor: 2,
        appliesToConsumables: true,
        appliesToOthers: false,
        description: "Double points for consumables while on boat"
    },
    {
        id: "water",
        name: "On/In Water",
        factor: 2,
        appliesToConsumables: true,
        appliesToOthers: false,
        description: "Double points for consumables on flotation devices or while wading"
    },
    {
        id: "leavenworth",
        name: "In Leavenworth",
        factor: 2,
        appliesToConsumables: true,
        appliesToOthers: false,
        description: "Double points for consumables in Leavenworth"
    },
    {
        id: "hottub",
        name: "In Hot Tub",
        factor: 2,
        appliesToConsumables: true,
        appliesToOthers: false,
        description: "Double points for consumables in hot tub"
    },
    {
        id: "towing",
        name: "While Being Towed",
        factor: 10,
        appliesToConsumables: true,
        appliesToOthers: false,
        description: "10x points for consumables while being towed behind boat"
    },
    {
        id: "usc",
        name: "USC/NFL Team Gear",
        factor: 2,
        appliesToConsumables: true,
        appliesToOthers: true,
        description: "Double points for any activity while wearing USC/NFL gear"
    },
    {
        id: "deck",
        name: "On the Deck",
        factor: 2,
        appliesToConsumables: true,
        appliesToOthers: true,
        description: "Double points for any activity on the deck"
    },
    {
        id: "latenight",
        name: "2am - 8am",
        factor: 3,
        appliesToConsumables: true,
        appliesToOthers: true,
        description: "Triple points for any activity between 2am and 8am"
    },
    {
        id: "island",
        name: "Turtle Rock Island",
        factor: 4,
        appliesToConsumables: true,
        appliesToOthers: true,
        description: "4x points for any activity on Turtle Rock Island"
    }
];

// Helper functions for working with activities
const ActivityHelper = {
    getAllActivities() {
        const all = [];
        Object.values(ACTIVITIES).forEach(categoryArray => {
            if (Array.isArray(categoryArray)) {
                all.push(...categoryArray);
            }
        });
        return all;
    },

    searchActivities(query) {
        const all = this.getAllActivities();
        return all.filter(activity => 
            activity.name.toLowerCase().includes(query.toLowerCase())
        );
    },

    getActivityById(id) {
        const all = this.getAllActivities();
        return all.find(activity => activity.id === id);
    },

    getActivitiesByCategory(category) {
        return ACTIVITIES[category] || [];
    },

    getMultiplierById(id) {
        return MULTIPLIERS.find(m => m.id === id);
    },

    getApplicableMultipliers(activity) {
        return MULTIPLIERS.filter(multiplier => {
            if (activity.category === 'consumables' || ['drink', 'food'].includes(activity.category)) {
                return multiplier.appliesToConsumables;
            }
            return multiplier.appliesToOthers;
        });
    }
};

// Expose MULTIPLIERS to window for global access
window.MULTIPLIERS = MULTIPLIERS;