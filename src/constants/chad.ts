export const CHAD_REGIONS = [
  { id: 'ndjamena', nameFr: "N'Djamena", nameAr: 'انجمينا', nameSara: "N'Djamena" },
  { id: 'logone-occidental', nameFr: 'Logone Occidental', nameAr: 'لوقون الغربي', nameSara: 'Logone Occidental' },
  { id: 'logone-oriental', nameFr: 'Logone Oriental', nameAr: 'لوقون الشرقي', nameSara: 'Logone Oriental' },
  { id: 'mayo-kebbi-est', nameFr: 'Mayo-Kebbi Est', nameAr: 'مايو كيبي الشرقي', nameSara: 'Mayo-Kebbi Est' },
  { id: 'mayo-kebbi-ouest', nameFr: 'Mayo-Kebbi Ouest', nameAr: 'مايو كيبي الغربي', nameSara: 'Mayo-Kebbi Ouest' },
  { id: 'moyen-chari', nameFr: 'Moyen-Chari', nameAr: 'شاري الأوسط', nameSara: 'Moyen-Chari' },
  { id: 'ouaddai', nameFr: 'Ouaddaï', nameAr: 'واداي', nameSara: 'Ouaddaï' },
  { id: 'salamat', nameFr: 'Salamat', nameAr: 'سلامات', nameSara: 'Salamat' },
  { id: 'tandjile', nameFr: 'Tandjilé', nameAr: 'تانجيلي', nameSara: 'Tandjilé' },
  { id: 'batha', nameFr: 'Batha', nameAr: 'باثا', nameSara: 'Batha' },
  { id: 'borkou', nameFr: 'Borkou', nameAr: 'بوركو', nameSara: 'Borkou' },
  { id: 'chari-baguirmi', nameFr: 'Chari-Baguirmi', nameAr: 'شاري باقيرمي', nameSara: 'Chari-Baguirmi' },
  { id: 'ennedi-est', nameFr: 'Ennedi Est', nameAr: 'إنيدي الشرقي', nameSara: 'Ennedi Est' },
  { id: 'ennedi-ouest', nameFr: 'Ennedi Ouest', nameAr: 'إنيدي الغربي', nameSara: 'Ennedi Ouest' },
  { id: 'guera', nameFr: 'Guéra', nameAr: 'قيرا', nameSara: 'Guéra' },
  { id: 'hadjer-lamis', nameFr: 'Hadjar-Lamis', nameAr: 'هاجر لاميس', nameSara: 'Hadjar-Lamis' },
  { id: 'kanem', nameFr: 'Kanem', nameAr: 'كانم', nameSara: 'Kanem' },
  { id: 'lac', nameFr: 'Lac', nameAr: 'بحيرة', nameSara: 'Lac' },
  { id: 'mandoul', nameFr: 'Mandoul', nameAr: 'مندول', nameSara: 'Mandoul' },
  { id: 'sila', nameFr: 'Sila', nameAr: 'سيلا', nameSara: 'Sila' },
  { id: 'tibesti', nameFr: 'Tibesti', nameAr: 'تيبستي', nameSara: 'Tibesti' },
  { id: 'wadi-fira', nameFr: 'Wadi Fira', nameAr: 'وادي فيرا', nameSara: 'Wadi Fira' },
] as const;

export const CITIES_BY_REGION: Record<string, string[]> = {
  ndjamena: ["N'Djamena"],
  'logone-occidental': ['Moundou', 'Benoye', 'Doba'],
  'logone-oriental': ['Doba', 'Goré', 'Bebalem'],
  'mayo-kebbi-est': ['Bongor', 'Léré', 'Guelendeng'],
  'mayo-kebbi-ouest': ['Pala', 'Lamine', 'Gagal'],
  'moyen-chari': ['Sarh', 'Kyabé', 'Haraze'],
  ouaddai: ['Abéché', 'Adré', 'Am Dam'],
  salamat: ['Am Timan', 'Haraze Mangueigne'],
  tandjile: ['Laï', 'Béré', 'Kelo'],
  batha: ['Ati', 'Oum Hadjer'],
  borkou: ['Faya-Largeau', 'Kouba Olanga'],
  'chari-baguirmi': ['Massenya', 'Bousso', 'Dourbali'],
  'ennedi-est': ['Fada', 'Kalaït'],
  'ennedi-ouest': ['Faya-Largeau'],
  guera: ['Mongo', 'Bitkine', 'Melfi'],
  'hadjer-lamis': ['Massakory', 'Bokoro', 'Mangalmé'],
  kanem: ['Mao', 'Nokou', 'Rig-Rig'],
  lac: ['Bol', 'Liwa', 'Ngouri'],
  mandoul: ['Koumra', 'Moïssala', 'Bébédjia'],
  sila: ['Goz Beïda', 'Koukou Angarana'],
  tibesti: ['Bardaï', 'Zouar'],
  'wadi-fira': ['Biltine', 'Iriba', 'Guéréda'],
};

export const SUPPORTED_LANGUAGES = [
  { code: 'fr', label: 'Français', nativeLabel: 'Français' },
  { code: 'ar', label: 'Arabe tchadien', nativeLabel: 'العربية التشادية' },
  { code: 'sara', label: 'Sara', nativeLabel: 'Sara' },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];

export const PLATFORM_COMMISSION = 0.1;

export const BADGE_LABELS = {
  beginner: { fr: 'Débutant', ar: 'مبتدئ', sara: 'Débutant' },
  confirmed: { fr: 'Confirmé', ar: 'مؤكد', sara: 'Confirmé' },
  expert: { fr: 'Expert', ar: 'خبير', sara: 'Expert' },
  top_talent: { fr: 'Top Talent', ar: 'أفضل موهبة', sara: 'Top Talent' },
  verified: { fr: 'Vérifié', ar: 'موثق', sara: 'Vérifié' },
  premium: { fr: 'Premium', ar: 'بريميوم', sara: 'Premium' },
} as const;
