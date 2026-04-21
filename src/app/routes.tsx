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
import BrotherhoodsAdmin from "./backoffice/pages/Brotherhoods";
import QuizAdmin from "./backoffice/pages/QuizAdmin";
import UsersAdmin from "./backoffice/pages/Users";
import PlacesAdmin from "./backoffice/pages/Places";
import ProfileRulesAdmin from "./backoffice/pages/ProfileRules";
import ProfilesAdmin from "./backoffice/pages/ProfilesAdmin";
import AdminsAdmin from "./backoffice/pages/Admins";

import Explore from "./pages/Explore";
import SearchPage from "./pages/SearchPage";
import Achievements from "./pages/Achievements";
import WineDetail from "./pages/WineDetail";
import WineryDetail from "./pages/WineryDetail";
import PlaceDetail from "./pages/PlaceDetail";
import CollectionDetail from "./pages/CollectionDetail";
import Brotherhoods from "./pages/Brotherhoods";
import BrotherhoodDetail from "./pages/BrotherhoodDetail";

export const router = createBrowserRouter([
  // ── Auth (standalone, no shell) ───────────────────────────
  { path: "/login",      Component: Login      },
  { path: "/register",   Component: Register   },
  { path: "/onboarding", Component: Onboarding },

  // ── Admin ─────────────────────────────────────────────────
  {
    path: "/admin",
    element: (
      <AdminGuard>
        <BackofficeLayout />
      </AdminGuard>
    ),
    children: [
      { index: true,           Component: Dashboard   },
      { path: "countries",     Component: Countries   },
      { path: "regions",       Component: Regions     },
      { path: "collections",   Component: Collections },
      { path: "wines",         Component: Wines       },
      { path: "brands",        Component: Brands      },
      { path: "grapes",        Component: Grapes      },
      { path: "experiences",   Component: Experiences       },
      { path: "highlights",    Component: Highlights        },
      { path: "brotherhoods",  Component: BrotherhoodsAdmin },
      { path: "quiz",          Component: QuizAdmin         },
      { path: "admins",        Component: AdminsAdmin       },
      { path: "users",         Component: UsersAdmin        },
      { path: "places",        Component: PlacesAdmin       },
      { path: "profile-rules",  Component: ProfileRulesAdmin },
      { path: "wine-profiles",  Component: ProfilesAdmin     },
    ],
  },

  // ── App shell (Root = top navbar desktop + bottom nav mobile) ─
  {
    path: "/",
    Component: Root,
    children: [
      { index: true,                    Component: Home              },
      { path: "explore",                Component: Explore           },
      { path: "search",                 Component: SearchPage        },
      { path: "achievements",           Component: Achievements      },
      { path: "brotherhoods",           Component: Brotherhoods      },
      { path: "brotherhoods/:id",       Component: BrotherhoodDetail },
      { path: "brotherhoods/catalog/:id", Component: BrotherhoodDetail },
      { path: "wine/:id",               Component: WineDetail        },
      { path: "collection/:id",         Component: CollectionDetail  },
      { path: "regions",                Component: RegionsView       },
      { path: "country/:countryId",     Component: CountryDetail     },
      { path: "region/:regionId",       Component: RegionDetail      },
      { path: "brands",                 Component: BrandsView        },
      { path: "brand/:brandId",         Component: WineryDetail      },
      { path: "winery/:wineryId",       Component: WineryDetail      },
      { path: "place/:placeId",         Component: PlaceDetail       },
      { path: "grapes",                 Component: GrapesView        },
      { path: "grape/:grapeId",         Component: RegionDetail      },
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
