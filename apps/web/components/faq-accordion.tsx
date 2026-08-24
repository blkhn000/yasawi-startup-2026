"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { faqs as ruFaqs } from "./data";
import { useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";

const localizedFaqs: Record<Locale, readonly (readonly [string, string])[]> = {
  ru: ruFaqs as [string, string][],
  kk: [
    ["Бағдарламаға кім өтінім бере алады?", "Студенттер, магистранттар, докторанттар, зерттеушілер, оқытушылар және стартап-командалар. Нақты талаптар бағдарлама бетінде көрсетілген."],
    ["Қатысу ақылы ма?", "Негізгі YASAWI STARTUP бағдарламалары тегін. Егер жекелеген курсқа басқа шарт қолданылса, ол курс карточкасында көрсетіледі."],
    ["Дайын идеясыз қатысуға бола ма?", "Иә. Инкубация мен IT-оқытуға қызығушылық пен жұмыс істеуге дайындық жеткілікті; команда табуға көмектесеміз."],
    ["Өтінімнен кейін не болады?", "Команда өтінімді қарайды, қажет болса қысқа сұхбатқа шақырады және шешім мен келесі қадамды хабарлайды."],
    ["Бағдарлама қай форматта өтеді?", "Кездесулер офлайн және онлайн форматта өтуі мүмкін. Нақты кесте таңдалған лек басталар алдында беріледі."],
    ["Жоба үлесін беру керек пе?", "Егер бағдарлама бетінде өзгеше көрсетілмесе, қатысу үшін equity талап етілмейді."],
  ],
  en: [
    ["Who can apply?", "Students, graduate researchers, faculty members and external startup teams may apply. Program-specific requirements are listed on each program page."],
    ["Does participation cost anything?", "Core YASAWI STARTUP programs are free. Any different terms for a specific course will be shown on its course card."],
    ["Can I join without a ready idea?", "Yes. Curiosity and commitment are enough for incubation and IT training; the team can help you find collaborators."],
    ["What happens after I apply?", "The team reviews your application, may invite you to a short interview, and then sends a decision and the next steps."],
    ["What is the learning format?", "Sessions may combine in-person and online work. The detailed timetable is shared before your cohort begins."],
    ["Do I have to give up equity?", "No equity is required unless a program page explicitly states otherwise."],
  ],
  tr: [
    ["Kimler başvurabilir?", "Öğrenciler, lisansüstü araştırmacılar, öğretim üyeleri ve dış girişim ekipleri başvurabilir. Programa özel koşullar ilgili sayfada yer alır."],
    ["Katılım ücretli mi?", "YASAWI STARTUP'ın temel programları ücretsizdir. Belirli bir kursun farklı koşulları varsa kurs kartında belirtilir."],
    ["Hazır bir fikrim olmadan katılabilir miyim?", "Evet. Kuluçka ve BT eğitimi için merak ve çalışma isteği yeterlidir; ekip arkadaşları bulmanıza yardımcı olabiliriz."],
    ["Başvurudan sonra ne olur?", "Ekip başvurunuzu inceler, gerekirse kısa bir görüşmeye davet eder ve karar ile sonraki adımları paylaşır."],
    ["Eğitim hangi formatta?", "Oturumlar yüz yüze ve çevrim içi çalışmayı birleştirebilir. Ayrıntılı takvim dönem başlamadan paylaşılır."],
    ["Hisse vermem gerekir mi?", "Program sayfasında açıkça aksi belirtilmedikçe hisse talep edilmez."],
  ],
};

export function FaqAccordion() {
  const { locale } = useLocale();
  const faqs = localizedFaqs[locale];
  const [active, setActive] = useState<number | null>(0);

  return (
    <div className="faq-list">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) }).replace(/</g, "\\u003c") }} />
      {faqs.map(([question, answer], index) => {
        const expanded = active === index;
        const panelId = `faq-answer-${index}`;
        return (
          <div className="reveal" key={question}>
            <button className={`faq-item ${expanded ? "active" : ""}`} onClick={() => setActive(expanded ? null : index)} aria-expanded={expanded} aria-controls={panelId}>
              <span>0{index + 1}</span><strong>{question}</strong><ChevronDown />
            </button>
            <div className="faq-answer" id={panelId} hidden={!expanded}><p>{answer}</p></div>
          </div>
        );
      })}
    </div>
  );
}
