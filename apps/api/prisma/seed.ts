import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import { isStrongPassword } from "../src/config/runtime-environment";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { loadEnvFile } from "node:process";
import { PrismaClient, type Prisma } from "../src/generated/prisma/client";

for (const path of [join(process.cwd(), ".env"), join(process.cwd(), "..", "..", ".env")]) {
  try { loadEnvFile(path); } catch {}
}

type LegacyDatabase = {
  settings?: Record<string, unknown>;
  programs?: Array<Record<string, unknown>>;
  projects?: Array<Record<string, unknown>>;
  applications?: Array<Record<string, unknown>>;
};

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required for seeding");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

const defaultPrograms = [
  { slug: "incubation", title: "Инкубационная программа", shortDescription: "От идеи и исследования до проверенного прототипа.", duration: "12 недель", durationWeeks: 12, price: "0 ₸", runsPerYear: 2, equity: "0%" },
  { slug: "acceleration", title: "Акселерационная программа", shortDescription: "От MVP к первым продажам и масштабированию.", duration: "10 недель", durationWeeks: 10, price: "0 ₸", runsPerYear: 2, equity: "0%" },
  { slug: "it-education", title: "Бесплатное IT-обучение", shortDescription: "Практические цифровые навыки и первый собственный проект.", duration: "По расписанию", durationWeeks: null, price: "0 ₸", runsPerYear: 3, equity: "0%" },
];

const partners = [
  ["Университет Ахмеда Ясави", "/partners/ayu.png", "https://ayu.edu.kz/"],
  ["AUBIAK", "/partners/aubiak.webp", "https://aubiak.tilda.ws/"],
  ["НПП Атамекен", "/partners/atameken.png", "https://turkestan.atameken.kz/ru/"],
  ["Turkistan Jastary", "/partners/turkistan-jastary.jpg", "https://www.instagram.com/turkistan_jastary/"],
  ["Enactus Kazakhstan", "/partners/enactus.png", "https://enactus.kz/"],
  ["Enactus AYU", "/partners/partner-06.png", null],
  ["Nazarbayev University RIS", "/partners/nu-ris.png", "https://nu.edu.kz/ru"],
  ["КазНУ имени аль-Фараби", "/partners/kaznu.png", "https://www.kaznu.kz/ru"],
  ["Евразийский национальный университет", "/partners/enu.png", "https://enu.kz/ru/"],
  ["QazInnovations", "/partners/qazinnovations.png", "https://qazinn.kz/"],
] as const;

const team = [
  { externalId: "1241", name: "Азат Исаков", role: "Руководитель Офиса коммерциализации", email: "azat.issakov@ayu.edu.kz", imageUrl: "https://ayu.edu.kz/admin/resimler/personel_resimler/personel_1241_67c2cbdfee3a0.png", profileUrl: "https://ayu.edu.kz/en/personel_detay/1241" },
  { externalId: "1246", name: "Акерке Рысбай", role: "Координатор сектора поддержки проектов YASAWI STARTUP", email: "akerke.rysbay@ayu.edu.kz", imageUrl: "https://ayu.edu.kz/admin/resimler/personel_resimler/personel_1246_69524a5a1b569.jpeg", profileUrl: "https://ayu.edu.kz/en/personel_detay/1246" },
  { externalId: "1243", name: "Орынкуль Оразбаева", role: "Координатор по патентам и интеллектуальной собственности", email: "orynkul.orazbayeva@ayu.edu.kz", imageUrl: "https://ayu.edu.kz/admin/resimler/personel_resimler/personel_1243_69524a656e31c.jpeg", profileUrl: "https://ayu.edu.kz/en/personel_detay/1243" },
];

const courses = [
  { slug: "frontend", title: "Frontend-разработка", shortDescription: "Создание современных веб-интерфейсов с нуля.", description: "Практический курс для начинающих: от структуры страницы до интерактивного приложения и публикации проекта.", dateLabel: "Дата нового набора будет объявлена", format: "Офлайн + практика", duration: "8 недель", includes: ["HTML и CSS", "JavaScript", "React", "Командный итоговый проект"] },
  { slug: "ai-data", title: "AI & Data", shortDescription: "Основы искусственного интеллекта и работы с данными.", description: "Научитесь использовать AI-инструменты, анализировать данные и собирать первый прикладной AI-прототип.", dateLabel: "Дата нового набора будет объявлена", format: "Офлайн + практика", duration: "6 недель", includes: ["Основы Python", "Работа с данными", "AI-инструменты", "Итоговый прототип"] },
  { slug: "backend", title: "Backend-разработка", shortDescription: "API, базы данных и серверная логика приложений.", description: "Курс знакомит с серверной разработкой и помогает собрать API для собственного цифрового продукта.", dateLabel: "Дата нового набора будет объявлена", format: "Офлайн + практика", duration: "8 недель", includes: ["Node.js", "REST API", "PostgreSQL", "Развёртывание проекта"] },
  { slug: "digital-product", title: "Digital Product", shortDescription: "От проблемы пользователя до работающего цифрового продукта.", description: "Разберётесь в продуктовой логике, UX и командной работе, а затем проверите собственную гипотезу.", dateLabel: "Дата нового набора будет объявлена", format: "Воркшопы", duration: "4 недели", includes: ["Исследование пользователей", "Прототипирование", "UX-тестирование", "Питч проекта"] },
];

