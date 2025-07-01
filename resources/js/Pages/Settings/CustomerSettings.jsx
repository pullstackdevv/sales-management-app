import { useState } from "react";
import TableComponent from "../../components/ui/table/TableComponent";
import { Button } from "flowbite-react";

const ToggleSwitch = ({ checked, onChange }) => (
  <label className="inline-flex items-center cursor-pointer">
    <input
      type="checkbox"
      className="sr-only peer"
      checked={checked}
      onChange={onChange}
    />
    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-blue-600 relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
  </label>
);

export default function CustomerSettings() {
  const [saveWithoutZip, setSaveWithoutZip] = useState(true);
  const [showCustomerID, setShowCustomerID] = useState(false);
  const [categories, setCategories] = useState([
    { name: "Customer", status: true, grosir: false, diskon: false },
    { name: "Dropshipper", status: true, grosir: false, diskon: false },
    { name: "Reseller", status: true, grosir: false, diskon: false },
  ]);

  const handleCategoryChange = (index, field) => {
    const updated = [...categories];
    updated[index][field] = !updated[index][field];
    setCategories(updated);
  };

  const columns = [
    { key: "name", label: "Nama Kategori" },
    {
      key: "status",
      label: "Status",
      render: (_, i) => (
        <ToggleSwitch
          checked={categories[i].status}
          onChange={() => handleCategoryChange(i, "status")}
        />
      ),
    },
    {
      key: "grosir",
      label: "Grosir",
      render: (_, i) => (
        <input
          type="checkbox"
          checked={categories[i].grosir}
          onChange={() => handleCategoryChange(i, "grosir")}
        />
      ),
    },
    {
      key: "diskon",
      label: "Diskon",
      render: (_, i) => (
        <input
          type="checkbox"
          checked={categories[i].diskon}
          onChange={() => handleCategoryChange(i, "diskon")}
        />
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Pengaturan Customer</h2>
        <Button className="bg-primary text-white px-4 py-2 rounded-md text-sm hover:bg-primary/90">
          Simpan Pengaturan
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <label className="font-medium">Simpan Customer Tanpa Kode Pos</label>
            <p className="text-xs text-gray-500 mt-1">
              ON: Input kode pos customer diperbolehkan kosong
            </p>
          </div>
          <ToggleSwitch
            checked={saveWithoutZip}
            onChange={() => setSaveWithoutZip(!saveWithoutZip)}
          />
        </div>

        <div className="mb-6">
          <h3 className="font-semibold mb-2">Kategori Customer</h3>
          <p className="text-xs text-gray-500 mb-3">
            Anda dapat menambahkan hingga 3 custom kategori customer
          </p>
          <TableComponent columns={columns} data={categories} />
          <Button className="border border-primary text-primary px-3 py-1 rounded text-sm hover:bg-gray-100 mt-2">
            + Tambah Kategori
          </Button>
        </div>

        <div className="flex items-center justify-between mt-4">
          <label className="font-medium">Tampilkan ID ketika download customer</label>
          <ToggleSwitch
            checked={showCustomerID}
            onChange={() => setShowCustomerID(!showCustomerID)}
          />
        </div>
      </div>
    </div>
  );
}
