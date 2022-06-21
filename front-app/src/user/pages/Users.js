import React, { useEffect, useState } from "react";

import UsersList from "../components/UsersList";

import LoadingSpinner from "../../shared/components/UIElements/LoadingSpinner";
import { useHttpClient } from "../../shared/hooks/http-hook";
import axios from "axios";

const Users = () => {
  const { isLoading, error, sendRequest, clearError } = useHttpClient();
  const [loadedUsers, setLoadedUsers] = useState();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        axios
          .get("/backend/api/users")
          .then((response) => {
            const responseData = response.data;
            console.log(responseData.users);
            setLoadedUsers(responseData.users);
          })
          .catch((err) => {
            console.log(err);
          });
      } catch (err) {}
    };
    fetchUsers();
  }, [sendRequest]);

  return (
    <React.Fragment>
      {isLoading && (
        <div className="center">
          <LoadingSpinner />
        </div>
      )}
      {!isLoading && loadedUsers && <UsersList items={loadedUsers} />}
    </React.Fragment>
  );
};

export default Users;