const settingsTranslations = {
  kk: { address: "Бекзат Саттарханов көшесі, 29, Түркістан, Қазақстан", heroEyebrow: "AYU ресми бағдарламасы · Түркістан", heroTitle: "Сенің идеяң", heroOutline: "үлкен іске айналады.", heroDescription: "Студенттер мен зерттеушілердің идеяларын университеттің Коммерцияландыру офисінің қолдауымен өнімге, пилотқа және компанияға айналдырамыз.", contextStats: [{ value: "7", label: "лек", note: "бағдарлама іске қосылғалы өткізілді" }, { value: "400+", label: "қатысушы", note: "бағдарламаларға өтінім берді" }, { value: "60", label: "сағат", note: "бір лектегі практика" }, { value: "15", label: "стартап", note: "витринада ұсынылған" }] },
  en: { address: "29 Bekzat Sattarkhanov Street, Turkistan, Kazakhstan", heroEyebrow: "Official AYU program · Turkistan", heroTitle: "Your idea can", heroOutline: "go further.", heroDescription: "We turn ideas from students and researchers into products, pilots and companies with support from the University Commercialization Office.", contextStats: [{ value: "7", label: "cohorts", note: "completed since launch" }, { value: "400+", label: "participants", note: "applied to the programs" }, { value: "60", label: "hours", note: "of practical work per cohort" }, { value: "15", label: "startups", note: "featured in the showcase" }] },
  tr: { address: "Bekzat Sattarkhanov Caddesi 29, Türkistan, Kazakistan", heroEyebrow: "Resmî AYU programı · Türkistan", heroTitle: "Fikrin daha", heroOutline: "ileriye gidebilir.", heroDescription: "Öğrenci ve araştırmacıların fikirlerini Üniversite Ticarileştirme Ofisinin desteğiyle ürüne, pilota ve şirkete dönüştürüyoruz.", contextStats: [{ value: "7", label: "dönem", note: "program başladığından beri tamamlandı" }, { value: "400+", label: "katılımcı", note: "programlara başvurdu" }, { value: "60", label: "saat", note: "her dönemde uygulamalı çalışma" }, { value: "15", label: "girişim", note: "vitrinde yer alıyor" }] },
};

const programTranslations: Record<string, Record<string, unknown>> = {
  incubation: {
    kk: { title: "Инкубациялық бағдарлама", shortDescription: "Идея мен зерттеуден тексерілген прототипке дейін.", description: "Ерте кезеңдегі идеяларды тексеруге және алғашқы өнімді жасауға арналған практикалық бағдарлама.", duration: "12 апта", format: "Офлайн және онлайн" },
    en: { title: "Incubation program", shortDescription: "From an idea or research insight to a validated prototype.", description: "A practical program for validating early ideas and building a first product.", duration: "12 weeks", format: "In person and online" },
    tr: { title: "Kuluçka programı", shortDescription: "Fikir ve araştırmadan doğrulanmış prototipe.", description: "Erken aşama fikirleri doğrulamak ve ilk ürünü geliştirmek için uygulamalı program.", duration: "12 hafta", format: "Yüz yüze ve çevrim içi" },
  },
  acceleration: {
    kk: { title: "Акселерациялық бағдарлама", shortDescription: "MVP-ден алғашқы сатылым мен масштабтауға дейін.", description: "Нарық растауы бар командалардың өсуін жеделдететін бағдарлама.", duration: "10 апта", format: "Офлайн және онлайн" },
    en: { title: "Acceleration program", shortDescription: "From MVP to first sales and scalable growth.", description: "A focused program to accelerate teams with early market validation.", duration: "10 weeks", format: "In person and online" },
    tr: { title: "Hızlandırma programı", shortDescription: "MVP'den ilk satışlara ve ölçeklenebilir büyümeye.", description: "İlk pazar doğrulaması olan ekiplerin büyümesini hızlandıran program.", duration: "10 hafta", format: "Yüz yüze ve çevrim içi" },
  },
  "it-education": {
    kk: { title: "Тегін IT-оқыту", shortDescription: "Практикалық цифрлық дағды және алғашқы жеке жоба.", description: "Жаңадан бастаушыларға арналған практикалық цифрлық курстар.", duration: "Кесте бойынша", format: "Офлайн және практика" },
    en: { title: "Free IT training", shortDescription: "Practical digital skills and your first project.", description: "Hands-on digital courses designed for beginners.", duration: "By schedule", format: "In person and practical" },
    tr: { title: "Ücretsiz BT eğitimi", shortDescription: "Uygulamalı dijital beceriler ve ilk projeniz.", description: "Yeni başlayanlar için uygulamalı dijital kurslar.", duration: "Takvime göre", format: "Yüz yüze ve uygulamalı" },
  },
};

