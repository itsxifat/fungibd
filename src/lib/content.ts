// Website copy that rarely changes. Health information is written conservatively ("helps", "supports")
// and is based on published nutrition data (USDA FoodData Central) — it is not medical advice.

export type Benefit = {
  key: string;
  icon: "dumbbell" | "shield" | "heart" | "scale" | "droplet" | "sun" | "zap" | "sparkles" | "sprout" | "bone";
  titleBn: string;
  titleEn: string;
  textBn: string;
  textEn: string;
  stat: string;
  statLabel: string;
};

export const BENEFITS: Benefit[] = [
  {
    key: "protein",
    icon: "dumbbell",
    titleBn: "উদ্ভিজ্জ প্রোটিন",
    titleEn: "Plant protein",
    textBn: "শরীরের প্রয়োজনীয় ৯টি অ্যামাইনো অ্যাসিডই আছে — মাছ-মাংস কম খাওয়া পরিবারের জন্য চমৎকার।",
    textEn: "Contains all 9 essential amino acids — great for meat-light meals.",
    stat: "9/9",
    statLabel: "essential amino acids",
  },
  {
    key: "immunity",
    icon: "shield",
    titleBn: "রোগ প্রতিরোধে সহায়ক",
    titleEn: "Supports immunity",
    textBn: "বিটা-গ্লুকান নামের প্রাকৃতিক আঁশ শরীরের রোগ প্রতিরোধ ব্যবস্থাকে সক্রিয় রাখতে সাহায্য করে।",
    textEn: "Natural beta-glucan fibres help keep your immune system active.",
    stat: "β-glucan",
    statLabel: "natural immune fibre",
  },
  {
    key: "heart",
    icon: "heart",
    titleBn: "হার্টের বন্ধু",
    titleEn: "Kind to your heart",
    textBn: "কোলেস্টেরল-মুক্ত, প্রায় চর্বিহীন ও কম সোডিয়াম; পটাশিয়াম রক্তচাপ নিয়ন্ত্রণে সাহায্য করে।",
    textEn: "Cholesterol-free, almost fat-free, low sodium — and potassium for healthy blood pressure.",
    stat: "0 mg",
    statLabel: "cholesterol",
  },
  {
    key: "weight",
    icon: "scale",
    titleBn: "ওজন নিয়ন্ত্রণে",
    titleEn: "Light yet filling",
    textBn: "১০০ গ্রামে মাত্র ~৩৩ ক্যালরি, কিন্তু আঁশ বেশি — অনেকক্ষণ পেট ভরা রাখে।",
    textEn: "Only ~33 kcal per 100 g, with fibre that keeps you full for longer.",
    stat: "33",
    statLabel: "kcal per 100 g",
  },
  {
    key: "sugar",
    icon: "droplet",
    titleBn: "ডায়াবেটিস-বান্ধব",
    titleEn: "Diabetes-friendly",
    textBn: "কম শর্করা ও কম গ্লাইসেমিক ইনডেক্স; আঁশ রক্তে চিনি ধীরে মিশতে সাহায্য করে।",
    textEn: "Low carb and low GI; fibre slows down how fast sugar enters the blood.",
    stat: "Low GI",
    statLabel: "steady blood sugar",
  },
  {
    key: "vitd",
    icon: "sun",
    titleBn: "রোদের ভিটামিন ডি",
    titleEn: "Sunshine vitamin D",
    textBn: "রোদে রাখলে মাশরুম নিজেই ভিটামিন ডি তৈরি করে। রান্নার আগে ৩০ মিনিট রোদে রাখুন — হাড় ও দাঁত মজবুত হবে।",
    textEn: "Mushrooms make vitamin D in sunlight. Sun them for 30 minutes before cooking for stronger bones.",
    stat: "30 min",
    statLabel: "in the sun = more Vit D",
  },
  {
    key: "energy",
    icon: "zap",
    titleBn: "ভিটামিন বি ও শক্তি",
    titleEn: "B-vitamins for energy",
    textBn: "রাইবোফ্লাভিন, নিয়াসিন ও প্যান্টোথেনিক অ্যাসিড খাবারকে শক্তিতে রূপান্তর করতে সাহায্য করে।",
    textEn: "Riboflavin, niacin and pantothenic acid help turn food into energy.",
    stat: "B2·B3·B5",
    statLabel: "energy vitamins",
  },
  {
    key: "antioxidant",
    icon: "sparkles",
    titleBn: "অ্যান্টিঅক্সিডেন্ট",
    titleEn: "Antioxidant power",
    textBn: "এরগোথায়োনিন ও সেলেনিয়াম কোষকে ক্ষতিকর ফ্রি-র‍্যাডিক্যাল থেকে রক্ষা করে।",
    textEn: "Ergothioneine and selenium help protect your cells from free-radical damage.",
    stat: "ERGO",
    statLabel: "rare antioxidant",
  },
  {
    key: "gut",
    icon: "sprout",
    titleBn: "হজম ও পেটের যত্ন",
    titleEn: "Happy gut",
    textBn: "মাশরুমের আঁশ প্রিবায়োটিক — পেটের উপকারী ব্যাকটেরিয়ার খাবার জোগায়।",
    textEn: "Mushroom fibre is prebiotic — it feeds your good gut bacteria.",
    stat: "2.3 g",
    statLabel: "fibre per 100 g",
  },
  {
    key: "minerals",
    icon: "bone",
    titleBn: "আয়রন ও খনিজ",
    titleEn: "Iron & minerals",
    textBn: "আয়রন, কপার, পটাশিয়াম ও ফসফরাস — রক্ত ও হাড়ের সুস্থতায়।",
    textEn: "Iron, copper, potassium and phosphorus for healthy blood and bones.",
    stat: "Fe·K·P",
    statLabel: "key minerals",
  },
];

