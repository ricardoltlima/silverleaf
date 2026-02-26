export type SilverleafGroup = {
  slug: string;
  name: string;
  description: string;
};

export const GROUPS: SilverleafGroup[] = [
  {
    slug: "pickleball",
    name: "Pickleball Group",
    description: "Weekly matches, training sessions, and event scheduling."
  },
  {
    slug: "bike",
    name: "Bike Riders",
    description: "Route planning, safety tips, and weekend rides."
  },
  {
    slug: "fishing",
    name: "Fishing Crew",
    description: "Local spots, gear recommendations, and meetup planning."
  },
  {
    slug: "family",
    name: "Family Activities",
    description: "Kids-friendly events and neighborhood family meetups."
  }
];