const courseTranslations: Record<string, Record<string, unknown>> = {
  frontend: { kk: { title: "Frontend әзірлеу", shortDescription: "Заманауи веб-интерфейстерді нөлден жасау.", description: "Бірінші беттен интерактивті қосымша мен жариялауға дейінгі практикалық курс.", dateLabel: "Жаңа қабылдау күні кейін хабарланады", format: "Офлайн + практика", duration: "8 апта", includes: ["HTML және CSS", "JavaScript", "React", "Командалық қорытынды жоба"] }, en: { title: "Frontend development", shortDescription: "Build modern web interfaces from scratch.", description: "A practical path from your first page to an interactive published application.", dateLabel: "Next cohort date to be announced", format: "In person + practice", duration: "8 weeks", includes: ["HTML and CSS", "JavaScript", "React", "Final team project"] }, tr: { title: "Frontend geliştirme", shortDescription: "Modern web arayüzlerini sıfırdan geliştirin.", description: "İlk sayfadan etkileşimli ve yayımlanmış uygulamaya uzanan uygulamalı kurs.", dateLabel: "Yeni dönem tarihi açıklanacaktır", format: "Yüz yüze + uygulama", duration: "8 hafta", includes: ["HTML ve CSS", "JavaScript", "React", "Ekip bitirme projesi"] } },
  "ai-data": { kk: { title: "AI & Data", shortDescription: "Жасанды интеллект пен деректермен жұмыс негіздері.", description: "AI құралдарын қолданып, деректерді талдап, алғашқы прототип жасаңыз.", dateLabel: "Жаңа қабылдау күні кейін хабарланады", format: "Офлайн + практика", duration: "6 апта", includes: ["Python негіздері", "Деректермен жұмыс", "AI құралдары", "Қорытынды прототип"] }, en: { title: "AI & Data", shortDescription: "Foundations of artificial intelligence and data work.", description: "Use AI tools, analyze data and build a first applied prototype.", dateLabel: "Next cohort date to be announced", format: "In person + practice", duration: "6 weeks", includes: ["Python basics", "Working with data", "AI tools", "Final prototype"] }, tr: { title: "AI & Data", shortDescription: "Yapay zekâ ve veriyle çalışmanın temelleri.", description: "AI araçlarını kullanın, verileri analiz edin ve ilk uygulamalı prototipinizi oluşturun.", dateLabel: "Yeni dönem tarihi açıklanacaktır", format: "Yüz yüze + uygulama", duration: "6 hafta", includes: ["Python temelleri", "Veriyle çalışma", "AI araçları", "Bitirme prototipi"] } },
  backend: { kk: { title: "Backend әзірлеу", shortDescription: "API, деректер базасы және серверлік логика.", description: "Серверлік әзірлеуді үйреніп, өз өніміңізге API жасаңыз.", dateLabel: "Жаңа қабылдау күні кейін хабарланады", format: "Офлайн + практика", duration: "8 апта", includes: ["Node.js", "REST API", "PostgreSQL", "Жобаны жариялау"] }, en: { title: "Backend development", shortDescription: "APIs, databases and application server logic.", description: "Learn server development and build an API for your own digital product.", dateLabel: "Next cohort date to be announced", format: "In person + practice", duration: "8 weeks", includes: ["Node.js", "REST API", "PostgreSQL", "Deployment"] }, tr: { title: "Backend geliştirme", shortDescription: "API'ler, veritabanları ve sunucu mantığı.", description: "Sunucu geliştirmeyi öğrenin ve kendi dijital ürününüz için API oluşturun.", dateLabel: "Yeni dönem tarihi açıklanacaktır", format: "Yüz yüze + uygulama", duration: "8 hafta", includes: ["Node.js", "REST API", "PostgreSQL", "Yayımlama"] } },
  "digital-product": { kk: { title: "Digital Product", shortDescription: "Пайдаланушы мәселесінен жұмыс істейтін цифрлық өнімге дейін.", description: "Өнім логикасы, UX және командалық жұмысты меңгеріп, гипотезаны тексеріңіз.", dateLabel: "Жаңа қабылдау күні кейін хабарланады", format: "Воркшоптар", duration: "4 апта", includes: ["Пайдаланушы зерттеуі", "Прототиптеу", "UX тесті", "Жоба питчингі"] }, en: { title: "Digital Product", shortDescription: "From a user problem to a working digital product.", description: "Learn product thinking, UX and teamwork, then validate your own hypothesis.", dateLabel: "Next cohort date to be announced", format: "Workshops", duration: "4 weeks", includes: ["User research", "Prototyping", "UX testing", "Project pitch"] }, tr: { title: "Digital Product", shortDescription: "Kullanıcı sorunundan çalışan dijital ürüne.", description: "Ürün mantığı, UX ve ekip çalışmasını öğrenip kendi hipotezinizi doğrulayın.", dateLabel: "Yeni dönem tarihi açıklanacaktır", format: "Atölyeler", duration: "4 hafta", includes: ["Kullanıcı araştırması", "Prototipleme", "UX testi", "Proje sunumu"] } },
};