/** Oyster mushroom, raw, per 100 g — USDA FoodData Central (approx.) */
export const NUTRITION: { bn: string; en: string; value: string }[] = [
  { bn: "ক্যালরি", en: "Energy", value: "33 kcal" },
  { bn: "প্রোটিন", en: "Protein", value: "3.3 g" },
  { bn: "শর্করা", en: "Carbohydrate", value: "6.1 g" },
  { bn: "আঁশ", en: "Dietary fibre", value: "2.3 g" },
  { bn: "চর্বি", en: "Fat", value: "0.4 g" },
  { bn: "কোলেস্টেরল", en: "Cholesterol", value: "0 mg" },
  { bn: "পটাশিয়াম", en: "Potassium", value: "420 mg" },
  { bn: "ফসফরাস", en: "Phosphorus", value: "120 mg" },
  { bn: "আয়রন", en: "Iron", value: "1.3 mg" },
  { bn: "নিয়াসিন (বি৩)", en: "Niacin (B3)", value: "5.0 mg" },
  { bn: "রাইবোফ্লাভিন (বি২)", en: "Riboflavin (B2)", value: "0.35 mg" },
  { bn: "ফোলেট", en: "Folate", value: "38 µg" },
];

export const STORAGE_TIPS = [
  { bn: "পেপার ব্যাগ বা আমাদের বক্সে ফ্রিজের নিচের তাকে রাখুন", en: "Keep in a paper bag or our box, lower shelf of the fridge" },
  { bn: "প্লাস্টিকে মুখ বন্ধ করে রাখবেন না — ঘেমে নষ্ট হয়", en: "Never seal in plastic — trapped moisture spoils them" },
  { bn: "রান্নার ঠিক আগে হালকা মুছে বা ধুয়ে নিন", en: "Wipe or rinse quickly just before cooking" },
  { bn: "তাজা মাশরুম ২–৩ দিনের মধ্যে রান্না করুন", en: "Cook fresh mushrooms within 2–3 days" },
];

export const COOK_IDEAS = [
  { bn: "মাশরুম ভাজি", en: "Garlic stir-fry" },
  { bn: "মাশরুম ঝোল", en: "Curry" },
  { bn: "স্যুপ", en: "Soup" },
  { bn: "নুডলস ও পাস্তা", en: "Noodles & pasta" },
  { bn: "ডিম-মাশরুম", en: "Omelette" },
  { bn: "বিরিয়ানি/পোলাও", en: "Biryani" },
];

