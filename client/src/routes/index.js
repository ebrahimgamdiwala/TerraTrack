import { lazy } from 'react'

// Lazy load components for better performance
const HomePage = lazy(() => import('../pages/HomePage'))
const LoginPage = lazy(() => import('../pages/LoginPage'))
const SignupPage = lazy(() => import('../pages/SignupPage'))
const VerifyEmailPage = lazy(() => import('../pages/VerifyEmailPage'))
const ForgotPasswordPage = lazy(() => import('../pages/ForgotPasswordPage'))
const DashboardPage = lazy(() => import('../pages/DashboardPage'))
const ReportsPage = lazy(() => import('../pages/ReportsPage'))
const AlertsPage = lazy(() => import('../pages/AlertsPage'))
const TerraBotPage = lazy(() => import('../pages/TerraBotPage'))
const ARPlantsPage = lazy(() => import('../pages/ARPlantsPage'))
const CampaignsPage = lazy(() => import('../pages/CampaignsPage'))
const CampaignDetailsPage = lazy(() => import('../pages/CampaignDetailsPage'))
const CreateCampaignPage = lazy(() => import('../pages/CreateCampaignPage'))
const DonationHistoryPage = lazy(() => import('../pages/DonationHistoryPage'))
const PaymentSuccessPage = lazy(() => import('../pages/PaymentSuccessPage'))
const GlobeVisualizationPage = lazy(() => import('../pages/GlobeVisualizationPage'))

// Route configuration
export const routes = [
  {
    path: '/',
    element: HomePage,
    name: 'Home',
    isPublic: true,
    showInNav: false,
  },
  {
    path: '/login',
    element: LoginPage,
    name: 'Login',
    isPublic: true,
    showInNav: false,
  },
  {
    path: '/signup',
    element: SignupPage,
    name: 'Sign Up',
    isPublic: true,
    showInNav: false,
  },
  {
    path: '/verify-email',
    element: VerifyEmailPage,
    name: 'Verify Email',
    isPublic: true,
    showInNav: false,
  },
  {
    path: '/forgot-password',
    element: ForgotPasswordPage,
    name: 'Forgot Password',
    isPublic: true,
    showInNav: false,
  },
  {
    path: '/dashboard',
    element: DashboardPage,
    name: 'Dashboard',
    isPublic: false,
    showInNav: true,
  },
  {
    path: '/campaigns',
    element: CampaignsPage,
    name: 'Campaigns',
    isPublic: false,
    showInNav: true,
  },
  {
    path: '/campaigns/create',
    element: CreateCampaignPage,
    name: 'Create Campaign',
    isPublic: false,
    showInNav: false,
    adminOnly: true,
  },
  {
    path: '/campaigns/:id',
    element: CampaignDetailsPage,
    name: 'Campaign Details',
    isPublic: false,
    showInNav: false,
  },
  {
    path: '/payment-success',
    element: PaymentSuccessPage,
    name: 'Payment Success',
    isPublic: false,
    showInNav: false,
  },
  {
    path: '/my-donations',
    element: DonationHistoryPage,
    name: 'My Donations',
    isPublic: false,
    showInNav: true,
  },
  {
    path: '/alerts',
    element: AlertsPage,
    name: 'Alerts',
    isPublic: false,
    showInNav: true,
  },
  {
    path: '/terrabot',
    element: TerraBotPage,
    name: 'TerraBot',
    isPublic: false,
    showInNav: true,
  },
  {
    path: '/ar-plants',
    element: ARPlantsPage,
    name: 'AR Plants',
    isPublic: true,
    showInNav: true,
  },
  {
    path: '/visualiser',
    element: GlobeVisualizationPage,
    name: 'Visualiser',
    isPublic: true,
    showInNav: true,
  },
]

// Filter routes by type
export const publicRoutes = routes.filter(route => route.isPublic)
export const privateRoutes = routes.filter(route => !route.isPublic)
export const navRoutes = routes.filter(route => route.showInNav)

// Route paths as constants
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  VERIFY_EMAIL: '/verify-email',
  FORGOT_PASSWORD: '/forgot-password',
  DASHBOARD: '/dashboard',
  CAMPAIGNS: '/campaigns',
  CAMPAIGN_DETAILS: '/campaigns/:id',
  CREATE_CAMPAIGN: '/campaigns/create',
  MY_DONATIONS: '/my-donations',
  REPORTS: '/reports',
  ALERTS: '/alerts',
  TERRABOT: '/terrabot',
  AR_PLANTS: '/ar-plants',
  VISUALISER: '/visualiser',
}

export default routes