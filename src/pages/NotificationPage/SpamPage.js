/* eslint-disable no-unused-expressions */
/*global chrome*/
import React, { useContext, useEffect, useState } from "react";
import Config from "../../config";
import { convertAddressToAddrCaipForNotifs } from "../../utils/utils";
import * as PushAPI from "@pushprotocol/restapi";
import NotifsContext from "../../context/useNotifs";
import { NotificationItem } from "@pushprotocol/uiweb";
import { Waypoint } from "react-waypoint";
import Spinner from "../../assests/Spinner.svg";
import { Loader } from "./InboxPage";
import SearchFilter from "../../components/SearchFilter";
import { FiSearch, FiSliders } from "react-icons/fi";
import { useClickAway } from "react-use";
import styled from "styled-components";
import { Item } from "../../utils/SharedStyling";
import { BsFillExclamationCircleFill } from "react-icons/bs";
import RefreshContext from "../../context/useRefresh";

const NOTIFICATIONS_PER_PAGE = 10;

const NotifItem = ({
  notifs,
  // load,
  showWayPoint,
  handlePagination,
  // bottomLoading,
  // loading,
}) => {
  return (
    <>
      {notifs.map((oneNotification, index) => {
        const { cta, title, message, app, icon, image, blockchain, url } =
          oneNotification;
        // render the notification item
        return (
          <div style={{ margin: "0px 0px" }} key={index}>
            {showWayPoint(index) && <Waypoint onEnter={handlePagination} />}

            <NotificationItem
              notificationTitle={title}
              notificationBody={message}
              cta={cta}
              app={app}
              icon={icon}
              image={image}
              chainName={blockchain}
              url={url}
            />
          </div>
        );
      })}

      {/* {bottomLoading && !loading && <Loader load={load} />} */}
    </>
  );
};

const Illustration = (props) => {
  const { text, body } = props;
  return (
    <div className="illustration">
      <BsFillExclamationCircleFill
        color="#D1D5DB"
        size={140}
        className="icon-empty"
        style={{
          border: "1px solid #d6d3d1",
          borderRadius: "100%",
          padding: "1px",
        }}
      />
      <div className="slide-left description-texts regular">
        <span className="regular">{text}</span>
        {body && (
          <p id="decription">
            Visit{" "}
            <a
              href="https://app.push.org/"
              target="_blank"
              rel="noreferrer"
              className="link-home"
            >
              app.push.org
            </a>{" "}
            from a <b>Web3 Enabled Browser</b> to opt-in to your favorite{" "}
            <b>channels</b> and start receiving <b>notifications</b>.
          </p>
        )}
      </div>
    </div>
  );
};

