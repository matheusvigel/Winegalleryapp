import { createBrowserRouter } from "react-router";
import Root from "./components/Root";
import RegionsView from "./components/RegionsView";
import CountryDetail from "./components/CountryDetail";
import RegionDetail from "./components/RegionDetail";
import BrandsView from "./components/BrandsView";
import GrapesView from "./components/GrapesView";
import Profile from "./components/Profile";

// Admin backoffice
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./components/admin/AdminDashboard";
import CountriesPage from "./components/admin/countries/CountriesPage";
import CountryForm from "./components/admin/countries/CountryForm";
import RegionsPage from "./components/admin/regions/RegionsPage";
import RegionForm from "./components/admin/regions/RegionForm";
import CollectionsPage from "./components/admin/collections/CollectionsPage";
import CollectionForm from "./components/admin/collections/CollectionForm";
import ItemsPage from "./components/admin/items/ItemsPage";
import ItemForm from "./components/admin/items/ItemForm";
import BrandsPage from "./components/admin/brands/BrandsPage";
import BrandForm from "./components/admin/brands/BrandForm";
import GrapesPage from "./components/admin/grapes/GrapesPage";
import GrapeForm from "./components/admin/grapes/GrapeForm";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: RegionsView },
      { path: "country/:countryId", Component: CountryDetail },
      { path: "region/:regionId", Component: RegionDetail },
      { path: "brands", Component: BrandsView },
      { path: "brand/:brandId", Component: RegionDetail },
      { path: "grapes", Component: GrapesView },
      { path: "grape/:grapeId", Component: RegionDetail },
      { path: "profile", Component: Profile },
    ],
  },
  {
    path: "/admin",
    Component: AdminLayout,
    children: [
      { index: true, Component: AdminDashboard },
      { path: "countries", Component: CountriesPage },
      { path: "countries/new", Component: CountryForm },
      { path: "countries/:id/edit", Component: CountryForm },
      { path: "regions", Component: RegionsPage },
      { path: "regions/new", Component: RegionForm },
      { path: "regions/:id/edit", Component: RegionForm },
      { path: "collections", Component: CollectionsPage },
      { path: "collections/new", Component: CollectionForm },
      { path: "collections/:id/edit", Component: CollectionForm },
      { path: "items", Component: ItemsPage },
      { path: "items/new", Component: ItemForm },
      { path: "items/:id/edit", Component: ItemForm },
      { path: "brands", Component: BrandsPage },
      { path: "brands/new", Component: BrandForm },
      { path: "brands/:id/edit", Component: BrandForm },
      { path: "grapes", Component: GrapesPage },
      { path: "grapes/new", Component: GrapeForm },
      { path: "grapes/:id/edit", Component: GrapeForm },
    ],
  },
]);