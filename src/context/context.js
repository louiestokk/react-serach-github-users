import React, { useState, useEffect } from "react";
import mockUser from "./mockData.js/mockUser";
import mockRepos from "./mockData.js/mockRepos";
import mockFollowers from "./mockData.js/mockFollowers";
import axios from "axios";

const rootUrl = "https://api.github.com";

const GithubContext = React.createContext();

//Provider, Consumer - GithubContext.Provider
const GithubProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState(mockUser);
  const [repos, setRepos] = useState(mockRepos);
  const [followers, setFollowers] = useState(mockFollowers);
  const [requests, setRequests] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({ show: false, msg: "" });
  const searchGithubUser = async (user) => {
    toggleError();
    setLoading(true);
    try {
      const resp = await axios(`${rootUrl}/users/${user}`);
      if (resp) {
        setGithubUser(resp.data);
        const { login, followers_url } = resp.data;
        await Promise.allSettled([
          axios(`${rootUrl}/users/${login}/repos?per_page=100`),
          ,
          axios(`${followers_url}?per_page=100`),
        ]).then((results) => {
          const [repos, followers] = results;
          const status = "fullfilled";
          if (followers.status === status) {
            setRepos(repos.value.data);
          }
          if (followers.status === status) {
            setFollowers(followers.value.data);
          }
        });
      }
      checkRequest();
      setLoading(false);
    } catch (error) {
      console.error(error);
      toggleError(true, "there is no user with that username");
    }
  };
  const checkRequest = () => {
    axios(`${rootUrl}/rate_limit`)
      .then(({ data }) => {
        let {
          rate: { remaining },
        } = data;
        setRequests(remaining);
        if (remaining === 0) {
          toggleError(true, "sorry, you have exided your hourly rate limit");
        }
      })
      .catch((err) => {
        console.error(err);
      });
  };
  const toggleError = (show = false, msg = "") => {
    setError({ show, msg });
  };
  useEffect(checkRequest, []);

  return (
    <GithubContext.Provider
      value={{
        githubUser,
        repos,
        followers,
        requests,
        error,
        searchGithubUser,
        loading,
      }}
    >
      {children}
    </GithubContext.Provider>
  );
};

export { GithubProvider, GithubContext };
