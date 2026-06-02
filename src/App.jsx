import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './portal/AuthContext'

// Landing page sections
import Nav from './components/Nav'
import Hero from './components/Hero'
import WhyMe from './components/WhyMe'
import About from './components/About'
import Services from './components/Services'
import HowItWorks from './components/HowItWorks'
import Packages from './components/Packages'
import Testimonials from './components/Testimonials'
import Experience from './components/Experience'
import Skills from './components/Skills'
import Booking from './components/Booking'
import CtaBand from './components/CtaBand'
import Contact from './components/Contact'
import Footer from './components/Footer'

// Portal pages
import Login from './portal/Login'
import PortalLayout from './portal/PortalLayout'
import ClientDashboard from './portal/ClientDashboard'
import AdminDashboard from './portal/AdminDashboard'
import TaskList from './portal/TaskList'
import TaskDetail from './portal/TaskDetail'
import NewTask from './portal/NewTask'
import ClientList from './portal/ClientList'
import Calendar from './portal/Calendar'
import Analytics from './portal/Analytics'
import Invoices from './portal/Invoices'

function LandingPage() {
  return (
    <>
      <Nav />
      <Hero />
      <WhyMe />
      <About />
      <Services />
      <HowItWorks />
      <Packages />
      <Testimonials />
      <Experience />
      <Skills />
      <Booking />
      <CtaBand />
      <Contact />
      <Footer />
    </>
  )
}

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'Inter'}}>Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/portal" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />

          {/* Client Portal */}
          <Route path="/portal" element={
            <ProtectedRoute><PortalLayout><ClientDashboard /></PortalLayout></ProtectedRoute>
          } />
          <Route path="/portal/tasks" element={
            <ProtectedRoute><PortalLayout><TaskList /></PortalLayout></ProtectedRoute>
          } />
          <Route path="/portal/tasks/new" element={
            <ProtectedRoute><PortalLayout><NewTask /></PortalLayout></ProtectedRoute>
          } />
          <Route path="/portal/tasks/:id" element={
            <ProtectedRoute><PortalLayout><TaskDetail /></PortalLayout></ProtectedRoute>
          } />

          {/* Admin Portal */}
          <Route path="/admin" element={
            <ProtectedRoute adminOnly><PortalLayout><AdminDashboard /></PortalLayout></ProtectedRoute>
          } />
          <Route path="/admin/tasks" element={
            <ProtectedRoute adminOnly><PortalLayout><TaskList /></PortalLayout></ProtectedRoute>
          } />
          <Route path="/admin/tasks/:id" element={
            <ProtectedRoute adminOnly><PortalLayout><TaskDetail /></PortalLayout></ProtectedRoute>
          } />
          <Route path="/admin/calendar" element={
            <ProtectedRoute adminOnly><PortalLayout><Calendar /></PortalLayout></ProtectedRoute>
          } />
          <Route path="/admin/clients" element={
            <ProtectedRoute adminOnly><PortalLayout><ClientList /></PortalLayout></ProtectedRoute>
          } />
          <Route path="/admin/analytics" element={
            <ProtectedRoute adminOnly><PortalLayout><Analytics /></PortalLayout></ProtectedRoute>
          } />
          <Route path="/admin/invoices" element={
            <ProtectedRoute adminOnly><PortalLayout><Invoices /></PortalLayout></ProtectedRoute>
          } />
          <Route path="/portal/invoices" element={
            <ProtectedRoute><PortalLayout><Invoices /></PortalLayout></ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
