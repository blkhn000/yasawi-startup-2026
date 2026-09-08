import type { Metadata } from "next";
import { localizedPath, locales, type Locale } from "./config";

const seo = {
  ru: {
    home: ["YASAWI STARTUP — от идеи до запуска", "Бизнес-инкубатор Университета Ахмеда Ясави в Туркестане: программы, обучение и поддержка стартапов."],
    about: ["О нас — YASAWI STARTUP", "Команда, миссия и результаты бизнес-инкубатора YASAWI STARTUP."],
    programs: ["Программы — YASAWI STARTUP", "Инкубация, акселерация и бесплатное практическое IT-обучение в Туркестане."],
    incubation: ["Инкубационная программа — YASAWI STARTUP", "Путь от идеи до проверенного прототипа с менторами, практикой и сообществом."],
    acceleration: ["Акселерационная программа — YASAWI STARTUP", "Программа роста для стартапов с MVP и подтверждённым спросом."],
    education: ["Бесплатное IT-обучение — YASAWI STARTUP", "Практические курсы цифровых навыков и технологий от YASAWI STARTUP."],
    startups: ["Стартапы — YASAWI STARTUP", "Портфолио проектов и команд экосистемы YASAWI STARTUP."],
    gallery: ["Галерея — YASAWI STARTUP", "Фотографии, события и истории из жизни программ YASAWI STARTUP."],
    faq: ["Частые вопросы — YASAWI STARTUP", "Ответы на вопросы об участии, программах и подаче заявки."],
    apply: ["Подать заявку — YASAWI STARTUP", "Подайте заявку на инкубацию, акселерацию или бесплатное IT-обучение YASAWI STARTUP."],
    privacy: ["Политика конфиденциальности — YASAWI STARTUP", "Информация об обработке персональных данных участников и заявителей."],
    consent: ["Согласие на обработку данных — YASAWI STARTUP", "Условия согласия на сбор и обработку персональных данных заявителя."],
    terms: ["Условия использования — YASAWI STARTUP", "Правила использования сайта и подачи заявки в YASAWI STARTUP."],
  },
  kk: {
    home: ["YASAWI STARTUP — идеядан іске дейін", "Түркістандағы Ахмет Ясауи университетінің бизнес-инкубаторы: бағдарламалар, оқу және стартаптарды қолдау."],
    about: ["Біз туралы — YASAWI STARTUP", "YASAWI STARTUP бизнес-инкубаторының командасы, миссиясы және нәтижелері."],
    programs: ["Бағдарламалар — YASAWI STARTUP", "Түркістандағы инкубация, акселерация және тегін тәжірибелік IT-оқыту."],
    incubation: ["Инкубациялық бағдарлама — YASAWI STARTUP", "Менторлармен, тәжірибемен және қауымдастықпен идеядан тексерілген прототипке дейінгі жол."],
    acceleration: ["Акселерациялық бағдарлама — YASAWI STARTUP", "MVP-і және расталған сұранысы бар стартаптарға арналған өсу бағдарламасы."],
    education: ["Тегін IT-оқыту — YASAWI STARTUP", "YASAWI STARTUP ұсынатын цифрлық дағдылар мен технологиялар бойынша тәжірибелік курстар."],
    startups: ["Стартаптар — YASAWI STARTUP", "YASAWI STARTUP экожүйесіндегі жобалар мен командалар портфолиосы."],
    gallery: ["Галерея — YASAWI STARTUP", "YASAWI STARTUP бағдарламаларының фотосуреттері, оқиғалары мен тарихы."],
    faq: ["Жиі қойылатын сұрақтар — YASAWI STARTUP", "Қатысу, бағдарламалар және өтінім беру туралы жауаптар."],
    apply: ["Өтінім беру — YASAWI STARTUP", "Инкубация, акселерация немесе тегін IT-оқыту бағдарламасына өтінім беріңіз."],
    privacy: ["Құпиялық саясаты — YASAWI STARTUP", "Қатысушылар мен өтініш берушілердің дербес деректерін өңдеу туралы ақпарат."],
    consent: ["Деректерді өңдеуге келісім — YASAWI STARTUP", "Өтінім берушінің дербес деректерін жинауға және өңдеуге келісім талаптары."],
    terms: ["Пайдалану шарттары — YASAWI STARTUP", "YASAWI STARTUP сайтын пайдалану және өтінім беру қағидалары."],
  },
  en: {
    home: ["YASAWI STARTUP — from idea to launch", "The business incubator of Akhmet Yassawi University in Turkistan: programs, training and startup support."],
    about: ["About us — YASAWI STARTUP", "The team, mission and outcomes of the YASAWI STARTUP business incubator."],
    programs: ["Programs — YASAWI STARTUP", "Incubation, acceleration and free practical IT training in Turkistan."],
    incubation: ["Incubation program — YASAWI STARTUP", "A mentored journey from an idea to a validated prototype, supported by practice and community."],
    acceleration: ["Acceleration program — YASAWI STARTUP", "A growth program for startups with an MVP and validated demand."],
    education: ["Free IT training — YASAWI STARTUP", "Practical digital-skills and technology courses from YASAWI STARTUP."],
    startups: ["Startups — YASAWI STARTUP", "Explore projects and teams from the YASAWI STARTUP ecosystem."],
    gallery: ["Gallery — YASAWI STARTUP", "Photos, events and stories from YASAWI STARTUP programs."],
    faq: ["Frequently asked questions — YASAWI STARTUP", "Answers about participation, programs and the application process."],
    apply: ["Apply — YASAWI STARTUP", "Apply for incubation, acceleration or free IT training at YASAWI STARTUP."],
    privacy: ["Privacy policy — YASAWI STARTUP", "How participant and applicant personal data is processed."],
    consent: ["Data processing consent — YASAWI STARTUP", "Terms of consent to collect and process an applicant's personal data."],
    terms: ["Terms of use — YASAWI STARTUP", "Rules for using the YASAWI STARTUP website and submitting an application."],
  },
  tr: {
    home: ["YASAWI STARTUP — fikirden hayata", "Türkistan'daki Ahmet Yesevi Üniversitesinin iş kuluçka merkezi: programlar, eğitim ve girişim desteği."],
    about: ["Hakkımızda — YASAWI STARTUP", "YASAWI STARTUP iş kuluçka merkezinin ekibi, misyonu ve sonuçları."],
    programs: ["Programlar — YASAWI STARTUP", "Türkistan'da kuluçka, hızlandırma ve ücretsiz uygulamalı BT eğitimi."],
    incubation: ["Kuluçka programı — YASAWI STARTUP", "Mentorlar, uygulama ve topluluk desteğiyle fikirden doğrulanmış prototipe uzanan yol."],
    acceleration: ["Hızlandırma programı — YASAWI STARTUP", "MVP'si ve doğrulanmış talebi olan girişimler için büyüme programı."],
    education: ["Ücretsiz BT eğitimi — YASAWI STARTUP", "YASAWI STARTUP tarafından sunulan uygulamalı dijital beceri ve teknoloji kursları."],
    startups: ["Girişimler — YASAWI STARTUP", "YASAWI STARTUP ekosistemindeki proje ve ekipleri keşfedin."],
    gallery: ["Galeri — YASAWI STARTUP", "YASAWI STARTUP programlarından fotoğraflar, etkinlikler ve hikâyeler."],
    faq: ["Sık sorulan sorular — YASAWI STARTUP", "Katılım, programlar ve başvuru süreci hakkındaki yanıtlar."],
    apply: ["Başvur — YASAWI STARTUP", "YASAWI STARTUP kuluçka, hızlandırma veya ücretsiz BT eğitimine başvurun."],
    privacy: ["Gizlilik politikası — YASAWI STARTUP", "Katılımcı ve başvuru sahibi kişisel verilerinin nasıl işlendiğine ilişkin bilgiler."],
    consent: ["Veri işleme onayı — YASAWI STARTUP", "Başvuru sahibinin kişisel verilerinin toplanması ve işlenmesine ilişkin onay şartları."],
    terms: ["Kullanım şartları — YASAWI STARTUP", "YASAWI STARTUP sitesini kullanma ve başvuru gönderme kuralları."],
  },
} satisfies Record<Locale, Record<string, readonly [string, string]>>;

