// Automatisch gegenereerd uit games.json. Wijzig de bron, niet dit bestand.
// Opnieuw bouwen: node scripts/build-catalog.cjs
window.AXIOMA_CATALOG = [
  {
    "title": "Rechtenwereld",
    "subtitle": "Punten, hellingen en rechten.",
    "href": "games/rechten/rechtenwereld/#wereld",
    "category": "Eerstegraadsfuncties",
    "kind": "train",
    "accent": "blue",
    "theme": "Functies",
    "art": "trainer",
    "cover": "assets/covers/modern/rechtenwereld.webp",
    "detail": "Puntenbaai · Hellingrug · Grenspas",
    "id": "rechtenwereld",
    "progressType": "world",
    "teacherVisible": true,
    "gameType": "train",
    "tracking": "learning",
    "featured": true,
    "featureOrder": 1,
    "subject": "Rechten",
    "presentation": "islands",
    "coverSmall": "assets/covers/modern/rechtenwereld-small.webp",
    "progressGameId": "rechten-trainer",
    "active": true,
    "progressId": "rechten-trainer",
    "route": {
      "entry": "games/rechten/rechtenwereld/#wereld",
      "prefix": "games/rechten/rechtenwereld/"
    },
    "capabilities": {
      "modes": [
        {
          "id": "solo",
          "participation": "solo",
          "purpose": "learn",
          "roles": [
            "guest",
            "student",
            "teacher"
          ],
          "href": "games/rechten/rechtenwereld/#wereld",
          "providerId": "rechtenwereld"
        },
        {
          "id": "learn",
          "participation": "group",
          "purpose": "learn",
          "roles": [
            "student",
            "teacher"
          ],
          "href": "games/rechten/rechtenwereld/learn.html",
          "providerId": "rechten-learn",
          "topicParam": "world",
          "devices": "2–3 leerlingen · elk een toestel"
        },
        {
          "id": "local",
          "participation": "duo",
          "purpose": "battle",
          "roles": [
            "guest",
            "student",
            "teacher"
          ],
          "href": "games/rechten/rechtenwereld/battle.html",
          "providerId": "rechtenwereld",
          "topicParam": "world"
        },
        {
          "id": "online",
          "participation": "duo",
          "purpose": "battle",
          "roles": [
            "student",
            "teacher"
          ],
          "href": "games/rechten/rechtenwereld/online.html",
          "providerId": "rechten-duo",
          "topicParam": "world"
        },
        {
          "id": "classroom",
          "participation": "group",
          "purpose": "battle",
          "roles": [
            "student",
            "teacher"
          ],
          "href": "games/rechten/rechtenwereld/classroom.html",
          "providerId": "rechten",
          "topicParam": "world",
          "rpc": "axioma_game_class",
          "topics": [
            "puntenbaai",
            "hellingrug",
            "grenspas",
            "formulewerf",
            "signaalstad"
          ]
        }
      ],
      "worksheets": [
        {
          "id": "hellingrug",
          "title": "Hellingrug",
          "href": "oefenbladen/maken.html?source=rechtenwereld:hellingrug&topic=hellingrug",
          "providerId": "rechtenwereld",
          "topicId": "hellingrug",
          "description": "Stel een reeks samen en bewaar de opgaven met verbetersleutel in je onderwerpmap."
        },
        {
          "id": "grenspas",
          "title": "Grenspas",
          "href": "oefenbladen/maken.html?source=rechtenwereld:grenspas&topic=grenspas",
          "providerId": "rechtenwereld",
          "topicId": "grenspas",
          "description": "Stel een reeks samen en bewaar de opgaven met verbetersleutel in je onderwerpmap."
        },
        {
          "id": "formulewerf",
          "title": "Formulewerf",
          "href": "oefenbladen/maken.html?source=rechtenwereld:formulewerf&topic=formulewerf",
          "providerId": "rechtenwereld",
          "topicId": "formulewerf",
          "description": "Stel een reeks samen en bewaar de opgaven met verbetersleutel in je onderwerpmap."
        },
        {
          "id": "signaalstad",
          "title": "Signaalstad",
          "href": "oefenbladen/maken.html?source=rechtenwereld:signaalstad&topic=signaalstad",
          "providerId": "rechtenwereld",
          "topicId": "signaalstad",
          "description": "Stel een reeks samen en bewaar de opgaven met verbetersleutel in je onderwerpmap."
        }
      ]
    },
    "modeAliases": [
      "rechten"
    ],
    "engine": {
      "modules": [
        "games/rechten/rechtenwereld/points-core.js",
        "games/rechten/rechtenwereld/hills-core.js",
        "games/rechten/rechtenwereld/lines-core.js",
        "games/rechten/rechtenwereld/ab-core.js"
      ]
    },
    "topics": [
      {
        "id": "puntenbaai",
        "title": "Puntenbaai",
        "href": "games/rechten/rechtenwereld/#puntenbaai"
      },
      {
        "id": "hellingrug",
        "title": "Hellingrug",
        "href": "games/rechten/rechtenwereld/#hellingrug"
      },
      {
        "id": "grenspas",
        "title": "Grenspas",
        "href": "games/rechten/rechtenwereld/#grenspas"
      },
      {
        "id": "formulewerf",
        "title": "Formulewerf",
        "href": "games/rechten/rechtenwereld/#formulewerf"
      },
      {
        "id": "signaalstad",
        "title": "Signaalstad",
        "href": "games/rechten/rechtenwereld/#signaalstad"
      }
    ]
  },
  {
    "title": "Rechtenarcade",
    "subtitle": "Speel Zeeslag, brandweer, kabelbaan en kleiduiven. Ontwerp je eigen glasraam.",
    "href": "games/rechten/arcade/",
    "category": "Eerstegraadsfuncties",
    "kind": "arcade",
    "accent": "gold",
    "theme": "Functies",
    "art": "naval",
    "cover": "games/rechten/arcade/assets/ship.webp",
    "detail": "Solo en duo · Glasraam · topscores",
    "id": "rechten-arcade",
    "progressType": "none",
    "teacherVisible": false,
    "gameType": "arcade",
    "tracking": "none",
    "featured": false,
    "subject": "Rechten",
    "active": true,
    "progressId": "rechten-arcade",
    "route": {
      "entry": "games/rechten/arcade/"
    },
    "capabilities": {
      "modes": [],
      "worksheets": []
    }
  },
  {
    "title": "Rechtentrainer",
    "subtitle": "Oefen met rechten en zie jezelf vooruitgaan.",
    "href": "games/rechten/trainer/",
    "category": "Eerstegraadsfuncties",
    "kind": "train",
    "accent": "blue",
    "theme": "Functies",
    "art": "trainer",
    "cover": "assets/covers/trainer.svg",
    "detail": "Leervoortgang bewaard",
    "id": "rechten-trainer",
    "progressType": "trainer",
    "teacherVisible": true,
    "gameType": "train",
    "tracking": "learning",
    "featured": false,
    "active": true,
    "progressId": "rechten-trainer",
    "route": {
      "entry": "games/rechten/trainer/"
    },
    "capabilities": {
      "modes": [
        {
          "id": "solo",
          "participation": "solo",
          "purpose": "learn",
          "roles": [
            "guest",
            "student",
            "teacher"
          ],
          "href": "games/rechten/trainer/",
          "providerId": "rechten-trainer"
        }
      ],
      "worksheets": []
    }
  },
  {
    "title": "Functies & rechten",
    "subtitle": "Ontdek stap voor stap hoe een rechte werkt.",
    "href": "games/rechten/leerpad/",
    "category": "Eerstegraadsfuncties",
    "kind": "learn",
    "accent": "mint",
    "theme": "Functies",
    "art": "graph",
    "cover": "assets/covers/graph.svg",
    "detail": "Verken zonder opslag",
    "id": "functies-rechten",
    "progressType": "none",
    "teacherVisible": false,
    "gameType": "learn",
    "tracking": "none",
    "featured": false,
    "active": true,
    "progressId": "functies-rechten",
    "route": {
      "entry": "games/rechten/leerpad/"
    },
    "capabilities": {
      "modes": [
        {
          "id": "solo",
          "participation": "solo",
          "purpose": "learn",
          "roles": [
            "guest",
            "student",
            "teacher"
          ],
          "href": "games/rechten/leerpad/",
          "providerId": "functies-rechten"
        }
      ],
      "worksheets": []
    }
  },
  {
    "title": "Brandweer",
    "subtitle": "Zet je kennis in en stuur de ladder naar de redding.",
    "href": "games/rechten/brandweer/",
    "category": "Eerstegraadsfuncties",
    "kind": "game",
    "accent": "orange",
    "theme": "Functies",
    "art": "fire",
    "cover": "assets/covers/fire.svg",
    "detail": "Voortgang bewaard",
    "id": "brandweer",
    "progressType": "levels",
    "teacherVisible": true,
    "gameType": "game",
    "tracking": "progress",
    "progressTotal": 16,
    "progressUnitSingular": "level",
    "progressUnitPlural": "levels",
    "featured": false,
    "active": true,
    "progressId": "brandweer",
    "route": {
      "entry": "games/rechten/brandweer/"
    },
    "capabilities": {
      "modes": [
        {
          "id": "solo",
          "participation": "solo",
          "purpose": "learn",
          "roles": [
            "guest",
            "student",
            "teacher"
          ],
          "href": "games/rechten/brandweer/",
          "providerId": "brandweer"
        }
      ],
      "worksheets": []
    }
  },
  {
    "title": "Kleiduifschieten",
    "subtitle": "Kies de juiste helling. Speel samen of race in groep naar zeven op rij.",
    "href": "games/rechten/kleiduiven/",
    "category": "Eerstegraadsfuncties",
    "kind": "arcade",
    "accent": "gold",
    "theme": "Functies",
    "art": "clay",
    "cover": "assets/covers/clay.svg",
    "detail": "Reeks bewaard",
    "id": "kleiduifschieten",
    "progressType": "levels",
    "teacherVisible": true,
    "gameType": "arcade",
    "tracking": "progress",
    "progressTotal": 1,
    "progressUnitSingular": "reeks",
    "progressUnitPlural": "reeksen",
    "supportsGroup": true,
    "featured": false,
    "active": true,
    "progressId": "kleiduifschieten",
    "route": {
      "entry": "games/rechten/kleiduiven/"
    },
    "capabilities": {
      "modes": [
        {
          "id": "solo",
          "participation": "solo",
          "purpose": "learn",
          "roles": [
            "guest",
            "student",
            "teacher"
          ],
          "href": "games/rechten/kleiduiven/",
          "providerId": "kleiduifschieten"
        },
        {
          "id": "group",
          "participation": "group",
          "purpose": "battle",
          "roles": [
            "student",
            "teacher"
          ],
          "href": "games/rechten/kleiduiven/",
          "providerId": "kleiduifschieten",
          "title": "Groepssessie Kleiduifschieten",
          "description": "Open de groepssessie vanuit het spelmenu. Deze sessie gebruikt de eigen Kleiduifschieten-regels."
        }
      ],
      "worksheets": []
    }
  },
  {
    "title": "Rechten Zeeslag",
    "subtitle": "Daag een online speler uit. Vind de vloot met y = ax + b.",
    "href": "games/rechten/zeeslag/",
    "category": "Eerstegraadsfuncties",
    "kind": "game",
    "accent": "blue",
    "theme": "Functies",
    "art": "naval",
    "cover": "assets/covers/zeeslag.svg",
    "detail": "Solo tegen de computer · samen online",
    "id": "rechten-zeeslag",
    "progressType": "multiplayer",
    "teacherVisible": false,
    "gameType": "game",
    "tracking": "multiplayer",
    "featured": false,
    "active": true,
    "progressId": "rechten-zeeslag",
    "route": {
      "entry": "games/rechten/zeeslag/"
    },
    "capabilities": {
      "modes": [
        {
          "id": "solo",
          "participation": "solo",
          "purpose": "battle",
          "roles": [
            "guest",
            "student",
            "teacher"
          ],
          "href": "games/rechten/zeeslag/",
          "providerId": "rechten-zeeslag",
          "title": "Solo tegen de computer",
          "description": "Speel een zeeslag tegen de computer."
        },
        {
          "id": "online",
          "participation": "duo",
          "purpose": "battle",
          "roles": [
            "student",
            "teacher"
          ],
          "href": "games/rechten/zeeslag/",
          "providerId": "rechten-zeeslag",
          "description": "Kies online spelen in Zeeslag en nodig een leerling uit op alias."
        }
      ],
      "worksheets": []
    }
  },
  {
    "title": "Pythagoras",
    "subtitle": "Ontdek de stelling, bouw de formule en pas ze toe.",
    "href": "games/pythagoras.html?v=20260920-3",
    "category": "Meetkunde",
    "kind": "learn",
    "accent": "gold",
    "theme": "Meetkunde",
    "art": "pythagoras",
    "cover": "assets/covers/pythagoras.svg",
    "detail": "10 stappen · voortgang bewaard",
    "id": "pythagoras",
    "progressType": "levels",
    "teacherVisible": true,
    "gameType": "game",
    "tracking": "progress",
    "progressTotal": 10,
    "progressUnitSingular": "stap",
    "progressUnitPlural": "stappen",
    "featured": false,
    "active": true,
    "progressId": "pythagoras",
    "route": {
      "entry": "games/pythagoras.html?v=20260920-3"
    },
    "capabilities": {
      "modes": [
        {
          "id": "solo",
          "participation": "solo",
          "purpose": "learn",
          "roles": [
            "guest",
            "student",
            "teacher"
          ],
          "href": "games/pythagoras.html?v=20260920-3",
          "providerId": "pythagoras"
        }
      ],
      "worksheets": []
    }
  },
  {
    "title": "Wortelbouw",
    "subtitle": "Bouw lengtes. Ontdek wortels.",
    "href": "games/wortelbouw_pro_v0.5.0/wortelbouw/index.html",
    "category": "Pythagoras & wortels",
    "kind": "game",
    "accent": "mint",
    "theme": "Meetkunde",
    "art": "wortelbouw",
    "cover": "assets/covers/modern/wortelbouw.webp",
    "detail": "14 bouwpuzzels · solo en battle",
    "id": "wortelbouw",
    "progressType": "levels",
    "teacherVisible": true,
    "gameType": "game",
    "tracking": "progress",
    "progressTotal": 14,
    "progressUnitSingular": "opgave",
    "progressUnitPlural": "opgaven",
    "featured": true,
    "featureOrder": 2,
    "subject": "Pythagoras & wortels",
    "presentation": "garden",
    "coverSmall": "assets/covers/modern/wortelbouw-small.webp",
    "active": true,
    "progressId": "wortelbouw",
    "route": {
      "entry": "games/wortelbouw_pro_v0.5.0/wortelbouw/index.html",
      "prefix": "games/wortelbouw_pro_v0.5.0/wortelbouw/"
    },
    "capabilities": {
      "modes": [
        {
          "id": "solo",
          "participation": "solo",
          "purpose": "learn",
          "roles": [
            "guest",
            "student",
            "teacher"
          ],
          "href": "games/wortelbouw_pro_v0.5.0/wortelbouw/index.html",
          "providerId": "wortelbouw"
        },
        {
          "id": "local",
          "participation": "duo",
          "purpose": "battle",
          "roles": [
            "guest",
            "student",
            "teacher"
          ],
          "href": "games/wortelbouw_pro_v0.5.0/wortelbouw/battle.html",
          "providerId": "wortelbouw"
        },
        {
          "id": "classroom",
          "participation": "group",
          "purpose": "battle",
          "roles": [
            "student",
            "teacher"
          ],
          "href": "games/wortelbouw_pro_v0.5.0/wortelbouw/classroom.html",
          "providerId": "wortelbouw",
          "rpc": "axioma_game_class",
          "topics": [
            "basis",
            "groot"
          ],
          "topicParam": "world"
        }
      ],
      "worksheets": []
    },
    "modeAliases": [],
    "engine": {
      "release": "0.5.0",
      "modules": [
        "games/wortelbouw_pro_v0.5.0/wortelbouw/geometry.js",
        "games/wortelbouw_pro_v0.5.0/wortelbouw/wortelbouw.js"
      ]
    },
    "topics": [
      {
        "id": "basis",
        "title": "Konijnengrond · basis",
        "scope": "classroom",
        "routeModes": [
          "classroom"
        ],
        "href": "games/wortelbouw_pro_v0.5.0/wortelbouw/classroom.html?world=basis",
        "skillIds": [
          "build_2",
          "build_5",
          "build_13",
          "build_25"
        ]
      },
      {
        "id": "groot",
        "title": "Grotere lengtes",
        "scope": "classroom",
        "routeModes": [
          "classroom"
        ],
        "href": "games/wortelbouw_pro_v0.5.0/wortelbouw/classroom.html?world=groot",
        "skillIds": [
          "build_18",
          "build_100",
          "build_104"
        ]
      }
    ]
  },
  {
    "title": "Vectormissie",
    "subtitle": "Geef richting aan je missie.",
    "href": "games/vectoren/Axioma_Vectorentrainer_v0.4_vectormissie.html",
    "category": "Vectoren",
    "kind": "train",
    "accent": "mint",
    "theme": "Meetkunde",
    "art": "vectors",
    "cover": "assets/covers/modern/vectormissie.webp",
    "detail": "Verkennen, oefenen en samen spelen",
    "id": "vectoren-trainer",
    "progressType": "levels",
    "teacherVisible": true,
    "gameType": "train",
    "tracking": "progress",
    "progressTotal": 24,
    "progressUnitSingular": "vaardigheid",
    "progressUnitPlural": "vaardigheden",
    "featured": true,
    "featureOrder": 3,
    "subject": "Vectoren",
    "presentation": "space",
    "coverSmall": "assets/covers/modern/vectormissie-small.webp",
    "active": true,
    "progressId": "vectoren-trainer",
    "route": {
      "entry": "games/vectoren/Axioma_Vectorentrainer_v0.4_vectormissie.html",
      "prefix": "games/vectoren/"
    },
    "capabilities": {
      "modes": [
        {
          "id": "solo",
          "participation": "solo",
          "purpose": "learn",
          "roles": [
            "guest",
            "student",
            "teacher"
          ],
          "href": "games/vectoren/Axioma_Vectorentrainer_v0.4_vectormissie.html",
          "providerId": "vectoren-trainer"
        },
        {
          "id": "local",
          "participation": "duo",
          "purpose": "battle",
          "roles": [
            "guest",
            "student",
            "teacher"
          ],
          "href": "games/vectoren/battle.html",
          "providerId": "vectoren-trainer"
        },
        {
          "id": "classroom",
          "participation": "group",
          "purpose": "battle",
          "roles": [
            "student",
            "teacher"
          ],
          "href": "games/vectoren/classroom.html",
          "providerId": "vectoren",
          "classFunction": "vector-class",
          "rpc": "axioma_vector_class",
          "topics": [
            "koerscentrum",
            "stuwkrachtlab",
            "dockingzone",
            "navigatienet",
            "manoeuvreveld"
          ],
          "topicParam": "world"
        }
      ],
      "worksheets": []
    },
    "modeAliases": [
      "vectoren"
    ],
    "engine": {
      "release": "0.4",
      "modules": [
        "games/vectoren/vector-core.js"
      ]
    },
    "topics": [
      {
        "id": "koerscentrum",
        "title": "Koerscentrum",
        "scope": "classroom",
        "routeModes": [
          "classroom"
        ],
        "href": "games/vectoren/classroom.html?world=koerscentrum",
        "skillIds": [
          "props",
          "equal",
          "free"
        ]
      },
      {
        "id": "stuwkrachtlab",
        "title": "Stuwkrachtlab",
        "scope": "classroom",
        "routeModes": [
          "classroom"
        ],
        "href": "games/vectoren/classroom.html?world=stuwkrachtlab",
        "skillIds": [
          "opposite",
          "scalar"
        ]
      },
      {
        "id": "dockingzone",
        "title": "Dockingzone",
        "scope": "classroom",
        "routeModes": [
          "classroom"
        ],
        "href": "games/vectoren/classroom.html?world=dockingzone",
        "skillIds": [
          "sum",
          "headtail",
          "commute",
          "parallelogram",
          "difference",
          "figure"
        ]
      },
      {
        "id": "navigatienet",
        "title": "Navigatienet",
        "scope": "classroom",
        "routeModes": [
          "classroom"
        ],
        "href": "games/vectoren/classroom.html?world=navigatienet",
        "skillIds": [
          "coords",
          "arrow",
          "ab",
          "points",
          "basis",
          "coordadd",
          "coordscale",
          "coordcombo"
        ]
      },
      {
        "id": "manoeuvreveld",
        "title": "Manoeuvreveld",
        "scope": "classroom",
        "routeModes": [
          "classroom"
        ],
        "href": "games/vectoren/classroom.html?world=manoeuvreveld",
        "skillIds": [
          "decompose",
          "combination",
          "unknown",
          "route",
          "fourth"
        ]
      }
    ]
  },
  {
    "title": "Reële getallen",
    "subtitle": "Bouw, vergelijk en verbind breuken, decimalen, wortels en intervallen.",
    "href": "games/reele-getallen/",
    "category": "Reële getallen",
    "kind": "train",
    "accent": "blue",
    "theme": "Getallen",
    "art": "numbers",
    "cover": "assets/covers/reele-getallen.svg",
    "detail": "12 vaardigheden · leervoortgang bewaard",
    "id": "reele-getallen-trainer",
    "progressType": "levels",
    "teacherVisible": true,
    "gameType": "train",
    "tracking": "progress",
    "progressTotal": 12,
    "progressUnitSingular": "vaardigheid",
    "progressUnitPlural": "vaardigheden",
    "featured": false,
    "active": true,
    "progressId": "reele-getallen-trainer",
    "route": {
      "entry": "games/reele-getallen/"
    },
    "capabilities": {
      "modes": [
        {
          "id": "solo",
          "participation": "solo",
          "purpose": "learn",
          "roles": [
            "guest",
            "student",
            "teacher"
          ],
          "href": "games/reele-getallen/",
          "providerId": "reele-getallen-trainer"
        }
      ],
      "worksheets": []
    }
  },
  {
    "title": "Stelsels",
    "subtitle": "Los stelsels grafisch, met substitutie en met combinatie op.",
    "href": "games/stelsels.html?v=20260920-2",
    "category": "Algebra",
    "kind": "train",
    "accent": "violet",
    "theme": "Algebra",
    "art": "systems",
    "cover": "assets/covers/systems.svg",
    "detail": "14 oefeningen · voortgang bewaard",
    "id": "stelsels",
    "progressType": "levels",
    "teacherVisible": true,
    "gameType": "game",
    "tracking": "progress",
    "progressTotal": 14,
    "progressUnitSingular": "oefening",
    "progressUnitPlural": "oefeningen",
    "featured": false,
    "active": true,
    "progressId": "stelsels",
    "route": {
      "entry": "games/stelsels.html?v=20260920-2"
    },
    "capabilities": {
      "modes": [
        {
          "id": "solo",
          "participation": "solo",
          "purpose": "learn",
          "roles": [
            "guest",
            "student",
            "teacher"
          ],
          "href": "games/stelsels.html?v=20260920-2",
          "providerId": "stelsels"
        }
      ],
      "worksheets": []
    }
  },
  {
    "title": "Algebra Smederij",
    "subtitle": "Herschrijf algebra stap voor stap en bouw correcte vormen.",
    "href": "games/algebra-smederij.html?v=20260920-2",
    "category": "Algebra",
    "kind": "train",
    "accent": "gold",
    "theme": "Algebra",
    "art": "algebra",
    "cover": "assets/covers/algebra.svg",
    "detail": "Oefeningen · voortgang bewaard",
    "id": "algebra-smederij",
    "progressType": "levels",
    "teacherVisible": true,
    "gameType": "game",
    "tracking": "progress",
    "progressUnitSingular": "oefening",
    "progressUnitPlural": "oefeningen",
    "featured": false,
    "active": true,
    "progressId": "algebra-smederij",
    "route": {
      "entry": "games/algebra-smederij.html?v=20260920-2"
    },
    "capabilities": {
      "modes": [
        {
          "id": "solo",
          "participation": "solo",
          "purpose": "learn",
          "roles": [
            "guest",
            "student",
            "teacher"
          ],
          "href": "games/algebra-smederij.html?v=20260920-2",
          "providerId": "algebra-smederij"
        }
      ],
      "worksheets": []
    }
  },
  {
    "title": "Taartenwinkel",
    "subtitle": "Snijd, verdeel en combineer breuken in de patisserie.",
    "href": "games/taartenwinkel.html?v=20260920-2",
    "category": "Breuken",
    "kind": "game",
    "accent": "orange",
    "theme": "Breuken",
    "art": "cake",
    "cover": "assets/covers/taartenwinkel.svg",
    "detail": "7 diensten · voortgang bewaard",
    "id": "taartenwinkel",
    "progressType": "levels",
    "teacherVisible": true,
    "gameType": "game",
    "tracking": "progress",
    "progressTotal": 7,
    "progressUnitSingular": "dienst",
    "progressUnitPlural": "diensten",
    "featured": false,
    "active": true,
    "progressId": "taartenwinkel",
    "route": {
      "entry": "games/taartenwinkel.html?v=20260920-2"
    },
    "capabilities": {
      "modes": [
        {
          "id": "solo",
          "participation": "solo",
          "purpose": "learn",
          "roles": [
            "guest",
            "student",
            "teacher"
          ],
          "href": "games/taartenwinkel.html?v=20260920-2",
          "providerId": "taartenwinkel"
        }
      ],
      "worksheets": []
    }
  },
  {
    "title": "Kubusbouw",
    "subtitle": "Bouw 3D-vormen en lees voor-, boven- en zijaanzichten.",
    "href": "games/kubusbouw.html?v=20260920-2",
    "category": "Ruimtelijk inzicht",
    "kind": "train",
    "accent": "mint",
    "theme": "Ruimtelijk inzicht",
    "art": "cube",
    "cover": "assets/covers/kubusbouw.svg",
    "detail": "22 oefeningen · voortgang bewaard",
    "id": "kubusbouw",
    "progressType": "levels",
    "teacherVisible": true,
    "gameType": "game",
    "tracking": "progress",
    "progressTotal": 22,
    "progressUnitSingular": "oefening",
    "progressUnitPlural": "oefeningen",
    "featured": false,
    "active": true,
    "progressId": "kubusbouw",
    "route": {
      "entry": "games/kubusbouw.html?v=20260920-2"
    },
    "capabilities": {
      "modes": [
        {
          "id": "solo",
          "participation": "solo",
          "purpose": "learn",
          "roles": [
            "guest",
            "student",
            "teacher"
          ],
          "href": "games/kubusbouw.html?v=20260920-2",
          "providerId": "kubusbouw"
        }
      ],
      "worksheets": []
    }
  },
  {
    "title": "Verfwinkel",
    "subtitle": "Meng verf met verhoudingen, volumes en doelkleuren.",
    "href": "games/verfwinkel.html?v=20260920-2",
    "category": "Verhoudingen",
    "kind": "game",
    "accent": "blue",
    "theme": "Verhoudingen",
    "art": "paint",
    "cover": "assets/covers/verfwinkel.svg",
    "detail": "16 levels · voortgang bewaard",
    "id": "verfwinkel",
    "progressType": "levels",
    "teacherVisible": true,
    "gameType": "game",
    "tracking": "progress",
    "progressTotal": 16,
    "progressUnitSingular": "bestelling",
    "progressUnitPlural": "bestellingen",
    "featured": false,
    "active": true,
    "progressId": "verfwinkel",
    "route": {
      "entry": "games/verfwinkel.html?v=20260920-2"
    },
    "capabilities": {
      "modes": [
        {
          "id": "solo",
          "participation": "solo",
          "purpose": "learn",
          "roles": [
            "guest",
            "student",
            "teacher"
          ],
          "href": "games/verfwinkel.html?v=20260920-2",
          "providerId": "verfwinkel"
        }
      ],
      "worksheets": []
    }
  },
  {
    "title": "Data Check",
    "subtitle": "Onderzoek data en herken misleidende voorstellingen.",
    "href": "games/data-check.html?v=20260920-2",
    "category": "Statistiek",
    "kind": "learn",
    "accent": "blue",
    "theme": "Statistiek",
    "art": "data",
    "cover": "assets/covers/data-check.svg",
    "detail": "22 dossiers · voortgang bewaard",
    "id": "data-check",
    "progressType": "levels",
    "teacherVisible": true,
    "gameType": "game",
    "tracking": "progress",
    "progressTotal": 22,
    "progressUnitSingular": "dossier",
    "progressUnitPlural": "dossiers",
    "featured": false,
    "active": true,
    "progressId": "data-check",
    "route": {
      "entry": "games/data-check.html?v=20260920-2"
    },
    "capabilities": {
      "modes": [
        {
          "id": "solo",
          "participation": "solo",
          "purpose": "learn",
          "roles": [
            "guest",
            "student",
            "teacher"
          ],
          "href": "games/data-check.html?v=20260920-2",
          "providerId": "data-check"
        }
      ],
      "worksheets": []
    }
  },
  {
    "title": "Signal Lab",
    "subtitle": "Ontdek functies via invoer, uitvoer, regels en grafieken.",
    "href": "games/signal-lab.html?v=20260920-2",
    "category": "Functies",
    "kind": "learn",
    "accent": "blue",
    "theme": "Functies",
    "art": "signal",
    "cover": "assets/covers/signal-lab.svg",
    "detail": "12 proeven · voortgang bewaard",
    "id": "signal-lab",
    "progressType": "levels",
    "teacherVisible": true,
    "gameType": "game",
    "tracking": "progress",
    "progressTotal": 12,
    "progressUnitSingular": "proef",
    "progressUnitPlural": "proeven",
    "featured": false,
    "active": true,
    "progressId": "signal-lab",
    "route": {
      "entry": "games/signal-lab.html?v=20260920-2"
    },
    "capabilities": {
      "modes": [
        {
          "id": "solo",
          "participation": "solo",
          "purpose": "learn",
          "roles": [
            "guest",
            "student",
            "teacher"
          ],
          "href": "games/signal-lab.html?v=20260920-2",
          "providerId": "signal-lab"
        }
      ],
      "worksheets": []
    }
  },
  {
    "title": "Gravity Maze",
    "subtitle": "Stuur zwaartekracht, stenen en portals door compacte puzzelkamers.",
    "href": "games/gravity/?v=20260920-2",
    "category": "Logica",
    "kind": "game",
    "accent": "violet",
    "theme": "Logica",
    "art": "gravity",
    "cover": "assets/covers/modern/gravity-maze.webp",
    "detail": "9 kamers · voortgang bewaard",
    "id": "gravity-maze",
    "progressType": "levels",
    "teacherVisible": true,
    "gameType": "game",
    "tracking": "progress",
    "progressTotal": 9,
    "progressUnitSingular": "kamer",
    "progressUnitPlural": "kamers",
    "featured": true,
    "featureOrder": 4,
    "subject": "Logica & zwaartekracht",
    "presentation": "gravity",
    "coverSmall": "assets/covers/modern/gravity-maze-small.webp",
    "active": true,
    "progressId": "gravity-maze",
    "route": {
      "entry": "games/gravity/?v=20260920-2"
    },
    "capabilities": {
      "modes": [
        {
          "id": "solo",
          "participation": "solo",
          "purpose": "learn",
          "roles": [
            "guest",
            "student",
            "teacher"
          ],
          "href": "games/gravity/?v=20260920-2",
          "providerId": "gravity-maze"
        }
      ],
      "worksheets": []
    }
  },
  {
    "id": "algebra-trainer",
    "title": "Algebrawereld",
    "subtitle": "Los vergelijkingen op, bouw tussenstappen en test je oplossingen.",
    "href": "games/algebra-trainer/",
    "category": "Vergelijkingen",
    "kind": "train",
    "accent": "blue",
    "theme": "Algebra",
    "art": "algebra",
    "cover": "assets/covers/modern/algebra-trainer.webp",
    "coverSmall": "assets/covers/modern/algebra-trainer-small.webp",
    "detail": "7 vergelijkingenlevels · 6 stelsellevels · oefenbladen en XP",
    "subject": "Algebra · machten · stelsels",
    "presentation": "algebra",
    "featured": true,
    "featureOrder": 5,
    "progressType": "levels",
    "progressTotal": 13,
    "progressUnitSingular": "level",
    "progressUnitPlural": "levels",
    "teacherVisible": true,
    "gameType": "train",
    "tracking": "progress",
    "active": true,
    "progressId": "algebra-trainer",
    "route": {
      "entry": "games/algebra-trainer/",
      "prefix": "games/algebra-trainer/"
    },
    "capabilities": {
      "modes": [
        {
          "id": "solo",
          "participation": "solo",
          "purpose": "learn",
          "roles": [
            "guest",
            "student",
            "teacher"
          ],
          "href": "games/algebra-trainer/",
          "providerId": "algebra-trainer"
        },
        {
          "id": "classroom",
          "participation": "group",
          "purpose": "battle",
          "roles": [
            "student",
            "teacher"
          ],
          "href": "games/algebra-trainer/classroom.html",
          "providerId": "algebra",
          "classFunction": "algebra-class",
          "topics": [
            "equations",
            "systems"
          ],
          "topicParam": "world",
          "rpc": "axioma_game_class"
        }
      ],
      "worksheets": [
        {
          "id": "equations",
          "title": "Vergelijkingen",
          "href": "oefenbladen/maken.html?source=algebra-trainer:equations&topic=equations",
          "providerId": "algebra-trainer",
          "topicId": "equations",
          "description": "Stel een reeks samen en bewaar de opgaven met verbetersleutel in je onderwerpmap."
        },
        {
          "id": "systems",
          "title": "Stelsels",
          "href": "oefenbladen/maken.html?source=algebra-trainer:systems&topic=systems",
          "providerId": "algebra-trainer",
          "topicId": "systems",
          "description": "Stel een reeks samen en bewaar de opgaven met verbetersleutel in je onderwerpmap."
        }
      ]
    },
    "modeAliases": [
      "algebra"
    ],
    "topics": [
      {
        "id": "equations",
        "title": "Vergelijkingen",
        "href": "games/algebra-trainer/?world=equations&screen=menu",
        "levelIds": [
          "route-inverse",
          "route-two",
          "route-sign",
          "route-both",
          "route-brackets",
          "route-fractions",
          "route-check"
        ]
      },
      {
        "id": "systems",
        "title": "Stelsels",
        "href": "games/algebra-trainer/stelsels.html?world=systems&screen=menu",
        "levelIds": [
          "sys-graphic",
          "sys-substitution",
          "sys-combination",
          "sys-unique",
          "sys-none",
          "sys-infinite"
        ]
      }
    ],
    "engine": {
      "release": "0.6.0",
      "modules": [
        "games/algebra-trainer/core.js",
        "games/algebra-trainer/journey-core.js",
        "games/algebra-trainer/stelsels/core.js"
      ],
      "storageSchema": 1
    }
  },
  {
    "title": "Getallenwereld",
    "subtitle": "Machten, vierkantswortels en wetenschappelijke schrijfwijze. Kies rekenregels, een reeks of een battle.",
    "href": "games/getallenwereld/",
    "category": "Machten, wortels & schrijfwijze",
    "kind": "learn",
    "accent": "blue",
    "theme": "Getallen",
    "art": "getallenwereld",
    "cover": "games/getallenwereld/cover.svg",
    "detail": "19 onderdelen · solo, duo, klasbattle en oefenbladen",
    "id": "getallenwereld",
    "progressType": "levels",
    "teacherVisible": true,
    "gameType": "learn",
    "tracking": "progress",
    "progressTotal": 19,
    "progressUnitSingular": "onderdeel",
    "progressUnitPlural": "onderdelen",
    "featured": true,
    "featureOrder": 6,
    "subject": "Machten, wortels & schrijfwijze",
    "presentation": "formal",
    "coverSmall": "games/getallenwereld/cover.svg",
    "active": true,
    "progressId": "getallenwereld",
    "route": {
      "entry": "games/getallenwereld/",
      "prefix": "games/getallenwereld/"
    },
    "capabilities": {
      "modes": [
        {
          "id": "solo",
          "participation": "solo",
          "purpose": "learn",
          "roles": [
            "guest",
            "student",
            "teacher"
          ],
          "href": "games/getallenwereld/",
          "providerId": "getallenwereld"
        },
        {
          "id": "series",
          "participation": "solo",
          "purpose": "learn",
          "roles": [
            "guest",
            "student",
            "teacher"
          ],
          "title": "Oefenen & samen",
          "description": "Solo, papier, samen leren, battles en resultaten.",
          "href": "games/bewerkingen-trainer/start.html",
          "providerId": "bewerkingen-trainer",
          "topics": [
            "machten",
            "wetenschappelijk",
            "wortels"
          ],
          "topicParam": "world"
        },
        {
          "id": "local",
          "participation": "duo",
          "purpose": "battle",
          "roles": [
            "guest",
            "student",
            "teacher"
          ],
          "href": "games/bewerkingen-trainer/battle.html",
          "providerId": "bewerkingen-trainer",
          "topics": [
            "machten",
            "wetenschappelijk",
            "wortels"
          ],
          "topicParam": "world",
          "title": "Duo-battle",
          "devices": "Met twee op één toestel"
        },
        {
          "id": "classroom",
          "participation": "group",
          "purpose": "battle",
          "roles": [
            "student",
            "teacher"
          ],
          "href": "games/bewerkingen-trainer/classroom.html",
          "providerId": "bewerkingen",
          "classFunction": "bewerkingen-class",
          "rpc": "axioma_game_class",
          "topics": [
            "machten",
            "wetenschappelijk",
            "wortels"
          ],
          "topicParam": "world",
          "title": "Klasbattle",
          "devices": "Met een code op eigen toestellen"
        },
        {
          "id": "teacher",
          "participation": "solo",
          "purpose": "learn",
          "roles": [
            "teacher"
          ],
          "href": "games/bewerkingen-trainer/?mode=teacher&screen=setup",
          "providerId": "bewerkingen-trainer",
          "title": "Borduitleg",
          "description": "Begeleid een uitwerking samen met je klas.",
          "devices": "Leerkracht en klas · één scherm",
          "topics": [
            "machten",
            "wetenschappelijk",
            "wortels"
          ],
          "topicParam": "world"
        },
        {
          "id": "learn",
          "participation": "duo",
          "purpose": "learn",
          "roles": [
            "student",
            "teacher"
          ],
          "title": "Duo Learn",
          "href": "games/bewerkingen-trainer/start.html?view=learn&audience=duo",
          "providerId": "bewerkingen-trainer",
          "topics": [
            "machten",
            "wortels",
            "wetenschappelijk"
          ],
          "topicParam": "world",
          "devices": "2 spelers · elk een toestel",
          "description": "Los zelf op en bespreek daarna samen de antwoorden.",
          "access": "leraarBob-account · link of sessiecode"
        },
        {
          "id": "online",
          "participation": "duo",
          "purpose": "battle",
          "roles": [
            "student",
            "teacher"
          ],
          "title": "Duo Battle",
          "href": "games/bewerkingen-trainer/start.html?view=battle&audience=duo",
          "providerId": "bewerkingen-trainer",
          "topics": [
            "machten",
            "wortels",
            "wetenschappelijk"
          ],
          "topicParam": "world",
          "devices": "2 spelers · elk een toestel",
          "description": "Beantwoord dezelfde vragen binnen de rondetijd.",
          "access": "leraarBob-account · link of sessiecode"
        },
        {
          "id": "classlearn",
          "participation": "group",
          "purpose": "learn",
          "roles": [
            "teacher"
          ],
          "title": "Klaslearn",
          "href": "games/bewerkingen-trainer/start.html?view=learn&audience=class",
          "providerId": "bewerkingen-trainer",
          "topics": [
            "machten",
            "wortels",
            "wetenschappelijk"
          ],
          "topicParam": "world",
          "devices": "De klas · elk een toestel",
          "description": "Eigen antwoorden, samen bespreken; de leerkracht kan meedoen.",
          "access": "Leerkracht start · leerlingen sluiten aan met een code"
        }
      ],
      "worksheets": [
        {
          "id": "operations",
          "title": "Machten, schrijfwijze en wortels",
          "href": "oefenbladen/maken.html?source=bewerkingen-trainer:operations",
          "providerId": "bewerkingen-trainer",
          "description": "Stel een reeks samen en bewaar de opgaven met verbetersleutel in je onderwerpmap.",
          "topics": [
            "machten",
            "wetenschappelijk",
            "wortels"
          ],
          "topicParam": "topic"
        }
      ]
    },
    "engine": {
      "sourceVersion": "0.2",
      "modules": [
        "games/getallenwereld/lessons.js",
        "games/bewerkingen-trainer/core.js"
      ],
      "storageSchema": 1
    },
    "topics": [
      {
        "id": "machten",
        "title": "Machten",
        "href": "games/getallenwereld/?world=getallen&topic=machten&screen=chapter",
        "levelIds": [
          "machten-betekenis",
          "machten-product",
          "machten-quotient",
          "machten-macht",
          "machten-factoren",
          "machten-haakjes",
          "machten-negatief",
          "machten-mix"
        ]
      },
      {
        "id": "wetenschappelijk",
        "title": "Wetenschappelijke schrijfwijze",
        "href": "games/getallenwereld/?world=getallen&topic=wetenschappelijk&screen=chapter",
        "routeModes": [
          "solo",
          "series",
          "local",
          "classroom",
          "teacher"
        ],
        "skillIds": [
          "scientific"
        ],
        "levelIds": [
          "wetenschappelijk-groot",
          "wetenschappelijk-klein",
          "wetenschappelijk-terug",
          "wetenschappelijk-normaliseren"
        ]
      },
      {
        "id": "wortels",
        "title": "Vierkantswortels",
        "href": "games/getallenwereld/?world=getallen&topic=wortels&screen=chapter",
        "levelIds": [
          "wortels-factor",
          "wortels-product",
          "wortels-quotient",
          "wortels-macht",
          "wortels-vereenvoudigen",
          "wortels-som",
          "wortels-regels"
        ]
      }
    ],
    "progressLabel": "Rekenregels"
  },
  {
    "id": "bewerkingen-trainer",
    "title": "Bewerkingentrainer",
    "subtitle": "Machten, wetenschappelijke schrijfwijze en wortels. Stap voor stap.",
    "href": "games/bewerkingen-trainer/",
    "category": "Machten & wortels",
    "kind": "train",
    "accent": "green",
    "theme": "Algebra",
    "art": "trainer",
    "cover": "assets/covers/bewerkingen.svg",
    "detail": "16 vraagvormen · solo, bordduo, klasbattle en leraarmodus",
    "subject": "Machten & wortels",
    "progressType": "levels",
    "progressTotal": 16,
    "progressUnitSingular": "vraagvorm",
    "progressUnitPlural": "vraagvormen",
    "teacherVisible": true,
    "gameType": "train",
    "tracking": "progress",
    "active": true,
    "progressId": "bewerkingen-trainer",
    "route": {
      "entry": "games/bewerkingen-trainer/",
      "prefix": "games/bewerkingen-trainer/"
    },
    "capabilities": {
      "modes": [
        {
          "id": "solo",
          "participation": "solo",
          "purpose": "learn",
          "roles": [
            "guest",
            "student",
            "teacher"
          ],
          "href": "games/bewerkingen-trainer/",
          "providerId": "bewerkingen-trainer"
        },
        {
          "id": "local",
          "participation": "duo",
          "purpose": "battle",
          "roles": [
            "guest",
            "student",
            "teacher"
          ],
          "href": "games/bewerkingen-trainer/battle.html",
          "providerId": "bewerkingen-trainer"
        },
        {
          "id": "classroom",
          "participation": "group",
          "purpose": "battle",
          "roles": [
            "student",
            "teacher"
          ],
          "href": "games/bewerkingen-trainer/classroom.html",
          "providerId": "bewerkingen",
          "classFunction": "bewerkingen-class",
          "rpc": "axioma_game_class",
          "topics": [
            "machten",
            "wetenschappelijk",
            "wortels"
          ],
          "topicParam": "world"
        },
        {
          "id": "teacher",
          "participation": "solo",
          "purpose": "learn",
          "roles": [
            "teacher"
          ],
          "href": "games/bewerkingen-trainer/?mode=teacher",
          "providerId": "bewerkingen-trainer",
          "title": "Samen leren op het klasbord",
          "description": "De leerkracht begeleidt één uitwerking op het klasbord. Geen aparte leerlinginzendingen.",
          "devices": "Leerkracht en klas · één scherm"
        }
      ],
      "worksheets": [
        {
          "id": "operations",
          "title": "Machten, schrijfwijze en wortels",
          "href": "oefenbladen/maken.html?source=bewerkingen-trainer:operations",
          "providerId": "bewerkingen-trainer",
          "description": "Stel een reeks samen en bewaar de opgaven met verbetersleutel in je onderwerpmap."
        }
      ]
    },
    "modeAliases": [
      "bewerkingen"
    ],
    "engine": {
      "modules": [
        "games/bewerkingen-trainer/core.js"
      ]
    },
    "topics": [
      {
        "id": "machten",
        "title": "Machten & letters",
        "scope": "classroom",
        "routeModes": [
          "classroom"
        ],
        "href": "games/bewerkingen-trainer/classroom.html?world=machten",
        "skillIds": [
          "power-power",
          "power-product",
          "power-quotient",
          "power-monomial",
          "power-negative",
          "power-mixed"
        ]
      },
      {
        "id": "wetenschappelijk",
        "title": "Wetenschappelijke schrijfwijze",
        "scope": "classroom",
        "routeModes": [
          "classroom"
        ],
        "href": "games/bewerkingen-trainer/classroom.html?world=wetenschappelijk",
        "skillIds": [
          "scientific"
        ]
      },
      {
        "id": "wortels",
        "title": "Vierkantswortels",
        "scope": "classroom",
        "routeModes": [
          "classroom"
        ],
        "href": "games/bewerkingen-trainer/classroom.html?world=wortels",
        "skillIds": [
          "square-factor",
          "root-product",
          "root-quotient",
          "root-fraction",
          "root-power",
          "root-simplify",
          "root-letters",
          "root-sum",
          "root-sum-mixed"
        ]
      }
    ],
    "parentId": "getallenwereld",
    "componentTitle": "Reeksen"
  }
];