const SpamPage = ({ wallet, setWallet }) => {
  const [bottomLoading, setBottomLoading] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [allNotf, setNotif] = React.useState([]);
  const [notifs, setNotifs] = useContext(NotifsContext);
  const [pageSpam, setPageSpam] = useState(1);

  // filter states
  const [showFilter, setShowFilter] = useState(false);
  const [search, setSearch] = useState("");
  // const [allSpam, setSpam] = React.useState([]);
  const [filter, setFilter] = React.useState(false);
  const [allFilter, setAllFilter] = React.useState([]);
  const toggleShowFilter = () => setShowFilter((prev) => !prev);
  // const toggleSetActive = () => setActiveTab((prev) => !prev);
  const [loadFilter, setLoadFilter] = React.useState(false);
  const [filteredNotifications, setFilteredNotifications] = React.useState([]);

  const [refresh, setRefresh] = useContext(RefreshContext);

  useEffect(() => {
    callLatestSpam();
    fetchAllSpamNotif();
  }, [wallet]);

  const fetchSpam = async () => {
    if (bottomLoading) return;
    setBottomLoading(true);

    const addressChain = convertAddressToAddrCaipForNotifs(
      wallet,
      Config.chainID
    );

    try {
      const results = await PushAPI.user.getFeeds({
        user: addressChain, // user address in CAIP
        env: Config.env,
        page: pageSpam,
        limit: NOTIFICATIONS_PER_PAGE,
        spam: true,
        raw: true,
      });

      chrome.extension.getBackgroundPage().console.log("third", pageSpam);
      const parsedResponse = PushAPI.utils.parseApiResponse(results);
      let newData = [...notifs.spam, ...parsedResponse];
      setNotifs((x) => {
        return { ...x, spam: newData };
      });
    } catch (err) {
      console.log(err);
    } finally {
      setBottomLoading(false);
    }
  };

  const callLatestSpam = async () => {
    if (loading || bottomLoading) return;
    setBottomLoading(true);
    setLoading(true);

    const addressChain = convertAddressToAddrCaipForNotifs(
      wallet,
      Config.chainID
    );

    try {
      const results = await PushAPI.user.getFeeds({
        user: addressChain, // user address in CAIP
        env: Config.env,
        page: 1,
        limit: NOTIFICATIONS_PER_PAGE,
        spam: true,
        raw: true,
      });

      if (!notifs?.spam?.length) {
        chrome.extension.getBackgroundPage().console.log("increase");
        setPageSpam(pageSpam + 1);
      }

      const parsedResponse = PushAPI.utils.parseApiResponse(results);
      setWallet(wallet);
      setNotifs((x) => {
        return { ...x, spam: [...parsedResponse] };
      });
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
      setBottomLoading(false);
    }
  };

  const fetchAllSpamNotif = async () => {
    const addressChain = convertAddressToAddrCaipForNotifs(
      wallet,
      Config.chainID
    );

    try {
      const results = await PushAPI.user.getFeeds({
        user: addressChain, // user address in CAIP
        env: Config.env,
        limit: 100000,
        page: 1,
        raw: true,
        spam: true,
      });

      const parsedResponse = PushAPI.utils.parseApiResponse(results);
      const map1 = new Map();
      const map2 = new Map();
      results.forEach((each) => {
        map1.set(each.payload.data.sid, each.epoch);
        map2.set(each.payload.data.sid, each.sender);
      });
      parsedResponse.forEach((each) => {
        each["date"] = map1.get(each.sid);
        each["epoch"] = new Date(each["date"]).getTime() / 1000;
        each["channel"] = map2.get(each.sid);
      });
      setNotif([...parsedResponse]);
    } catch (err) {
      console.log(err);
    }
  };

  //function to query more notifications
  const handlePagination = async () => {
    if (notifs?.spam.length < 10) return;
    fetchSpam();
    setPageSpam(pageSpam + 1);
  };

  const showWayPoint = (index) => {
    return Number(index) === notifs?.spam.length - 1 && !loading;
  };

  const modalRef = React.useRef(null);
  useClickAway(modalRef, () => showFilter && setShowFilter(false));

  const reset = () => setFilter(false);
  const filterNotifications = async (query, channels, startDate, endDate) => {
    if (startDate == null) startDate = new Date("January 1, 2000");
    if (endDate == null) endDate = new Date("January 1, 3000");
    startDate = startDate.getTime() / 1000;
    endDate = endDate.getTime() / 1000;

    if (loading) return;
    setLoading(true);
    setFilter(true);
    var Filter = {
      channels: channels,
      date: { lowDate: startDate, highDate: endDate },
    };
    if (channels.length == 0) delete Filter.channels;

    setFilteredNotifications([]);
    try {
      let filterNotif = [];
      for (const notif of allNotf) {
        let timestamp;
        const matches = notif.message.match(/\[timestamp:(.*?)\]/);
        if (matches) {
          timestamp = matches[1];
        } else timestamp = notif.epoch;
        if (
          (Filter.channels === undefined
            ? true
            : Filter.channels.includes(notif.channel)) &&
          timestamp >= startDate &&
          timestamp <= endDate &&
          (query === "" ||
            notif.message.toLowerCase().includes(query.toLowerCase()))
        )
          filterNotif.push(notif);
      }
      const newNotifs = filterNotif;
      setAllFilter(newNotifs);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
      setShowFilter(false);
    }
  };

  React.useEffect(() => {
    setFilteredNotifications(allFilter);
  }, [allFilter]);

  useEffect(() => {
    if (search.length === 0) {
      reset();
      callLatestSpam();
    }
  }, [search]);

  React.useEffect(() => {
    if (refresh) {
      callLatestSpam();
    }
    setRefresh(false);
  }, [refresh]);

  return (
    <div className="new-space">
      {/* searchbar */}
      <SearchContainer>
        <SearchBar
          type="text"
          className="input"
          placeholder="Search Notification"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
          }}
        />
        <ItemIcon position="absolute" top="0" bottom="0" left="22px">
          <FiSearch size={18} style={{ color: "#657795" }} />
        </ItemIcon>

        <ItemIconRotate
          position="absolute"
          top="0"
          bottom="0"
          right="22px"
          onClick={toggleShowFilter}
        >
          <FiSliders size={18} style={{ color: "#657795" }} />
        </ItemIconRotate>
      </SearchContainer>

      <div ref={modalRef}>
        <SearchFilter
          notifications={allNotf}
          filterNotifications={filterNotifications}
          filter={filter}
          reset={reset}
          loadFilter={loadFilter}
          showFilter={showFilter}
          setShowFilter={setShowFilter}
          search={search}
          setSearch={setSearch}
        />
      </div>

      {/* loader */}
      {loading && <Loader load="bottom" />}

      {/* feeds */}
      {notifs.spam && !loading && !filter && (
        <NotifItem
          notifs={notifs.spam}
          load="bottom"
          showWayPoint={showWayPoint}
          handlePagination={handlePagination}
          bottomLoading={bottomLoading}
          loading={loading}
        />
      )}

      {/* filtered feeds */}
      {filter && allFilter.length > 0 && !loading && (
        <NotifItem
          notifs={filteredNotifications}
          load="bottom"
          showWayPoint={showWayPoint}
          // handlePagination={handlePagination}
          // bottomLoading={bottomLoading}
          // loading={loading}
        />
      )}

      {/* no feeds yet */}
      {!loading && notifs.spam.length == 0 && !filter && (
        <Illustration text="NO SPAM NOTIFICATIONS!" body={false} />
      )}

      {/* no filtered feeds found */}
      {filter && allFilter.length == 0 && !loading && (
        <div className="no-item">No items match your search</div>
      )}

      {bottomLoading && !loading && <Loader load={"bottom"} />}
    </div>
  );
};

// css styles
const SearchContainer = styled(Item)`
  position: relative;
  max-width: 466px;
  // min-width: 320px;
  width: 100%;
  box-sizing: border-box;
  margin: 10px auto;
`;

const SearchBar = styled.input`
  width: 100%;
  height: 44px;
  padding-left: 50px;
  border-radius: 99px;
  border: none;
  background: #f4f5fa;
  color: #657795;

  box-sizing: border-box;
  font-style: normal;
  font-weight: 400;
  font-size: 16px;
  line-height: 150%;

  input[type="reset"] {
    display: none;
  }
  &::placeholder {
    color: #657795;
  }
  &:hover,
  &:active,
  &:focus {
    outline: none;
  }
  &:focus {
    // border: 1px solid #ec008c;
  }
`;

const ItemIcon = styled(Item)`
  cursor: pointer;
`;

const ItemIconRotate = styled(Item)`
  cursor: pointer;
  transform: rotate(90deg);
`;

export default SpamPage;