export type SeoPage = keyof typeof seo.ru;

const pagePaths: Record<SeoPage, string> = {
  home: "/", about: "/about", programs: "/program", incubation: "/program/incubation",
  acceleration: "/program/acceleration", education: "/program/it-education", startups: "/startups",
  gallery: "/gallery", faq: "/faq", apply: "/apply", privacy: "/privacy", consent: "/consent", terms: "/terms",
};

const openGraphLocales: Record<Locale, string> = { kk: "kk_KZ", ru: "ru_RU", en: "en_US", tr: "tr_TR" };

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function absoluteUrl(pathname: string) {
  return new URL(pathname, `${siteUrl()}/`).toString();
}

type MetadataOverrides = { title?: string | null; description?: string | null; path?: string; image?: string | null };

export function pageMetadata(locale: Locale, page: SeoPage, overrides: MetadataOverrides = {}): Metadata {
  const [fallbackTitle, fallbackDescription] = seo[locale][page];
  return localizedMetadata(locale, {
    title: overrides.title?.trim() || fallbackTitle,
    description: overrides.description?.trim() || fallbackDescription,
    path: overrides.path ?? pagePaths[page],
    image: overrides.image,
  });
}

export function localizedMetadata(locale: Locale, input: { title: string; description: string; path: string; image?: string | null }): Metadata {
  const canonicalPath = localizedPath(locale, input.path);
  const languages = Object.fromEntries(locales.map((item) => [item, localizedPath(item, input.path)]));
  const image = input.image || "/opengraph-image";
  return {
    metadataBase: new URL(siteUrl()),
    title: input.title,
    description: input.description,
    applicationName: "YASAWI STARTUP",
    authors: [{ name: "YASAWI STARTUP", url: siteUrl() }],
    creator: "YASAWI STARTUP",
    publisher: "YASAWI STARTUP",
    alternates: { canonical: canonicalPath, languages: { ...languages, "x-default": localizedPath("ru", input.path) } },
    openGraph: {
      type: "website", siteName: "YASAWI STARTUP", title: input.title, description: input.description,
      url: canonicalPath, locale: openGraphLocales[locale],
      alternateLocale: locales.filter((item) => item !== locale).map((item) => openGraphLocales[item]),
      images: [{ url: image, width: 1200, height: 630, alt: input.title }],
    },
    twitter: { card: "summary_large_image", title: input.title, description: input.description, images: [image] },
    robots: {
      index: true, follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
    },
  };
}
