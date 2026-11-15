
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

import EventsManagement from "./EventsManagement";
import TempleContent from "./TempleContent";
import GalleryManagement from "./GalleryManagement";
import AnnouncementsManagement from "./AnnouncementsManagement";
import EventCatalogManagement from "./EventCatalogManagement";
import DonationsManagement from "./DonationsManagement";
import SubscriptionsManagement from "./SubscriptionsManagement";
import WorshipScheduleManagement from "./WorshipScheduleManagement";
import FinanceManagement from "./FinanceManagement";
import TempleInfoManagement from "./TempleInfoManagement";
import MessagesManagement from "./MessagesManagement";
import HighlightsManagement from "./HighlightsManagement";

import "./AdminDashboard.css";
import BackToTopButton from "../components/BackToTopButton";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePanel, setActivePanel] = useState(null);

  // Check authenticated admin
  useEffect(() => {
    let mounted = true;

    const checkAdmin = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error || !user) {
          if (mounted) {
            navigate("/admin/login", { replace: true });
          }
          return;
        }

        if (mounted) {
          setAdmin(user);
        }
      } catch (error) {
        console.error("Authentication error:", error);

        if (mounted) {
          navigate("/admin/login", { replace: true });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkAdmin();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  // Admin logout
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      navigate("/admin/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error.message);
      alert("Unable to logout. Please try again.");
    }
  };

  // Loading screen
  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loader"></div>
        <p>Loading Admin Dashboard...</p>
      </div>
    );
  }

  // Prevent dashboard from rendering without authentication
  if (!admin) {
    return null;
  }

  return (
    <div className="admin-dashboard">

      {/* Dashboard Header */}
      <header className="admin-dashboard-header">

        <div className="admin-header-left admin-header-brand">
          <img className="admin-header-emblem" src="/emblem.svg" alt="" />
          <div>
            <h1>Dhoom Vivekananda Samiti — Administration</h1>
            <p>Management Dashboard</p>
          </div>
        </div>

        <div className="admin-header-right">
          <div className="admin-user-info">
            <span className="admin-user-icon">👤</span>

            <div>
              <strong>Administrator</strong>
              <small>{admin.email}</small>
            </div>
          </div>

          <button type="button" className="admin-main-site-btn" onClick={() => navigate('/')}>
            ← Back to Main Site
          </button>

          <button
            type="button"
            className="admin-logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>

      </header>

      {/* Dashboard Welcome */}
      <section className="admin-welcome">
        <h2>Welcome to Temple Admin Panel</h2>
        <p>
          Manage temple information, events, gallery images,
          and announcements from one place.
        </p>
      </section>

      <section className="admin-management-selector" id="admin-menu" aria-label="Management sections">
        {[['temple', '🏛️ Temple Content', 'Update temple information'], ['events', '📅 Events', 'Add, edit, publish, and delete events'], ['gallery', '🖼️ Gallery', 'Manage gallery images'], ['announcements', '📢 Announcements', 'Manage temple notices'], ['catalog', '📋 Yearly Event List', 'Names used in the Events drop-down'], ['donations', '💰 Donations', 'Office entry, verify online donations'], ['subscriptions', '🔁 Monthly Subscriptions', 'Subscribers and monthly payments'], ['worship', '🕉️ Worship Schedule', 'Daily / weekly worship and temple hours'], ['finance', '📊 Income & Expenditure', 'Ledger, expenses, reports'], ['info', '📇 Temple Info & Contacts', 'Banner message, address, Panjika, committee'], ['highlights', '🪔 Mission & Deities', 'About section cards'], ['messages', '✉️ Messages', 'Messages from the website']].map(([key, label, description]) => <button type="button" className={activePanel === key ? 'management-selector-btn active' : 'management-selector-btn'} onClick={() => setActivePanel(activePanel === key ? null : key)} key={key} aria-expanded={activePanel === key}><strong>{label}</strong><span>{description}</span></button>)}
      </section>

      {activePanel === 'temple' && <section className="admin-dashboard-section" id="temple-content"><div className="admin-section-heading"><h2>🏛️ Temple Content Management</h2><p>Update temple information in English and Bengali.</p></div><TempleContent /></section>}
      {activePanel === 'events' && <section className="admin-dashboard-section" id="events-management"><div className="admin-section-heading"><h2>📅 Events Management</h2><p>Create, update, publish, and delete temple events.</p></div><EventsManagement /></section>}
      {activePanel === 'gallery' && <section className="admin-dashboard-section" id="gallery-management"><div className="admin-section-heading"><h2>🖼️ Gallery Management</h2><p>Add, edit, publish, and delete gallery images.</p></div><GalleryManagement /></section>}
      {activePanel === 'announcements' && <section className="admin-dashboard-section" id="announcements-management"><div className="admin-section-heading"><h2>📢 Announcements Management</h2><p>Create and publish important temple notices.</p></div><AnnouncementsManagement /></section>}

      {activePanel === 'catalog' && <section className="admin-dashboard-section" id="event-catalog-management"><div className="admin-section-heading"><h2>📋 Yearly Event List / বার্ষিক অনুষ্ঠান-তালিকা</h2><p>Add, edit or hide the event names that appear in the Events form.</p></div><EventCatalogManagement /></section>}
      {activePanel === 'donations' && <section className="admin-dashboard-section" id="donations-management"><div className="admin-section-heading"><h2>💰 Donations / দান</h2><p>Record donations received at the office and verify online donations.</p></div><DonationsManagement /></section>}
      {activePanel === 'subscriptions' && <section className="admin-dashboard-section" id="subscriptions-management"><div className="admin-section-heading"><h2>🔁 Monthly Subscriptions / মাসিক চাঁদা</h2><p>Approve subscribers and record each month's payment.</p></div><SubscriptionsManagement /></section>}

      {activePanel === 'worship' && <section className="admin-dashboard-section" id="worship-management"><div className="admin-section-heading"><h2>🕉️ Worship Schedule / পূজার সময়সূচি</h2><p>Daily and weekly worship times shown on the website.</p></div><WorshipScheduleManagement /></section>}
      {activePanel === 'finance' && <section className="admin-dashboard-section" id="finance-management"><div className="admin-section-heading"><h2>📊 Income & Expenditure / আয়-ব্যয়</h2><p>Every taka and dollar in one ledger: donations, subscriptions, other income and expenses.</p></div><FinanceManagement /></section>}
      {activePanel === 'info' && <section className="admin-dashboard-section" id="info-management"><div className="admin-section-heading"><h2>📇 Temple Info & Contacts / মন্দিরের তথ্য</h2><p>Address, phone, email, Panjika link and committee contacts.</p></div><TempleInfoManagement /></section>}
      {activePanel === 'highlights' && <section className="admin-dashboard-section" id="highlights-management"><div className="admin-section-heading"><h2>🪔 Mission & Deities / লক্ষ্য ও দেবদেবী</h2><p>Cards shown in the About part of the website.</p></div><HighlightsManagement /></section>}
      {activePanel === 'messages' && <section className="admin-dashboard-section" id="messages-management"><div className="admin-section-heading"><h2>✉️ Messages / বার্তা</h2><p>Messages sent from the website contact form.</p></div><MessagesManagement /></section>}

      {/* Back to the dashboard menu (keeps the open form and its unsaved text) */}
      <BackToTopButton label="Dashboard menu" targetId="admin-menu" showAfter={400} />

      {/* Dashboard Footer */}
      <footer className="admin-dashboard-footer">
        <p>
          © {new Date().getFullYear()} RbcTcsWorld · All rights reserved.
          All Rights Reserved.
        </p>
      </footer>

    </div>
  );
};

export default AdminDashboard;
