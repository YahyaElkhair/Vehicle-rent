import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppContext } from "./Context/AppContext";
import { useContext } from "react";

import Layout from "./Pages/Layout";
import Home from "./Pages/Home";
import Register from "./Pages/Auth/Register";
import Login from "./Pages/Auth/Login";
import Create from "./Pages/Posts/Create";
import Show from "./Pages/Posts/Show";
import Update from "./Pages/Posts/Update";
import AdminDashboard from "./Pages/Admin/AdminDashboard"
import Vehicles from "./Pages/Vehicles";
import VehicleDetailPage from "./Pages/VehicleDetailPage";

// Agency
import Dashboard from "./Pages/Agency/Dashboard";
import CreateAgency from "./Pages/Agency/CreateAgency";
import AgencyVehicles from "./Pages/Agency/AgencyVehicles";
import AgencyPostsManager from "./Pages/Agency/AgencyPostsManager";

import ManagerLayout from "./Layouts/ManagerLayout";
import PostView from "./Pages/Agency/PostView";
import PostEdit from "./Pages/Agency/PostEdit";

import PostCreate from "./Pages/Agency/PostCreate";
import VehicleCreate from "./Pages/Agency/VehicleCreate";
import AgencyManagerProfile from "./Pages/Agency/AgencyManagerProfile";




export default function App() {
  const { user } = useContext(AppContext);



  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />

          <Route path="register" element={user ? <Home /> : <Register />} />
          <Route path="login" element={user ? <Home /> : <Login />} />
          <Route path="vehicles" element={<Vehicles />} />

          <Route path="create" element={user ? <Create /> : <Login />} />

          <Route path="posts">
            <Route path=":id" element={<VehicleDetailPage />} />
            {/* <Route path="update/:id" element={user ? <Update /> : <Login />} /> */}
          </Route>


          <Route path="admin" element={user ? <AdminDashboard /> : <Login />}>
          </Route>

          <Route path="error" element={<div>Error: Unauthorized Access</div>} />

          <Route
            path="manager/new-agency"
            element={
              user
                ? user.roles[0].name === "agency manager"
                  ? <CreateAgency />
                  : <Navigate to="/error" />
                : <Login />
            }
          />

        </Route>



        {/* Manager Routes : */}
        <Route path="manager" element={user ? <ManagerLayout /> : <Login />}>

          <Route
            index
            path="dashboard"
            element={
              user
                ? user.roles[0].name === "agency manager"
                  ? <Dashboard />
                  : <Navigate to="/error" />
                : <Login />
            }
          />

          <Route
            path="posts"
            element={
              user
                ? user.roles[0].name === "agency manager"
                  ? <AgencyPostsManager />
                  : <Navigate to="/error" />
                : <Login />
            }
          />

          <Route path="post">
            <Route path="create" element={<PostCreate />} />
            <Route path=":id" element={<PostView />} />
            <Route path="edit/:id" element={<PostEdit />} />
          </Route>

          <Route
            path="vehicles"
            element={
              user
                ? user.roles[0].name === "agency manager"
                  ? <AgencyVehicles />
                  : <Navigate to="/error" />
                : <Login />
            }
          />



          <Route path="vehicle">
            <Route path="create" element={<VehicleCreate />} />
          </Route>

          <Route
            path="profile"
            element={
              user
                ? user.roles[0].name === "agency manager"
                  ? <AgencyManagerProfile />
                  : <Navigate to="/error" />
                : <Login />
            }
          />



        </Route>


      </Routes>
    </BrowserRouter>
  );
}