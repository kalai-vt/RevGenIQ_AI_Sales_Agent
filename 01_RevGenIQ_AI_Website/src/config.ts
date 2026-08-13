// Where the marketing site sends visitors to actually use the product.
// Both apps are separate deployments (02_RevGenIQ_AI_Dashboard and the
// external revgen_billiq repo), each on their own revgenai.in subdomain —
// not routes within this site.
export const DASHBOARD_URL = 'https://salesiq.revgenai.in'
export const DASHBOARD_LOGIN_URL = `${DASHBOARD_URL}/login`
export const DASHBOARD_SIGNUP_URL = `${DASHBOARD_URL}/signup`

// The real Bill IQ app is mounted under /billiq within its own deployment.
export const BILL_IQ_APP_URL = 'https://billiq.revgenai.in/billiq'
export const BILL_IQ_LOGIN_URL = `${BILL_IQ_APP_URL}/login`
export const BILL_IQ_SIGNUP_URL = `${BILL_IQ_APP_URL}/register`

export const COMPANY_NAME = 'RevGenAI'
export const SITE_URL = 'https://revgenai.in'
export const SALES_IQ_PATH = '/sales-iq'
export const BILL_IQ_PATH = '/bill-iq'

export const SUPPORT_EMAIL = 'support@revgenai.in'

// Indian mobile number, used for both the tel: link and WhatsApp.
export const PHONE_DISPLAY = '+91 86808 44026'
export const PHONE_HREF = 'tel:+918680844026'
export const WHATSAPP_NUMBER = '918680844026'
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`
