/*global chrome*/
import React from "react";
import { useEffect, useState } from "react";
import "./App.css";
import {
  Router,
  getCurrent,
  getComponentStack,
} from "react-chrome-extension-router";
import NotifsContext from "./context/useNotifs";
import NotificationPage from "./pages/NotificationPage/NotificationPage";
import Home from "./pages/HomePage/HomePage";

console.log = function () {};
function App() {
  const [registered, setRegistered] = useState(false);
  const [walletAddr, setWalletAddr] = useState(null);
  const [notifs, setNotifs] = useState([]);
  useEffect(() => {
    const { component, props } = getCurrent();
    const components = getComponentStack();
    chrome.storage.local.get(["epns"], function (result) {
      if (result.epns) {
        setWalletAddr(result.epns.wallet);
        setRegistered(true);
      }
    });
  });
  if (!registered)
    return (
      <NotifsContext.Provider value={[notifs, setNotifs]}>
        <Router>
          <Home />
        </Router>
      </NotifsContext.Provider>
    );
  else
    return (
      <NotifsContext.Provider value={[notifs, setNotifs]}>
        <Router>
          <NotificationPage />
        </Router>
      </NotifsContext.Provider>
    );
}

export default App;
