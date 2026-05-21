import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import Login from './pages/Login';
import LoginChoice from './pages/LoginChoice';
import Dashboard from './pages/Dashboard';

import Users from './pages/Users';
import THAccounts from './pages/THAccounts';
import SubAdmins from './pages/SubAdmins';
import THLogin from './pages/THLogin';
import THSignup from './pages/THSignup';
import Matches from './pages/Matches';
import Scorers from './pages/Scorers';
import Tournaments from './pages/Tournaments';
import Registrations from './pages/Registrations';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import ContentManager from './pages/ContentManager';
import Teams from './pages/Teams';
import AuctionManager from './pages/AuctionManager';
import GalleryManager from './pages/GalleryManager';
import Stores from './pages/Stores';
import Notifications from './pages/Notifications';
import PrivacyPolicy from './pages/PrivacyPolicy';
import './index.css';

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login-choice" element={<LoginChoice />} />
          <Route path="/login" element={<Login />} />
          <Route path="/th-login" element={<THLogin />} />

          <Route path="/th-signup" element={<THSignup />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/th-accounts"
            element={
              <ProtectedRoute>
                <Layout>
                  <THAccounts />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/sub-admins"
            element={
              <ProtectedRoute>
                <Layout>
                  <SubAdmins />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <Layout>
                  <Users />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/matches"
            element={
              <ProtectedRoute>
                <Layout>
                  <Matches />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/scorers"
            element={
              <ProtectedRoute>
                <Layout>
                  <Scorers />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/leagues"
            element={
              <ProtectedRoute>
                <Layout>
                  <Tournaments />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/registrations"
            element={
              <ProtectedRoute>
                <Layout>
                  <Registrations />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/teams"
            element={
              <ProtectedRoute>
                <Layout>
                  <Teams />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/auction"
            element={
              <ProtectedRoute>
                <Layout>
                  <AuctionManager />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/gallery"
            element={
              <ProtectedRoute>
                <Layout>
                  <GalleryManager />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/stores"
            element={
              <ProtectedRoute>
                <Layout>
                  <Stores />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Layout>
                  <Notifications />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/content"
            element={
              <ProtectedRoute>
                <Layout>
                  <ContentManager />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