const teamTranslations: Record<string, Record<string, unknown>> = {
  "azat.issakov@ayu.edu.kz": { kk: { role: "Коммерцияландыру офисінің басшысы" }, en: { role: "Head of the Commercialization Office" }, tr: { role: "Ticarileştirme Ofisi Başkanı" } },
  "akerke.rysbay@ayu.edu.kz": { kk: { role: "YASAWI STARTUP жобаларды қолдау секторының үйлестірушісі" }, en: { role: "YASAWI STARTUP Project Support Coordinator" }, tr: { role: "YASAWI STARTUP Proje Destek Koordinatörü" } },
  "orynkul.orazbayeva@ayu.edu.kz": { kk: { role: "Патенттер және зияткерлік меншік бойынша үйлестіруші" }, en: { role: "Patent and Intellectual Property Coordinator" }, tr: { role: "Patent ve Fikrî Mülkiyet Koordinatörü" } },
};

const aboutTranslations = {
  kk: { content: { hero: { eyebrow: "Бизнес-инкубатор туралы", title: "Жасампаз адамдар", outline: "тоғысатын орта.", description: "Университет ғылымын, кәсіпкерлік тәжірибені және Түркістанның жас негізін қалаушыларының қуатын біріктіреміз." }, story: { eyebrow: "Біздің рөліміз", title: "Идеялар өмір сүретін", outline: "жағдай қалыптастыру.", paragraphs: ["YASAWI STARTUP 2022 жылдан бері студенттерге, зерттеушілерге және университет қызметкерлеріне байқау мен ғылыми әзірлемені сұранысқа ие шешімге айналдыруға көмектеседі.", "Біз құрылым, мықты орта және тез қателесіп, үйреніп, әрі қарай қозғалуға болатын кеңістік береміз."] }, values: [{ title: "Әрекет", text: "Іске қосылған тәжірибені мінсіз таныстырылымнан жоғары бағалаймыз." }, { title: "Ашықтық", text: "Әртүрлі мамандық иелерін ортақ мәселе төңірегінде біріктіреміз." }, { title: "Жылдамдық", text: "Маңыздысын тез тексеріп, болжамға айлап уақыт жұмсамаймыз." }, { title: "Ауқым", text: "Түркістаннан бастаймыз, бірақ үлкен әлемге арналған өнім жасаймыз." }], stats: [{ value: "2022", label: "іске қосылған жыл" }, { value: "400+", label: "тіркелу" }, { value: "7", label: "лек" }, { value: "60", label: "бағдарлама сағаты" }], contact: { eyebrow: "Біз Түркістандамыз", title: "Сұрағыңыз немесе идеяңыз бар ма?", buttonLabel: "Командаға жазу" } } },
  en: { content: { hero: { eyebrow: "About the business incubator", title: "A meeting point", outline: "for people who build.", description: "We connect university research, entrepreneurial practice and the energy of young founders in Turkistan." }, story: { eyebrow: "Our role", title: "Create the conditions", outline: "where ideas can survive.", paragraphs: ["Since 2022, YASAWI STARTUP has helped students, researchers and University staff turn observations and scientific work into solutions people need.", "We provide structure, a strong community and a space to experiment quickly, learn and move forward."] }, values: [{ title: "Action", text: "We value a running experiment more than a perfect presentation." }, { title: "Openness", text: "We bring people from different disciplines together around a shared problem." }, { title: "Speed", text: "We test what matters and avoid spending months on assumptions." }, { title: "Scale", text: "We begin in Turkistan and build products for a wider world." }], stats: [{ value: "2022", label: "year launched" }, { value: "400+", label: "registrations" }, { value: "7", label: "cohorts" }, { value: "60", label: "program hours" }], contact: { eyebrow: "Based in Turkistan", title: "Have a question or an idea?", buttonLabel: "Contact the team" } } },
  tr: { content: { hero: { eyebrow: "İş kuluçka merkezi hakkında", title: "Üreten insanların", outline: "buluşma noktası.", description: "Üniversite araştırmasını, girişimcilik pratiğini ve Türkistan'ın genç kurucularının enerjisini bir araya getiriyoruz." }, story: { eyebrow: "Rolümüz", title: "Fikirlerin yaşayabileceği", outline: "koşulları oluşturmak.", paragraphs: ["YASAWI STARTUP, 2022'den bu yana öğrenci, araştırmacı ve Üniversite çalışanlarının gözlem ve bilimsel çalışmalarını ihtiyaç duyulan çözümlere dönüştürmesine yardımcı oluyor.", "Hızlı deney yapmak, öğrenmek ve ilerlemek için yapı, güçlü bir çevre ve alan sunuyoruz."] }, values: [{ title: "Eylem", text: "Çalışan bir deneyi kusursuz bir sunumdan daha değerli buluruz." }, { title: "Açıklık", text: "Farklı disiplinlerden insanları ortak bir sorun çevresinde buluştururuz." }, { title: "Hız", text: "Önemli olanı hızla test eder, varsayımlara aylar harcamayız." }, { title: "Ölçek", text: "Türkistan'da başlar, daha geniş bir dünya için ürün geliştiririz." }], stats: [{ value: "2022", label: "başlangıç yılı" }, { value: "400+", label: "kayıt" }, { value: "7", label: "dönem" }, { value: "60", label: "program saati" }], contact: { eyebrow: "Türkistan'dayız", title: "Bir sorunuz veya fikriniz mi var?", buttonLabel: "Ekibe yaz" } } },
};

