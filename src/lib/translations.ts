export const translations = {
  en: {
    // Navigation
    browse: "Browse",
    messages: "Messages",
    orders: "Orders",
    products: "Products",
    settings: "Settings",
    profile: "Profile",
    signOut: "Sign Out",
    
    // Common
    search: "Search",
    searchPlaceholder: "Search for items...",
    filter: "Filter",
    sort: "Sort",
    price: "Price",
    condition: "Condition",
    location: "Location",
    save: "Save",
    saved: "Saved",
    cancel: "Cancel",
    confirm: "Confirm",
    submit: "Submit",
    loading: "Loading...",
    error: "Error",
    success: "Success",
    
    // Listings
    allCategories: "All Categories",
    newest: "Newest",
    oldest: "Oldest",
    priceLowHigh: "Price: Low to High",
    priceHighLow: "Price: High to Low",
    mostViewed: "Most Viewed",
    relevance: "Relevance",
    today: "Today",
    pastWeek: "Past Week",
    pastMonth: "Past Month",
    pastYear: "Past Year",
    
    // Conditions
    new: "New",
    likeNew: "Like New",
    good: "Good",
    fair: "Fair",
    
    // Listing Detail
    description: "Description",
    sellerInformation: "Seller Information",
    verifiedSeller: "Verified Seller",
    buyNow: "Buy Now",
    messageSeller: "Message Seller",
    makeAnOffer: "Make an Offer",
    safetyTips: "Safety Tips",
    views: "views",
    
    // Offer
    offerPrice: "Offer Price",
    originalPrice: "Original price",
    offerMessage: "Message",
    offerMessagePlaceholder: "Add a message to the seller...",
    sendOffer: "Send Offer",
    offerSent: "Offer sent successfully!",
    
    // Auth
    login: "Login",
    register: "Register",
    email: "Email",
    password: "Password",
    fullName: "Full Name",
    alreadyHaveAccount: "Already have an account?",
    dontHaveAccount: "Don't have an account?",
    
    // Messages
    typeMessage: "Type a message...",
    send: "Send",
    
    // Orders
    orderStatus: "Order Status",
    pending: "Pending",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
    total: "Total",
    shippingAddress: "Shipping Address",
    
    // Settings
    theme: "Theme",
    language: "Language",
    light: "Light",
    dark: "Dark",
    system: "System",
  },
  fil: {
    // Navigation
    browse: "Mag-browse",
    messages: "Mensahe",
    orders: "Mga Order",
    products: "Mga Produkto",
    settings: "Mga Setting",
    profile: "Profile",
    signOut: "Mag-sign Out",
    
    // Common
    search: "Maghanap",
    searchPlaceholder: "Maghanap ng mga item...",
    filter: "I-filter",
    sort: "Ayusin",
    price: "Presyo",
    condition: "Kondisyon",
    location: "Lokasyon",
    save: "I-save",
    saved: "Na-save",
    cancel: "Kanselahin",
    confirm: "Kumpirmahin",
    submit: "Isumite",
    loading: "Naglo-load...",
    error: "Error",
    success: "Tagumpay",
    
    // Listings
    allCategories: "Lahat ng Kategorya",
    newest: "Pinakabago",
    oldest: "Pinakaluma",
    priceLowHigh: "Presyo: Mababa sa Mataas",
    priceHighLow: "Presyo: Mataas sa Mababa",
    mostViewed: "Pinakaraming Tingnan",
    relevance: "Kaugnayan",
    today: "Ngayon",
    pastWeek: "Nakaraang Linggo",
    pastMonth: "Nakaraang Buwan",
    pastYear: "Nakaraang Taon",
    
    // Conditions
    new: "Bago",
    likeNew: "Parang Bago",
    good: "Mabuti",
    fair: "Pantay",
    
    // Listing Detail
    description: "Paglalarawan",
    sellerInformation: "Impormasyon ng Nagbebenta",
    verifiedSeller: "Beripikadong Nagbebenta",
    buyNow: "Bumili Ngayon",
    messageSeller: "Mag-message sa Nagbebenta",
    makeAnOffer: "Mag-alok",
    safetyTips: "Mga Tip sa Seguridad",
    views: "tingin",
    
    // Offer
    offerPrice: "Presyo ng Aloke",
    originalPrice: "Orihinal na presyo",
    offerMessage: "Mensahe",
    offerMessagePlaceholder: "Magdagdag ng mensahe sa nagbebenta...",
    sendOffer: "Ipadala ang Aloke",
    offerSent: "Matagumpay na naipadala ang aloke!",
    
    // Auth
    login: "Mag-login",
    register: "Mag-rehistro",
    email: "Email",
    password: "Password",
    fullName: "Pangalan",
    alreadyHaveAccount: "May account ka na?",
    dontHaveAccount: "Wala ka pang account?",
    
    // Messages
    typeMessage: "Mag-type ng mensahe...",
    send: "Ipadala",
    
    // Orders
    orderStatus: "Status ng Order",
    pending: "Nakabinbin",
    processing: "Pinoproseso",
    shipped: "Naipadala na",
    delivered: "Naihatid na",
    cancelled: "Kinansela",
    total: "Kabuuan",
    shippingAddress: "Address ng Pagpapadala",
    
    // Settings
    theme: "Tema",
    language: "Wika",
    light: "Liwanag",
    dark: "Madilim",
    system: "System",
  }
}

export type Language = 'en' | 'fil'
export type TranslationKey = keyof typeof translations.en

export function t(key: TranslationKey, lang: Language = 'en'): string {
  return translations[lang][key] || translations.en[key] || key
}
