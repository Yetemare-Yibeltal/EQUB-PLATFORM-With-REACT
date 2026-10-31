import LegalDocument from '../../components/legal/LegalDocument'
import { LEGAL_UPDATED_AT } from '../../constants/legal'
import terms from '../../i18n/legal/terms'

export default function Terms () {
  return <LegalDocument content={terms} updatedAt={LEGAL_UPDATED_AT} />
}
