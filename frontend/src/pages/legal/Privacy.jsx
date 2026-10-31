import LegalDocument from '../../components/legal/LegalDocument'
import { LEGAL_UPDATED_AT } from '../../constants/legal'
import privacy from '../../i18n/legal/privacy'

export default function Privacy () {
  return <LegalDocument content={privacy} updatedAt={LEGAL_UPDATED_AT} />
}
