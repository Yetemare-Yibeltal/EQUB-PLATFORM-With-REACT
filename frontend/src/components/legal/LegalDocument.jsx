import { useLanguage } from '../../hooks/useLanguage'
import { formatDate } from '../../utils/formatDate'
import '../../styles/legal.css'

export default function LegalDocument ({ content, updatedAt }) {
  const { language, t } = useLanguage()
  const doc = content[language] ?? content.en

  return (
    <article className='legal-doc'>
      <header>
        <h1>{doc.title}</h1>
        <p className='muted'>
          {t('Last updated: {date}', { date: formatDate(updatedAt) })}
        </p>
        <p>{doc.intro}</p>
      </header>

      {doc.sections.map((section, index) => (
        <section key={section.heading}>
          <h2>
            {index + 1}. {section.heading}
          </h2>
          {section.paragraphs?.map(paragraph => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {section.items && (
            <ul>
              {section.items.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </article>
  )
}
