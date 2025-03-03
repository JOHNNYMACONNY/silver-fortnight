import { Routes, Route } from 'react-router-dom';
import { Profile } from './pages/Profile';
import { BannerPreview } from './pages/BannerPreview';
import { Messages } from './pages/Messages';
import { Discover } from './pages/Discover';
import { CreateProject } from './pages/CreateProject';
import { CreateTrade } from './pages/CreateTrade';
import { ProtectedRoute } from './components/ProtectedRoute';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/banner/:bannerId/preview" element={<BannerPreview />} />
      
      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Discover />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/messages/:id" element={<Messages />} />
        <Route path="/create-project" element={<CreateProject />} />
        <Route path="/create-trade" element={<CreateTrade />} />
      </Route>
    </Routes>
  );
}
