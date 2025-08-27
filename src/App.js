// import logo from './logo.svg';
import './styles/Home.module.css';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ToastContainer } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";

import LandingPage from './components/LandingPage.js';
import LinkedinSignIn from './components/Employee/LinkedInSignIn.js';
import UserSideNavBar from './components/Employee/UserSideNavBar.js';
import Support from './components/Employee/Support.js';
import Profile from './components/Employee/Profile.js';
import ForgotPassword from './components/Employee/ForgotPassword.js';
import PricingPage from './components/PricingPage.js';
import Terms from './components/Terms.js';
import PrivacyPolicy from './components/PrivacyPolicy.js';
import CancellationRefund from './components/CancellationRefund.js';
import ShippingPolicy from './components/ShippingPolicy.js';
import ContactUs from './components/ContactUs.js';
import ProfileSettings from './components/Employee/Profile.js';
import AccountDetails from './components/Employee/AccountDetails.js';
import GoogleApiDisclosure from './components/GoogleApiDisclosure.js';
import DisclosurePolicy from './components/DisclosurePolicy.js';
import TrustCenter from './components/TrustCenter.js';
import AboutUs from './components/AboutUs.js';
import YouTubeDisclosure from './components/YoutubeApiDisclosure.js';
import Security from './components/Security.js';
import LinkedInUserLogin from './components/Employee/LinkedInUserLogin.js';
import ProfileBasedDiscovery from './components/ProfileDiscovery.js';
import EndToEndScheduling from './components/EndToEndScheduling.js';
import SaveTimePage from './components/SaveTimePage.js';
import DashboardOverview from './components/Employee/Dashboard.js';
import GoogleAnalytics from './components/GoogleAnalytics.js';
import LinkedInCode from './components/Employee/LinkedInCode.js';
import PostComposer from './components/Employee/PostComposer.js';
import CategorySelector from './components/Employee/CategorySelector.js';
import MyPosts from './components/Employee/MyPosts.js';
import LinkedInStyleAnalyzer from './components/Employee/LinkedInStyleAnalyzer.js';
import FreePostComposer from './components/FreePostComposer.js';




function App() {

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className="App">
        <Router>
           <GoogleAnalytics />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/linkedin-post-composer" element={<FreePostComposer />} />
              <Route path="/post-composer" element={<PostComposer />} />
              <Route path="/signin/linkedin" element={<LinkedinSignIn />} />
              <Route path="/auth/linkedin/callback" element={<LinkedInCode/>}/>
              <Route path="/professional/login" element={<LinkedInUserLogin />} />
              <Route path="/select/category" element={<CategorySelector />} />
              <Route path="/analyze/my_style" element={<LinkedInStyleAnalyzer />} />
              <Route path="/forgotPassword" element={<ForgotPassword />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/cancellation-refund-policy" element={<CancellationRefund />} />
              <Route path="/shipping_policy" element={<ShippingPolicy />} />
              <Route path="/contact" element={<ContactUs />} />
              <Route path="/profile" element={<ProfileSettings />} />
              <Route path="/google-api-disclosure" element={<GoogleApiDisclosure />} />
              <Route path="/disclosure-policy" element={<DisclosurePolicy />} />
              <Route path="/trust-center" element={<TrustCenter />} />
              <Route path="/about-us" element={<AboutUs />} />
              <Route path="/youtube_api_disclosure" element={<YouTubeDisclosure />} />
              <Route path="/security" element={<Security />} />
              <Route path="/personalised-user-tone" element={<ProfileBasedDiscovery />} />
              <Route path="/schedule-publish" element={<EndToEndScheduling />} />
              <Route path="/save-time" element={<SaveTimePage />} />

              <Route path="/professional/*" element={<UserSideNavBar />}>
                <Route path="support" element={<Support />} />
                <Route path="profile" element={<Profile />} />
                <Route path="account/details" element={<AccountDetails />} />
                <Route path="dashboard" element={<DashboardOverview />} />
                <Route path="myposts" element={<MyPosts />} />
              </Route>


              <Route path="/" element={<Outlet />}>
                {/* Other global routes */}
              </Route>
            </Routes>
        </Router>

        <ToastContainer
          position="top-left"
          autoClose={2000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
          style={{ zIndex: 15000 }}
        />
      </div>
    </LocalizationProvider>
  );
}

export default App;
