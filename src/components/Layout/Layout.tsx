// Layout wrapper component.
// Provides a consistent page structure with Navbar at the top,
// a scrollable main content area, and Footer at the bottom.
import { ReactNode } from 'react';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="layout">
      <Navbar />
      {/* Main content area with top margin to account for the fixed navbar */}
      <main className="layout-content">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