const defaultContextStats = [
  { value: "7", label: "потоков", note: "проведено с момента запуска" },
  { value: "400+", label: "участников", note: "подали заявки на программы" },
  { value: "60", label: "часов", note: "практики в одном потоке" },
  { value: "15", label: "стартапов", note: "представлено в витрине" },
];

const projectTranslations: Record<string, Record<string, unknown>> = {
  "ai-jan": { kk: { summary: "Оқушыларға қауіпсіз форматтағы цифрлық психологиялық қолдау.", stage: "Пилот", tags: ["Әлеуметтік", "AI"] }, en: { summary: "Safe digital psychological support for school students.", stage: "Pilot", tags: ["Social impact", "AI"] }, tr: { summary: "Öğrenciler için güvenli dijital psikolojik destek.", stage: "Pilot", tags: ["Sosyal etki", "AI"] } },
  "ai-keden": { kk: { summary: "Сыртқы экономикалық қызмет қатысушыларына арналған зияткерлік сервистер.", stage: "Серіктестік", tags: ["GovTech", "AI"] }, en: { summary: "Intelligent services for participants in cross-border trade.", stage: "Partnership", tags: ["GovTech", "AI"] }, tr: { summary: "Dış ticaret katılımcıları için akıllı hizmetler.", stage: "Ortaklık", tags: ["GovTech", "AI"] } },
  "tatti-matti": { kk: { summary: "Дәстүрлі қазақ тәттілерінің заманауи нұсқасы.", stage: "Сатылым", tags: ["FoodTech", "Мәдениет"] }, en: { summary: "A contemporary take on traditional Kazakh sweets.", stage: "Sales", tags: ["FoodTech", "Culture"] }, tr: { summary: "Geleneksel Kazak tatlılarının çağdaş yorumu.", stage: "Satış", tags: ["FoodTech", "Kültür"] } },
  "khoja-group": { kk: { summary: "Шағын және орта бизнеске арналған экологиялық брендтелген қаптама.", stage: "Нарық", tags: ["Экология", "Өндіріс"] }, en: { summary: "Eco-friendly branded packaging for small and medium businesses.", stage: "Market", tags: ["Sustainability", "Manufacturing"] }, tr: { summary: "Küçük ve orta işletmeler için çevreci markalı ambalaj.", stage: "Pazar", tags: ["Sürdürülebilirlik", "Üretim"] } },
  "bilim-space": { kk: { summary: "Студенттің үлгерімі мен мақсатына сай жеке оқу бағыты.", stage: "MVP", tags: ["EdTech", "AI"] }, en: { summary: "Personalized learning paths based on each student's progress and goals.", stage: "MVP", tags: ["EdTech", "AI"] }, tr: { summary: "Öğrencinin ilerleme ve hedeflerine göre kişisel öğrenme yolları.", stage: "MVP", tags: ["EdTech", "AI"] } },
  "aqua-grow": { kk: { summary: "Фермерлерге суару мен топырақ жағдайын бақылау жүйесі.", stage: "Пилот", tags: ["AgroTech", "Экология"] }, en: { summary: "Irrigation and soil monitoring for farms.", stage: "Pilot", tags: ["AgroTech", "Sustainability"] }, tr: { summary: "Çiftlikler için sulama ve toprak izleme sistemi.", stage: "Pilot", tags: ["AgroTech", "Sürdürülebilirlik"] } },
  "sana-health": { kk: { summary: "Денсаулық қатерін ерте анықтау және пациентті бағыттау сервисі.", stage: "Прототип", tags: ["MedTech", "Әлеуметтік"] }, en: { summary: "Early health-risk detection and patient navigation.", stage: "Prototype", tags: ["MedTech", "Social impact"] }, tr: { summary: "Erken sağlık riski tespiti ve hasta yönlendirme hizmeti.", stage: "Prototip", tags: ["MedTech", "Sosyal etki"] } },
  qadam: { kk: { summary: "Жергілікті тарих пен аудиогиді бар Түркістан цифрлық маршруттары.", stage: "MVP", tags: ["TravelTech", "Мәдениет"] }, en: { summary: "Digital routes through Turkistan with local stories and an audio guide.", stage: "MVP", tags: ["TravelTech", "Culture"] }, tr: { summary: "Yerel hikâyeler ve sesli rehberle Türkistan dijital rotaları.", stage: "MVP", tags: ["TravelTech", "Kültür"] } },
  qamqor: { kk: { summary: "Студенттер мен жас отбасыларға түсінікті қаржылық көмекші.", stage: "Тексеру", tags: ["FinTech", "Әлеуметтік"] }, en: { summary: "A clear financial assistant for students and young families.", stage: "Validation", tags: ["FinTech", "Social impact"] }, tr: { summary: "Öğrenciler ve genç aileler için anlaşılır finans asistanı.", stage: "Doğrulama", tags: ["FinTech", "Sosyal etki"] } },
  "qazaq-materials": { kk: { summary: "Өнеркәсіпке арналған функционалдық композит материалдар.", stage: "TRL 4", tags: ["DeepTech", "Ғылым"] }, en: { summary: "Functional composite materials for industrial applications.", stage: "TRL 4", tags: ["DeepTech", "Science"] }, tr: { summary: "Endüstriyel uygulamalar için işlevsel kompozit malzemeler.", stage: "TRL 4", tags: ["DeepTech", "Bilim"] } },
  "dombra-lab": { kk: { summary: "Домбыра үйренуге арналған интерактивті платформа және цифрлық мұрағат.", stage: "Пайдаланушылар", tags: ["CreativeTech", "Мәдениет"] }, en: { summary: "An interactive dombra learning platform and digital music archive.", stage: "Users", tags: ["CreativeTech", "Culture"] }, tr: { summary: "Etkileşimli dombra öğrenme platformu ve dijital eser arşivi.", stage: "Kullanıcılar", tags: ["CreativeTech", "Kültür"] } },
  "taza-qala": { kk: { summary: "Қаланың экологиялық мәселелер картасы және бірлескен шешімдер платформасы.", stage: "Пилот", tags: ["Smart City", "Экология"] }, en: { summary: "A map of urban environmental issues and a platform for collective action.", stage: "Pilot", tags: ["Smart City", "Sustainability"] }, tr: { summary: "Kentsel çevre sorunları haritası ve ortak çözüm platformu.", stage: "Pilot", tags: ["Smart City", "Sürdürülebilirlik"] } },
  "campus-flow": { kk: { summary: "Студенттік клубтар, іс-шаралар және командалық жобаларға ортақ кеңістік.", stage: "Іске қосу", tags: ["SaaS", "EdTech"] }, en: { summary: "One space for student clubs, events and team projects.", stage: "Launch", tags: ["SaaS", "EdTech"] }, tr: { summary: "Öğrenci kulüpleri, etkinlikler ve ekip projeleri için tek alan.", stage: "Lansman", tags: ["SaaS", "EdTech"] } },
  "bio-step": { kk: { summary: "Ауыл шаруашылығы өнімінің сапасын бақылауға арналған биотехнологиялық шешім.", stage: "TRL 3", tags: ["BioTech", "Ғылым"] }, en: { summary: "A biotechnology solution for monitoring agricultural product quality.", stage: "TRL 3", tags: ["BioTech", "Science"] }, tr: { summary: "Tarım ürünü kalitesini izlemek için biyoteknoloji çözümü.", stage: "TRL 3", tags: ["BioTech", "Bilim"] } },
  jetkiz: { kk: { summary: "Шағын дүкендер мен өндірушілердің жергілікті жеткізуін оңтайландыру.", stage: "Алғашқы сатылым", tags: ["Logistics", "SaaS"] }, en: { summary: "Local delivery optimization for small shops and producers.", stage: "First sales", tags: ["Logistics", "SaaS"] }, tr: { summary: "Küçük mağaza ve üreticiler için yerel teslimat optimizasyonu.", stage: "İlk satışlar", tags: ["Logistics", "SaaS"] } },
};

