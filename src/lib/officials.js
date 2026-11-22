// Positions of the Samiti committee, in the order a committee list is read.
// The position sets the display order; officials with the same position follow the display number, then the name.
export const OFFICIAL_POSITIONS = [
  { id: 'patron', order: 5, en: 'Patron', bn: 'পৃষ্ঠপোষক' },
  { id: 'advisor', order: 8, en: 'Advisor', bn: 'উপদেষ্টা' },
  { id: 'president', order: 10, en: 'President', bn: 'সভাপতি' },
  { id: 'vice_president', order: 20, en: 'Vice President', bn: 'সহ-সভাপতি' },
  { id: 'general_secretary', order: 30, en: 'General Secretary', bn: 'সাধারণ সম্পাদক' },
  { id: 'joint_secretary', order: 40, en: 'Joint Secretary', bn: 'যুগ্ম সম্পাদক' },
  { id: 'assistant_secretary', order: 42, en: 'Assistant Secretary', bn: 'সহ-সম্পাদক' },
  { id: 'organising_secretary', order: 45, en: 'Organising Secretary', bn: 'সাংগঠনিক সম্পাদক' },
  { id: 'treasurer', order: 50, en: 'Treasurer', bn: 'কোষাধ্যক্ষ' },
  { id: 'office_secretary', order: 60, en: 'Office Secretary', bn: 'দপ্তর সম্পাদক' },
  { id: 'cultural_secretary', order: 65, en: 'Cultural Secretary', bn: 'সাংস্কৃতিক সম্পাদক' },
  { id: 'publicity_secretary', order: 67, en: 'Publicity Secretary', bn: 'প্রচার সম্পাদক' },
  { id: 'member', order: 100, en: 'Executive Member', bn: 'কার্যনির্বাহী সদস্য' }
]
export const positionById = id => OFFICIAL_POSITIONS.find(p => p.id === id) || null

// Leaders (patron to treasurer) get a larger card on the public page
export const LEADER_POSITIONS = ['patron', 'advisor', 'president', 'vice_president', 'general_secretary', 'treasurer']
