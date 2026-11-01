import LegalDocument from '../../components/legal/LegalDocument'
import { RULES_UPDATED_AT } from '../../constants/legal'
import rules from '../../i18n/legal/rules'

export default function Rules () {
  return <LegalDocument content={rules} updatedAt={RULES_UPDATED_AT} />
}
