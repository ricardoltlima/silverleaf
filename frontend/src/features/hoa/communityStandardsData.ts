export type StandardDefinition = {
  term: string;
  definition: string;
};

export type StandardSection = {
  number: string;
  title: string;
  content: string;
  highlight?: boolean;
};

export type StandardCategory = {
  id: string;
  title: string;
  icon: string;
  intro?: string;
  items?: StandardDefinition[];
  sections?: StandardSection[];
};

export const COMMUNITY_STANDARDS: StandardCategory[] = [
  {
    id: "definitions",
    title: "Definitions and Overview",
    icon: "Defs",
    intro:
      "This document assists the ACC and Owners with procedures and guidelines for property alterations. ACC approval does not waive permit responsibilities.",
    items: [
      {
        term: "ACC",
        definition:
          "Architectural Control Committee that reviews exterior alterations and landscape changes."
      },
      {
        term: "Board",
        definition: "Board of Directors of Silverleaf Reserve HOA."
      },
      {
        term: "Declaration",
        definition:
          "Declaration of Restrictions and Covenants for Silverleaf Reserve."
      },
      {
        term: "Association",
        definition:
          "Silverleaf Reserve Homeowners Association, Inc., its successors and assigns."
      },
      {
        term: "CCR",
        definition: "Covenants, Conditions and Regulations."
      }
    ]
  },
  {
    id: "acc",
    title: "Architectural Control Committee",
    icon: "ACC",
    sections: [
      {
        number: "1.01",
        title: "Responsibilities",
        content:
          "The ACC administers architectural and landscape review and control functions. The committee reviews submittals for conformance and keeps alteration records for at least seven years."
      },
      {
        number: "1.02",
        title: "Policy",
        content:
          "Owners and contractors must comply with alteration application guidelines before work begins. No alteration requiring ACC approval may commence before written approval. Unauthorized alterations may be restored at the homeowner's expense."
      },
      {
        number: "1.03",
        title: "Committee Discretion",
        content:
          "Standards do not cover every scenario. In special cases, Board approval may be required and does not establish a precedent."
      }
    ]
  },
  {
    id: "alterations",
    title: "Property Alterations Process",
    icon: "ALT",
    sections: [
      {
        number: "2.01",
        title: "Alterations",
        content:
          "Exterior property alterations require an approved ACC application. Examples include awnings, pavers, color changes, fences, doors, gutters, landscaping, pools, porches, roofing, screen enclosures, and additions."
      },
      {
        number: "2.02",
        title: "Prohibited Items",
        content:
          "Immediate violations include window AC units, satellite dishes over 39.37 inches, prohibited roof materials, and plastic or artificial flowers/turf.",
        highlight: true
      },
      {
        number: "2.03",
        title: "Application Process",
        content:
          "ACC processes only complete submissions with signatures, plans, colors, and pictures. The ACC responds with Approved, Conditional Approval, or Denied."
      },
      {
        number: "2.04",
        title: "Completion",
        content:
          "Approved projects must be completed within six months unless extended by the Board or ACC. Compliance is verified by property management."
      },
      {
        number: "2.05",
        title: "Appeal",
        content:
          "If denied, the applicant may request rehearing and then appeal to the HOA Board. Board decision is final."
      },
      {
        number: "2.06",
        title: "Enforcement Process",
        content:
          "Owners may report violations to property management. Violations proceed through the approved enforcement process."
      }
    ]
  },
  {
    id: "home-design",
    title: "Home Design and Maintenance",
    icon: "HOME",
    sections: [
      { number: "3.02", title: "Animals and Pets", content: "No animals for commercial purposes. Pets must not create nuisance, must be leashed outside, and waste must be cleaned immediately. Pets are not allowed in water bodies." },
      { number: "3.03", title: "Artificial Vegetation", content: "No artificial grass or plants on exterior areas unless approved by ACC." },
      { number: "3.04", title: "ATVs and Dirt Bikes", content: "ATVs and dirt bikes may not be driven in the community and must be stored in garages." },
      { number: "3.05", title: "Awnings", content: "Rear lanai awnings are allowed with prior ACC approval and must be neutral in color." },
      { number: "3.06", title: "Basketball Hoops", content: "Only portable goals are allowed and must be stored out of sight after each use. No use after 10 PM." },
      { number: "3.07", title: "Bird House and Feeder", content: "One birdhouse and/or feeder permitted in rear yard only with dimensional and placement limits." },
      { number: "3.08", title: "Clotheslines", content: "Allowed in rear only, not visible from street or neighboring property, and removed when not in use." },
      { number: "3.09", title: "Commercial Vehicles", content: "Commercial vehicles are not permitted on driveways and must be parked in garages, except some government vehicles." },
      { number: "3.10", title: "Community Yard Sales", content: "No personal yard sale events. Community events are coordinated by management." },
      { number: "3.11", title: "Curb Numbers", content: "Painted curb numbers are not permitted." },
      { number: "3.12", title: "Drainage", content: "Gutters and downspouts are allowed in approved style and may not direct water to common/neighbor property." },
      { number: "3.13", title: "Driveways", content: "Driveways must use approved materials and be kept clean. Reflectors are not permitted." },
      { number: "3.14", title: "Equipment", content: "Lawn, car-care, and work equipment must not be stored in front/sides and must be out of street view." },
      { number: "3.15", title: "Exterior Finish and Colors", content: "Colors must comply with community color standards. Repainting and color changes require ACC approval." },
      { number: "3.16", title: "Exterior Lighting", content: "Coach light design, color, and placement must follow standards. No colored bulbs except holiday season." },
      { number: "3.17", title: "Fences, Walls and Screening", content: "Only approved fence types/colors are allowed. No wooden or chain-link fences. Screen enclosure material and framing are restricted." },
      { number: "3.18", title: "Fountains and Sculptures", content: "No fountain or sculpture in front of the house." },
      { number: "3.19", title: "Front Doors and Entryway", content: "Door style/color changes require ACC approval. Decorative item limits apply." },
      { number: "3.20", title: "Fruit Trees", content: "Fruit-bearing trees are not permitted." },
      { number: "3.21", title: "Garages and Garage Doors", content: "No carports/unattached garages/screening. Garage doors should remain closed unless needed for access." },
      { number: "3.22", title: "Garbage Cans", content: "Trash containers must be concealed except permitted pickup windows and returned promptly." },
      { number: "3.23", title: "Garden Hoses", content: "Hangers/reels must be side-mounted, concealed, and neutral in color." },
      { number: "3.24", title: "Garden and Walkway Lighting", content: "ACC approval required. Light placement, height, and bulb limits apply." },
      { number: "3.25", title: "Generators", content: "Permanent external propane generators may be allowed with ACC approval and permits; use only during outages." },
      { number: "3.26", title: "Glass Block", content: "Glass blocks on home/additions are not allowed." },
      { number: "3.27", title: "Grills", content: "Grills must be covered and stored behind home/patio when not in use." },
      { number: "3.28", title: "Heating and Air Conditioning", content: "Outdoor units must minimize noise and be screened from view." },
      { number: "3.29", title: "Holiday Decorations", content: "Decorations are restricted to specific date windows and must be removed by required dates." },
      { number: "3.30", title: "House Numbers", content: "Numbers must be clearly readable from street and replaced promptly if missing." },
      { number: "3.31", title: "Hurricane Shutters", content: "Shutters may be installed shortly before storms and removed/opened soon after warnings end." },
      { number: "3.32", title: "Irrigation", content: "Owners are responsible for treating/removing irrigation staining." },
      { number: "3.33", title: "Nuisances", content: "No offensive or unsightly activities; Board interpretation is final." },
      { number: "3.34", title: "Painting and Cleaning", content: "Roof/exterior/pavement cleaning and repainting timelines apply after ACC notice." },
      { number: "3.35", title: "Patio and Lanai Furniture", content: "Front outdoor furniture requires ACC approval and must be neutral outdoor type." },
      { number: "3.36", title: "Play Structures", content: "Height/material/canopy/screening requirements apply for play structures." },
      { number: "3.37", title: "Porches, Decks and Screen Enclosures", content: "All require ACC submission; material and visibility limits apply." },
      { number: "3.38", title: "Potted Plants", content: "Potted plant count limits apply in driveway and front property areas." },
      { number: "3.39", title: "Prohibited Vehicles", content: "Commercial and recreational vehicles/trailers/boats are prohibited outside garages." },
      { number: "3.40", title: "Rain Barrels", content: "Require ACC approval and must be rear-located, concealed, and neutral colored." },
      { number: "3.42", title: "Repairs", content: "Inoperable vehicles may not remain outside more than 12 hours; repairs outside garage are limited." },
      { number: "3.44", title: "Roofs", content: "All roofing changes require prior ACC approval." },
      { number: "3.45", title: "Satellite Dishes", content: "Visible antenna/satellite equipment requires ACC approval; non-FCC-protected equipment is prohibited." },
      { number: "3.46", title: "Security Lighting", content: "Security lighting type, quantity, orientation, and control requirements apply." },
      { number: "3.47", title: "Signs and Flags", content: "Signs are restricted. Specific flag/flagpole allowances and dimensions apply." },
      { number: "3.48", title: "Solar Equipment", content: "Solar equipment must be reviewed and approved by ACC." },
      { number: "3.49", title: "Soliciting", content: "No soliciting or flyer distribution allowed in the community." },
      { number: "3.51", title: "Swimming Pools and Spas", content: "Above-ground pools are prohibited. In-ground pools/spas require ACC approval and must meet limits." },
      { number: "3.52", title: "Substances and Fuel", content: "Flammable/combustible materials are restricted to normal household use. Most tanks must be concealed." },
      { number: "3.53", title: "Temporary Storage Containers", content: "One POD per residence for up to 14 days unless extension is approved." },
      { number: "3.55", title: "Towing", content: "Persistent violations may result in towing at owner expense after notice period." },
      { number: "3.56", title: "Trailers", content: "All trailer types must be stored in garages with doors closed." },
      { number: "3.57", title: "Trampolines", content: "ACC approval required; rear placement and visibility restrictions apply." },
      { number: "3.59", title: "Vehicles and Parking", content: "Vehicles must be licensed and parked in garage/driveway without blocking sidewalks; guest space rules apply." },
      { number: "3.60", title: "Vegetable Gardens", content: "Vegetable planting requires ACC submission and must be screened and rear-located." },
      { number: "3.62", title: "Water Softeners", content: "Outdoor softeners are allowed only if screened from view." },
      { number: "3.63", title: "Watercraft", content: "Boats, jet skis, kayaks, and related equipment must be stored in garages." },
      { number: "3.65", title: "Wetlands", content: "Vegetation removal in wetlands/conservation areas is prohibited; fines are charged to responsible owners." },
      { number: "3.66", title: "Window Treatments", content: "Window coverings must be proper and neutral toward street-facing sides; temporary coverings are limited." },
      { number: "3.67", title: "Window and Wall AC Units", content: "No window or wall AC units may be installed." },
      { number: "3.68", title: "Yard Ornamentation", content: "Limited number/size of approved ornaments allowed; unauthorized items may be removed after notice." }
    ]
  },
  {
    id: "landscaping",
    title: "Landscaping",
    icon: "LAND",
    sections: [
      {
        number: "4.02",
        title: "Landscaping Maintenance",
        content:
          "Landscape changes require ACC approval. Owners must maintain healthy, harmonious, trimmed landscaping and avoid invasive species."
      },
      {
        number: "4.03",
        title: "Landscape Edging",
        content:
          "Edging must be ACC-approved. Approved examples include concrete curbing, stacked brick/block/rock, and black rubber tube edging."
      },
      {
        number: "4.04",
        title: "Bedding Coverings",
        content:
          "Beds require minimum mulch depth or approved rock color ranges in tan/beige/brown/dark gray."
      },
      {
        number: "4.05",
        title: "Turf",
        content: "Artificial turf is not approved in Silverleaf Reserve."
      }
    ]
  }
];
