import { Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/ToastContext';
import Home from './pages/Home';
import Services from './pages/Services';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import './App.css'; // For global styles
import About from './pages/About';
import ServiceDetail from './pages/ServiceDetail';
import ProfilePage from './pages/ProfilePage';
import ProviderDashboard from './pages/ProviderDashboard';
import { AuthProvider } from './context/AuthContext';
import CategorySeparatePage from './pages/CategorySeparatePage';
import ProviderDetails from './pages/ProviderDetails';
import MyBookings from './pages/MyBookings';
import NewServiceForm from './pages/NewServiceForm';

function App() {
  return (
    <ToastProvider>
    <AuthProvider>
      <div className="app">
      <Navbar />
      
      <main className="main-content">
        <Routes>
          <Route index element={<Home />} />
          <Route path="services" element={<Services />} />
          <Route path="about" element={<About />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="/services/:id" element={<ServiceDetail />}/>
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="/provider/dashboard" element={<ProviderDashboard/>} />
          <Route path="/providers/:id" element={<ProviderDetails />} />
          <Route path="/admin/dashboard" element={<AdminDashboard/>} />
          <Route path="/categories/:categoryName" element={<CategorySeparatePage />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/provider/services/new" element={<NewServiceForm />} />
          
          {/* Optional 404 route */}
          <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
      </main>

      <Footer />
    </div>
    </AuthProvider>
    </ToastProvider>
  );
}

export default App;