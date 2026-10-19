export const TRANSLATION_EDITIONS = {
  bangla: [
    { id: "bn.rahman", name: "ড. মজিবুর রহমান (Mujibur Rahman)", shortName: "মজিবুর রহমান", author: "Dr. Mujibur Rahman", recommended: true },
    { id: "bn.bengali", name: "মুফতি তাকী উসমানী / মাও. মুহিউদ্দীন খান", shortName: "তাকী উসমানী", author: "Mufti Taqi Usmani / Muhiuddin Khan" },
    { id: "bn.zakaria", name: "ড. আবু বকর মুহাম্মাদ যাকারিয়া", shortName: "আবু বকর জাকারিয়া", author: "Dr. Abu Bakr Muhammad Zakaria" },
  ],
  english: [
    { id: "en.sahih", name: "Saheeh International", shortName: "Sahih Int.", author: "Saheeh International", recommended: true },
    { id: "en.khattab", name: "The Clear Quran (Dr. Mustafa Khattab)", shortName: "Clear Quran", author: "Dr. Mustafa Khattab" },
    { id: "en.yusufali", name: "Abdullah Yusuf Ali", shortName: "Yusuf Ali", author: "Abdullah Yusuf Ali" },
  ],
  tafsir: [
    { id: "tafsir-ibn-kathir", name: "তাফসীর ইবনে কাসীর (Tafsir Ibn Kathir)", author: "ইমাম ইমাদুদ্দীন ইবনে কাসীর (রহ.)" },
    { id: "tafsir-ahsanul-bayan", name: "তাফসীর আহসানুল বায়ান (Ahsanul Bayan)", author: "শায়খ সালাহুদ্দীন ইউসুফ" },
    { id: "tafsir-zakaria", name: "তাফসীর আল-কুরআনুল কারীম", author: "ড. আবু বকর মুহাম্মাদ যাকারিয়া" },
  ],
  scripts: [
    { id: "quran-uthmani", name: "উসমানী লিপি (Uthmani Script)", fontClass: "font-uthmani", description: "মদীনা মুসহাফ ও আন্তর্জাতিক স্ট্যান্ডার্ড হাফস লিপি" },
    { id: "quran-indopak", name: "ইন্দো-পাক লিপি (Indo-Pak Script)", fontClass: "font-indopak", description: "বাংলাদেশ, ভারত ও পাকিস্তানে প্রচলিত ১৫/১৬ লাইন নূরানী লিপি" },
  ],
  readingModes: [
    { id: "standard", name: "তিলাওয়াত ও অনুবাদ", icon: "BookOpen", desc: "আরবি, বাংলা ও ইংরেজি অনুবাদ এবং তাফসীর সহ" },
    { id: "nazera", name: "নূরানী / নাজেরা মোড", icon: "Sparkles", desc: "অনুবাদ ছাড়া বড় আরবি অক্ষরে একটানা পবিত্র তিলাওয়াতের জন্য" },
    { id: "hifz", name: "হিফজ / মুখস্থ মোড", icon: "Brain", desc: "১৫-লাইন মুসহাফ ভিউ, আয়াত পুনরাবৃত্তি ও লুকানো-অনুবাদ সুবিধাসহ" },
  ]
};
