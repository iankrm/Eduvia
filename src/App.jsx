import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext.jsx';
import { RequireAuth, RequireRole, RequireAdmin } from './components/Guards.jsx';

import Landing from './pages/Landing.jsx';
import Signup from './pages/Signup.jsx';
import Login from './pages/Login.jsx';
import Browse from './pages/Browse.jsx';
import ClassDetail from './pages/ClassDetail.jsx';
import Learn from './pages/Learn.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import TutorDashboard from './pages/TutorDashboard.jsx';
import TutorClassEditor, { NewClass } from './pages/TutorClassEditor.jsx';
import Settings from './pages/Settings.jsx';
import Checkout from './pages/Checkout.jsx';
import Billing from './pages/Billing.jsx';
import SupportCenter from './pages/SupportCenter.jsx';
import PaymentStatus from './pages/PaymentStatus.jsx';
import NotFound from './pages/NotFound.jsx';
import Search from './pages/Search.jsx';
import Wishlist from './pages/Wishlist.jsx';
import Notifications from './pages/Notifications.jsx';
import Certificates, { VerifyCertificate } from './pages/Certificates.jsx';
import { ForgotPassword, ResetPassword, VerifyEmail } from './pages/Account.jsx';
import { Terms, Privacy, Cookies } from './pages/Legal.jsx';
import Admin, { Earnings } from './pages/Admin.jsx';

import './styles/app.css';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Marketing */}
          <Route path="/" element={<Landing />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />

          {/* Password reset / email verification are deliberately open —
              the person holding the link may not be signed in. */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Public: anyone holding a certificate code can check it. */}
          <Route path="/verify/:code" element={<VerifyCertificate />} />

          {/* Legal, open so the footer works while signed out. */}
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/cookies" element={<Cookies />} />

          {/* Shared, any signed-in role */}
          <Route path="/browse" element={<RequireAuth><Browse /></RequireAuth>} />
          <Route path="/search" element={<RequireAuth><Search /></RequireAuth>} />
          <Route path="/notifications" element={<RequireAuth><Notifications /></RequireAuth>} />
          <Route path="/class/:slug" element={<RequireAuth><ClassDetail /></RequireAuth>} />
          <Route path="/learn/:slug" element={<RequireAuth><Learn /></RequireAuth>} />
          <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
          <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
          <Route path="/billing" element={<RequireAuth><Billing /></RequireAuth>} />
          <Route path="/support" element={<RequireAuth><SupportCenter /></RequireAuth>} />
          <Route path="/help" element={<RequireAuth><SupportCenter /></RequireAuth>} />
          <Route path="/payment/:status" element={<PaymentStatus />} />

          {/* Students */}
          <Route path="/dashboard" element={<RequireRole role="student"><StudentDashboard /></RequireRole>} />
          <Route path="/wishlist" element={<RequireRole role="student"><Wishlist /></RequireRole>} />
          <Route path="/certificates" element={<RequireRole role="student"><Certificates /></RequireRole>} />

          {/* Tutors */}
          <Route path="/teach" element={<RequireRole role="tutor"><TutorDashboard /></RequireRole>} />
          <Route path="/teach/new" element={<RequireRole role="tutor"><NewClass /></RequireRole>} />
          <Route path="/teach/:slug" element={<RequireRole role="tutor"><TutorClassEditor /></RequireRole>} />
          <Route path="/earnings" element={<RequireRole role="tutor"><Earnings /></RequireRole>} />

          {/* Staff */}
          <Route path="/admin" element={<RequireAdmin><Admin /></RequireAdmin>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
