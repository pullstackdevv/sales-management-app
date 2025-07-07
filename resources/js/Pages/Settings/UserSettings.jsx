import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import TableComponent from "../../components/ui/table/TableComponent";
import { Button } from "flowbite-react";
import api from "@/api/axios"; // pastikan sudah buat file ini seperti penjelasan sebelumnya

export default function UserSettings() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.get("/users/index")
      .then((res) => {
        setUsers(res.data.data); 
      })
      .catch((err) => console.error(err));
  }, []);

  console.log(users);
  
  const columns = [
    {
      key: "no",
      label: "No",
      render: (_, i) => <span>{i + 1}.</span>,
    },
    {
      key: "name",
      label: "Nama",
      render: (row) => <b>{row.name}</b>,
    },
    { key: "email", label: "Email" },
    { key: "role", label: "Role" },
    {
      key: "priv",
      label: "Privileges",
      render: () => (
        <span className="bg-gray-200 px-2 py-1 rounded text-xs">-</span>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex gap-2 text-lg">
          <Button className="text-primary hover:text-primary/80">
            <Icon icon="mdi:pencil" />
          </Button>
          <Button className="text-red-600 hover:text-red-800">
            <Icon icon="mdi:trash-can-outline" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Pengaturan User</h2>
        <Button className="bg-primary text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-primary/90 text-sm">
          <Icon icon="mdi:plus" width={18} />
          Tambah User
        </Button>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <TableComponent columns={columns} data={users} />
      </div>
    </div>
  );
}
