import LegalDocument from '../../components/legal/LegalDocument'
import { RULES_UPDATED_AT } from '../../constants/legal'
import help from '../../i18n/legal/help'

export default function Help () {
  return <LegalDocument content={help} updatedAt={RULES_UPDATED_AT} />
}