export const HOW_IT_WORKS = [
  { bn: "অর্ডার করুন", en: "Order online", textBn: "পছন্দের মাশরুম বেছে নিন, ম্যাপে বাসা পিন করুন বা বিস্তারিত ঠিকানা লিখুন।", textEn: "Choose your mushrooms and pin your home on the map." },
  { bn: "আমরা প্যাক করি", en: "We pack it", textBn: "আমাদের খামার থেকে মাশরুম বাছাই করে যত্নের সাথে প্যাক করা হয়।", textEn: "We sort and pack your order from our farm." },
  { bn: "দরজায় ডেলিভারি", en: "Delivered to you", textBn: "আপনার বেছে নেওয়া দিন ও সময়ে দরজায় ডেলিভারি — হাতে পেয়ে টাকা দিন।", textEn: "Delivered on your chosen day. Pay cash on delivery." },
];

export const FAQS = [
  {
    q: "কোন কোন এলাকায় ডেলিভারি দেন? · Where do you deliver?",
    a: "ঢাকা ও আশপাশের কিছু এলাকায় (যেমন সাভার) ডেলিভারি দিই, আর নতুন এলাকা যোগ হচ্ছে। চেকআউটে ম্যাপে বাসা পিন করলেই বুঝবেন আপনার জায়গায় ডেলিভারি যায় কি না, আর এলাকা বেছে নিলে চার্জ দেখতে পাবেন। We deliver in Dhaka and nearby areas such as Savar, with more areas coming. Pin your home at checkout to check.",
  },
  {
    q: "কখন ডেলিভারি পাব? · When will I get my order?",
    a: "চেকআউটে আপনি নিজেই ডেলিভারির দিন ও সময় বেছে নিতে পারবেন। অর্ডার নিশ্চিত হলে ইমেইলে জানিয়ে দেওয়া হবে। You choose the delivery day and time slot at checkout.",
  },
  {
    q: "প্রি-অর্ডার কীভাবে কাজ করে? · How does pre-order work?",
    a: "যেসব মাশরুমে প্রি-অর্ডার চালু আছে, সেগুলো এখনই বুক করে রাখতে পারেন। হারভেস্টের পর নির্ধারিত তারিখে ডেলিভারি দেওয়া হবে। টাকা দেবেন ডেলিভারির সময়। Book now, we deliver on the scheduled harvest date, you pay on delivery.",
  },
  {
    q: "পেমেন্ট কীভাবে করব? · How do I pay?",
    a: "ক্যাশ অন ডেলিভারি — পণ্য হাতে পেয়ে টাকা দিন। Cash on delivery.",
  },
  {
    q: "অর্ডার ট্র্যাক করব কীভাবে? · How do I track my order?",
    a: "‘অর্ডার ট্র্যাক’ পেজে অর্ডার নম্বর ও মোবাইল নম্বর দিন। প্রতিটি আপডেট ইমেইলেও পাঠানো হয়। Use the Track order page with your order number and phone.",
  },
  {
    q: "তাজা মাশরুম কীভাবে সংরক্ষণ করব? · How should I store mushrooms?",
    a: "পেপার ব্যাগে ফ্রিজের নিচের তাকে রাখুন এবং কয়েক দিনের মধ্যে রান্না করুন। প্লাস্টিকে মুখ বন্ধ করে রাখবেন না। Keep in a paper bag in the fridge and cook within a few days.",
  },
  {
    q: "অর্ডার পরিবর্তন বা বাতিল করব কীভাবে? · Can I change or cancel?",
    a: "ডেলিভারির জন্য রওনা হওয়ার আগে ফোন করুন বা সাপোর্ট পেজে মেসেজ দিন। Contact us before the order is dispatched.",
  },
  {
    q: "পাইকারি অর্ডার নেন? · Do you take wholesale orders?",
    a: "রেস্টুরেন্ট, হোটেল বা দোকানের জন্য পাইকারি পেজে ফর্ম পূরণ করুন — আমরা যোগাযোগ করব। Fill in the wholesale form and we will contact you.",
  },
];
