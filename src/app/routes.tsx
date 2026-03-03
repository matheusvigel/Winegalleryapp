import { createBrowserRouter } from "react-router";
import Root from "./components/Root";
import RegionsView from "./components/RegionsView";
import CountryDetail from "./components/CountryDetail";
import RegionDetail from "./components/RegionDetail";
import BrandsView from "./components/BrandsView";
import GrapesView from "./components/GrapesView";
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
      { path: "brand/:brandId", Component: RegionDetail }, // Reuse RegionDetail for now
      { path: "grapes", Component: GrapesView },
      { path: "grape/:grapeId", Component: RegionDetail }, // Reuse RegionDetail for now
      { path: "profile", Component: Profile },
    ],
  },
]);