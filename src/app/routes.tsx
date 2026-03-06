import { createBrowserRouter } from "react-router";
import Root from "./components/Root";
import Home from "./components/Home";
import RegionsView from "./components/RegionsView";
import CountryDetail from "./components/CountryDetail";
import RegionDetail from "./components/RegionDetail";
import BrandsView from "./components/BrandsView";
import GrapesView from "./components/GrapesView";
import Profile from "./components/Profile";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import Onboarding from "./components/auth/Onboarding";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import AdminGuard from "./backoffice/AdminGuard";
import BackofficeLayout from "./backoffice/BackofficeLayout";
import Dashboard from "./backoffice/pages/Dashboard";
import Countries from "./backoffice/pages/Countries";
import Regions from "./backoffice/pages/Regions";
import Collections from "./backoffice/pages/Collections";
import Wines from "./backoffice/pages/Wines";
import Brands from "./backoffice/pages/Brands";
import Grapes from "./backoffice/pages/Grapes";
import Experiences from "./backoffice/pages/Experiences";
import Highlights from "./backoffice/pages/Highlights";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/register",
    Component: Register,
  },
  {
    path: "/onboarding",
    Component: Onboarding,
  },
  {
    path: "/admin",
    element: (
      <AdminGuard>
        <BackofficeLayout />
      </AdminGuard>
    ),
    children: [
      { index: true, Component: Dashboard },
      { path: "countries", Component: Countries },
      { path: "regions", Component: Regions },
      { path: "collections", Component: Collections },
      { path: "wines", Component: Wines },
      { path: "brands", Component: Brands },
      { path: "grapes", Component: Grapes },
      { path: "experiences", Component: Experiences },
      { path: "highlights", Component: Highlights },
    ],
  },
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "regions", Component: RegionsView },
      { path: "country/:countryId", Component: CountryDetail },
      { path: "region/:regionId", Component: RegionDetail },
      { path: "brands", Component: BrandsView },
      { path: "brand/:brandId", Component: RegionDetail },
      { path: "grapes", Component: GrapesView },
      { path: "grape/:grapeId", Component: RegionDetail },
      {
        path: "profile",
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
