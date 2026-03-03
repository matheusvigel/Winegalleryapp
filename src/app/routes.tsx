import { createBrowserRouter } from "react-router";
import Root from "./components/Root";
import RegionsView from "./components/RegionsView";
import CountryDetail from "./components/CountryDetail";
import RegionDetail from "./components/RegionDetail";
import BrandsView from "./components/BrandsView";
import BrandDetail from "./components/BrandDetail";
import GrapesView from "./components/GrapesView";
import GrapeDetail from "./components/GrapeDetail";
import Profile from "./components/Profile";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: RegionsView },
      { path: "country/:countryId", Component: CountryDetail },
      { path: "region/:regionId", Component: RegionDetail },
      { path: "brands", Component: BrandsView },
      { path: "brand/:brandId", Component: BrandDetail },
      { path: "grapes", Component: GrapesView },
      { path: "grape/:grapeId", Component: GrapeDetail },
      { path: "profile", Component: Profile },
    ],
  },
]);