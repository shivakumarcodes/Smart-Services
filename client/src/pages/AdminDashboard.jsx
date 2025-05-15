
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/AdminDashboard.css';
import { useToast } from '../components/ToastContext';

// Icons
import { 
  FiUsers, 
  FiSettings, 
  FiLogOut, 
  FiMenu, 
  FiX, 
  FiPieChart, 
  FiShoppingBag, 
  FiMessageSquare,
  FiCheck,
  FiXCircle,
  FiEdit2,
  FiTrash2,
  FiUserCheck,
  FiDollarSign
} from 'react-icons/fi';

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [pendingProviders, setPendingProviders] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProviders: 0,
    pendingApprovals: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState({
    dashboard: true,
    users: true,
    providers: true
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      // Fetch users
      if (activeTab === 'users' || activeTab === 'dashboard') {
        const usersRes = await axios.get('http://localhost:5000/api/admin/users', config);
        setUsers(usersRes.data);
        setLoading(prev => ({ ...prev, users: false }));
      }

      // Fetch pending providers
      if (activeTab === 'providers' || activeTab === 'dashboard') {
        const providersRes = await axios.get('http://localhost:5000/api/admin/providers/pending', config);
        setPendingProviders(providersRes.data);
        setLoading(prev => ({ ...prev, providers: false }));
      }

      // Calculate stats (client-side for now - you might want to create a stats endpoint)
      if (activeTab === 'dashboard') {
        const [usersRes, providersRes] = await Promise.all([
          axios.get('http://localhost:5000/api/admin/users', config),
          axios.get('http://localhost:5000/api/admin/providers/pending', config)
        ]);

        const totalUsers = usersRes.data.length;
        const totalProviders = usersRes.data.filter(u => u.role === 'provider').length;
        const pendingApprovals = providersRes.data.length;

        setStats({
          totalUsers,
          totalProviders,
          pendingApprovals,
          totalRevenue: 0 // You'll need to implement revenue calculation
        });
        setLoading(prev => ({ ...prev, dashboard: false }));
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setError(error.response?.data?.message || 'Failed to load data. Please try again.');
      showToast('Failed to load data. Please try again.', 'error');
      
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  const approveProvider = async (providerId) => {
    try {
      const token = localStorage.getItem('token');
      
      // Find provider to reference in toast message
      const provider = pendingProviders.find(p => p.provider_id === providerId);
      const providerName = provider ? provider.name : 'Provider';
      
      await axios.put(
        `http://localhost:5000/api/admin/providers/${providerId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Show success toast
      showToast(`${providerName} has been approved successfully!`, 'success');
      
      // Refresh the pending providers list
      const providersRes = await axios.get(
        'http://localhost:5000/api/admin/providers/pending',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPendingProviders(providersRes.data);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        pendingApprovals: prev.pendingApprovals - 1,
        totalProviders: prev.totalProviders + 1
      }));
    } catch (error) {
      console.error('Error approving provider:', error);
      setError(error.response?.data?.message || 'Failed to approve provider.');
      showToast('Failed to approve provider. Please try again.', 'error');
    }
  };

    const rejectProvider = async (providerId) => {
    try {
      const token = localStorage.getItem('token');
      
      // Find provider to reference in toast message
      const provider = pendingProviders.find(p => p.provider_id === providerId);
      const providerName = provider ? provider.name : 'Provider';
      
      await axios.delete(
        `http://localhost:5000/api/admin/providers/${providerId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Show warning toast
      showToast(`${providerName} has been rejected.`, 'warning');
      
      // Refresh the pending providers list
      const providersRes = await axios.get(
        'http://localhost:5000/api/admin/providers/pending',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPendingProviders(providersRes.data);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        pendingApprovals: prev.pendingApprovals - 1
      }));
    } catch (error) {
      console.error('Error rejecting provider:', error);
      setError(error.response?.data?.message || 'Failed to reject provider.');
      showToast('Failed to reject provider. Please try again.', 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    showToast('Logged out successfully', 'info');
    navigate('/login');
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const isLoading = () => {
    if (activeTab === 'dashboard') return loading.dashboard;
    if (activeTab === 'users') return loading.users;
    if (activeTab === 'providers') return loading.providers;
    return false;
  };

  if (isLoading()) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading {activeTab} data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => {
          setError(null);
          fetchData();
        }}>Try Again</button>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return (
          <div className="content-section">
            <h2>User Management</h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.user_id}>
                      <td>{user.user_id.substring(0, 8)}...</td>
                      <td>
                        <div className="user-cell">
                          {user.profile_picture_url && (
                            <img 
                              src={user.profile_picture_url} 
                              alt={user.name}
                              onError={(e) => {
                                e.target.src = 'https://isobarscience.com/wp-content/uploads/2020/09/default-profile-picture1.jpg';
                              }}
                            />
                          )}
                          {user.name}
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>{user.phone || 'N/A'}</td>
                      <td><span className={`role-badge ${user.role}`}>{user.role}</span></td>
                      <td>
                        <span className={`status-badge ${user.is_verified ? 'active' : 'inactive'}`}>
                          {user.is_verified ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      
      case 'providers':
        return (
          <div className="content-section">
            <h2>Pending Provider Approvals ({pendingProviders.length})</h2>
            {pendingProviders.length > 0 ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Provider ID</th>
                      <th>User</th>
                      <th>Service Type</th>
                      <th>Experience</th>
                      <th>Registered</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingProviders.map(provider => (
                      <tr key={provider.provider_id}>
                        <td>{provider.provider_id.substring(0, 8)}...</td>
                        <td>
                          <div className="user-cell">
                            {provider.profile_picture_url && (
                              <img 
                                src={provider.profile_picture_url} 
                                alt={provider.name}
                                onError={(e) => {
                                  e.target.src = 'https://isobarscience.com/wp-content/uploads/2020/09/default-profile-picture1.jpg';
                                }}
                              />
                            )}
                            <div>
                              <strong>{provider.name}</strong>
                              <small>{provider.email}</small>
                            </div>
                          </div>
                        </td>
                        <td>{provider.service_type}</td>
                        <td>{provider.experience_years || 0} years</td>
                        <td>{new Date(provider.created_at).toLocaleDateString()}</td>
                        <td>
                          <button 
                            className="action-btn approve"
                            onClick={() => approveProvider(provider.provider_id)}
                          >
                            <FiCheck /> Approve
                          </button>
                          <button 
                            className="action-btn reject"
                            onClick={() => rejectProvider(provider.provider_id)}
                          >
                            <FiXCircle /> Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-data">
                <p>No pending provider approvals</p>
              </div>
            )}
          </div>
        );
      
      case 'settings':
        return (
          <div className="content-section">
            <h2>System Settings</h2>
            <div className="settings-form">
              <div className="form-group">
                <label>Site Name</label>
                <input type="text" defaultValue="Smart Services" />
              </div>
              <div className="form-group">
                <label>Maintenance Mode</label>
                <select>
                  <option value="false">Disabled</option>
                  <option value="true">Enabled</option>
                </select>
              </div>
              <div className="form-group">
                <label>Default User Role</label>
                <select>
                  <option value="user">User</option>
                  <option value="provider">Provider</option>
                </select>
              </div>
              <button 
                className="save-btn"
                onClick={() => showToast('Settings saved successfully!', 'success')}
              >
                Save Settings
              </button>
            </div>
          </div>
        );
      
      default: // Dashboard
        return (
          <div className="content-section">
            <h2>Dashboard Overview</h2>
            <div className="stats-cards">
              <div className="stat-card">
                <div className="stat-icon users">
                  <FiUsers />
                </div>
                <div className="stat-info">
                  <h3>Total Users</h3>
                  <p>{stats.totalUsers}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon providers">
                  <FiUserCheck />
                </div>
                <div className="stat-info">
                  <h3>Providers</h3>
                  <p>{stats.totalProviders}</p>
                </div>
              </div>
              {/* <div className="stat-card">
                <div className="stat-icon revenue">
                  <FiDollarSign />
                </div>
                <div className="stat-info">
                  <h3>Total Revenue</h3>
                  <p>${stats.totalRevenue.toLocaleString()}</p>
                </div>
              </div> */}
              <div className="stat-card">
                <div className="stat-icon pending">
                  <FiUsers />
                </div>
                <div className="stat-info">
                  <h3>Pending Approvals</h3>
                  <p>{stats.pendingApprovals}</p>
                </div>
              </div>
            </div>
            
            <div className="recent-activity">
              <div className="section-header">
                <h3>Recent Pending Providers</h3>
                {pendingProviders.length > 0 && (
                  <button 
                    className="view-all-btn"
                    onClick={() => setActiveTab('providers')}
                  >
                    View All
                  </button>
                )}
              </div>
              
              {pendingProviders.length > 0 ? (
                <div className="activity-list">
                  {pendingProviders.slice(0, 3).map(provider => (
                    <div className="activity-item" key={provider.provider_id}>
                      <div className="activity-icon">
                        <FiUserCheck />
                      </div>
                      <div className="activity-content">
                        <p>
                          <strong>{provider.name}</strong> - {provider.service_type} 
                          {provider.experience_years && ` (${provider.experience_years} years experience)`}
                        </p>
                        <small>Registered on {new Date(provider.created_at).toLocaleDateString()}</small>
                      </div>
                      <div className="activity-actions">
                        <button 
                          className="action-btn approve"
                          onClick={() => approveProvider(provider.provider_id)}
                        >
                          <FiCheck />
                        </button>
                        <button 
                          className="action-btn reject"
                          onClick={() => rejectProvider(provider.provider_id)}
                        >
                          <FiXCircle />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-data">
                  <p>No recent pending providers</p>
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="admin-dashboard">
      {/* Top Navigation Bar */}
      <header className="top-bar">
        <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <FiX /> : <FiMenu />}
        </button>
        <h1>
          {activeTab === 'dashboard' ? 'Dashboard' : 
           activeTab === 'providers' ? 'Provider Approvals' : 
           activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
        </h1>
        <div className="user-profile">
          <img 
            src="https://smartservices.com/profiles/admin.jpg" 
            alt="Admin"
            onError={(e) => {
              e.target.src = 'https://isobarscience.com/wp-content/uploads/2020/09/default-profile-picture1.jpg';
            }}
          />
          <span>Admin User</span>
        </div>
      </header>

      {/* Sidebar - Now positioned below the top bar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>SmartServices</h2>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li 
              className={activeTab === 'dashboard' ? 'active' : ''} 
              onClick={() => {
                setActiveTab('dashboard');
                setSidebarOpen(false);
              }}
            >
              <FiPieChart />
              <span>Dashboard</span>
            </li>
            <li 
              className={activeTab === 'users' ? 'active' : ''} 
              onClick={() => {
                setActiveTab('users');
                setSidebarOpen(false);
              }}
            >
              <FiUsers />
              <span>Users</span>
            </li>
            <li 
              className={activeTab === 'providers' ? 'active' : ''} 
              onClick={() => {
                setActiveTab('providers');
                setSidebarOpen(false);
              }}
            >
              <FiUserCheck />
              <span>Provider Approvals</span>
              {stats.pendingApprovals > 0 && (
                <span className="badge">{stats.pendingApprovals}</span>
              )}
            </li>
            {/* <li 
              className={activeTab === 'settings' ? 'active' : ''} 
              onClick={() => {
                setActiveTab('settings');
                setSidebarOpen(false);
              }}
            >
              <FiSettings />
              <span>Settings</span>
            </li> */}
          </ul>
        </nav>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;