async function readLegacy(): Promise<LegacyDatabase> {
  try {
    return JSON.parse(await readFile(join(process.cwd(), "data", "db.json"), "utf8")) as LegacyDatabase;
  } catch {
    return {};
  }
}

async function main() {
  const legacy = await readLegacy();
  const settings = legacy.settings ?? {};

  await prisma.siteSettings.upsert({
    where: { id: "main" },
    create: {
      id: "main",
      currentCohort: numberValue(settings.currentCohort, 7),
      totalParticipants: numberValue(settings.totalParticipants, 400),
      incubationWeeks: numberValue(settings.incubationWeeks, 12),
      nextCohortStatus: enrollmentStatus(settings.nextCohortStatus),
      nextCohortDate: stringValue(settings.nextCohortDate, ""),
      responseDays: numberValue(settings.responseDays, 5),
      contactEmail: stringValue(settings.contactEmail, "yassawi_commerc@ayu.edu.kz"),
      contactPhone: stringValue(settings.contactPhone, "8 (72533) 6-36-36"),
      defaultLocale: "ru",
      contextStats: defaultContextStats,
      translations: settingsTranslations,
    },
    update: { defaultLocale: "ru", contextStats: defaultContextStats, translations: settingsTranslations },
  });

  for (const [index, fallback] of defaultPrograms.entries()) {
    const legacyProgram = legacy.programs?.find((item) => item.slug === fallback.slug);
    await prisma.program.upsert({
      where: { slug: fallback.slug },
      create: {
        ...fallback,
        title: stringValue(legacyProgram?.title, fallback.title),
        duration: stringValue(legacyProgram?.duration, fallback.duration),
        isFree: booleanValue(legacyProgram?.isFree, true),
        status: enrollmentStatus(legacyProgram?.status),
        sortOrder: index,
        translations: (programTranslations[fallback.slug] ?? {}) as Prisma.InputJsonValue,
      },
      update: { translations: (programTranslations[fallback.slug] ?? {}) as Prisma.InputJsonValue },
    });
  }

  for (const [index, legacyProject] of (legacy.projects ?? []).entries()) {
    const slug = stringValue(legacyProject.id, `project-${index + 1}`);
    await prisma.project.upsert({
      where: { slug },
      create: {
        slug,
        name: stringValue(legacyProject.name, slug),
        summary: stringValue(legacyProject.text, "Описание проекта будет добавлено"),
        tags: stringArray(legacyProject.tags),
        accent: stringValue(legacyProject.accent, "#a8efd8"),
        secondary: stringValue(legacyProject.secondary, "#d9ff62"),
        glyph: stringValue(legacyProject.glyph, slug.slice(0, 2).toUpperCase()),
        stage: stringValue(legacyProject.stage, "Идея"),
        cohortLabel: stringValue(legacyProject.cohort, ""),
        visual: stringValue(legacyProject.visual, "nodes"),
        status: booleanValue(legacyProject.published, true) ? "published" : "draft",
        sortOrder: index,
        translations: (projectTranslations[slug] ?? {}) as Prisma.InputJsonValue,
      },
      update: { translations: (projectTranslations[slug] ?? {}) as Prisma.InputJsonValue },
    });
  }

  for (const [index, partner] of partners.entries()) {
    const existing = await prisma.partner.findFirst({ where: { name: partner[0] } });
    if (!existing) await prisma.partner.create({ data: { name: partner[0], logoUrl: partner[1], websiteUrl: partner[2], alt: `${partner[0]} — логотип`, sortOrder: index } });
  }

  for (const [index, member] of team.entries()) {
    await prisma.teamMember.upsert({
      where: { email: member.email },
      create: { ...member, translations: (teamTranslations[member.email] ?? {}) as Prisma.InputJsonValue, source: "manual", manualOverride: true, published: true, sortOrder: index },
      update: { translations: (teamTranslations[member.email] ?? {}) as Prisma.InputJsonValue, source: "manual", manualOverride: true },
    });
  }

  for (const [index, course] of courses.entries()) {
    await prisma.itCourse.upsert({
      where: { slug: course.slug },
      create: { ...course, translations: (courseTranslations[course.slug] ?? {}) as Prisma.InputJsonValue, sortOrder: index, published: true },
      update: { translations: (courseTranslations[course.slug] ?? {}) as Prisma.InputJsonValue },
    });
  }

  await prisma.pageContent.upsert({
    where: { key: "about" },
    create: {
      key: "about",
      page: "О нас",
      status: "published",
      seoTitle: "О нас — YASAWI STARTUP",
      seoDescription: "Бизнес-инкубатор университета Ахмета Ясави в Туркестане.",
      content: {
        hero: { eyebrow: "О бизнес-инкубаторе", title: "Точка притяжения", outline: "для тех, кто создаёт.", description: "Мы соединяем университетскую науку, предпринимательскую практику и энергию молодых основателей Туркестана." },
        story: { eyebrow: "Наша роль", title: "Создавать условия,", outline: "в которых идеи выживают.", paragraphs: ["YASAWI STARTUP работает с 2022 года и помогает студентам, исследователям и сотрудникам университета превращать наблюдения и научные разработки в востребованные решения.", "Мы даём структуру, сильное окружение и пространство, где можно быстро ошибаться, учиться и двигаться дальше."] },
        values: [{ title: "Действие", text: "Ценим запущенный эксперимент выше идеальной презентации." }, { title: "Открытость", text: "Объединяем людей разных специальностей вокруг общей проблемы." }, { title: "Скорость", text: "Быстро проверяем главное и не тратим месяцы на предположения." }, { title: "Масштаб", text: "Начинаем в Туркестане, но создаём продукты для большого мира." }],
        stats: [{ value: "2022", label: "год запуска" }, { value: "400+", label: "регистраций" }, { value: "7", label: "потоков" }, { value: "60", label: "часов в программе" }],
        contact: { eyebrow: "Мы в Туркестане", title: "Есть вопрос или идея?", buttonLabel: "Написать команде" },
      },
      translations: aboutTranslations,
    },
    update: { translations: aboutTranslations },
  });

  const adminEmail = (process.env.ADMIN_SEED_EMAIL ?? "admin@yasawi.local").trim().toLowerCase();
  if (process.env.NODE_ENV === "production" && !isStrongPassword(process.env.ADMIN_SEED_PASSWORD)) throw new Error("ADMIN_SEED_PASSWORD must be a strong non-default password in production");
  const adminPassword = process.env.ADMIN_SEED_PASSWORD ?? "ChangeMe-2026!";
  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    create: { email: adminEmail, name: "Yasawi Administrator", role: "admin", passwordHash: await hash(adminPassword, 12) },
    update: {},
  });

  for (const legacyApplication of legacy.applications ?? []) {
    const program = await prisma.program.findUnique({ where: { slug: stringValue(legacyApplication.program, "incubation") } });
    if (!program) continue;
    const id = stringValue(legacyApplication.id, "");
    if (!id || await prisma.application.findUnique({ where: { id } })) continue;
    await prisma.application.create({
      data: {
        id,
        programId: program.id,
        name: stringValue(legacyApplication.name, "Без имени"),
        email: stringValue(legacyApplication.email, "unknown@example.com"),
        phone: stringValue(legacyApplication.phone, "не указан"),
        idea: stringValue(legacyApplication.idea, "Описание не указано"),
        consent: booleanValue(legacyApplication.consent, true),
        consentAt: dateValue(legacyApplication.createdAt),
        status: applicationStatus(legacyApplication.status),
        notes: stringValue(legacyApplication.notes, ""),
        createdAt: dateValue(legacyApplication.createdAt),
        updatedAt: dateValue(legacyApplication.updatedAt),
      },
    });
  }

  console.log(`Seed complete. Admin: ${adminEmail}`);
}

function stringValue(value: unknown, fallback: string) { return typeof value === "string" ? value : fallback; }
function numberValue(value: unknown, fallback: number) { return typeof value === "number" && Number.isFinite(value) ? value : fallback; }
function booleanValue(value: unknown, fallback: boolean) { return typeof value === "boolean" ? value : fallback; }
function stringArray(value: unknown) { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []; }
function dateValue(value: unknown) { const date = typeof value === "string" ? new Date(value) : new Date(); return Number.isNaN(date.valueOf()) ? new Date() : date; }
function enrollmentStatus(value: unknown): "open" | "soon" | "closed" | "completed" { return ["open", "soon", "closed", "completed"].includes(String(value)) ? value as "open" | "soon" | "closed" | "completed" : "open"; }
function applicationStatus(value: unknown): "new" | "reviewing" | "interview" | "accepted" | "rejected" { return ["new", "reviewing", "interview", "accepted", "rejected"].includes(String(value)) ? value as "new" | "reviewing" | "interview" | "accepted" | "rejected" : "new"; }

main().finally(() => prisma.$disconnect());
